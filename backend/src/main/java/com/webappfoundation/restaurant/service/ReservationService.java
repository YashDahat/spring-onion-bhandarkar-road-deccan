package com.webappfoundation.restaurant.service;

import com.webappfoundation.dto.CartLineInput;
import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.dto.PlaceOrderRequest;
import com.webappfoundation.model.FulfillmentType;
import com.webappfoundation.model.Order;
import com.webappfoundation.model.PaymentMode;
import com.webappfoundation.model.WorkflowStage;
import com.webappfoundation.repository.OrderRepository;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.dto.RestaurantDtos.CreateReservationRequest;
import com.webappfoundation.restaurant.dto.RestaurantDtos.ReservationDto;
import com.webappfoundation.restaurant.dto.RestaurantDtos.SlotDto;
import com.webappfoundation.restaurant.model.Occasion;
import com.webappfoundation.restaurant.model.Reservation;
import com.webappfoundation.restaurant.repository.ReservationRepository;
import com.webappfoundation.service.AuditActions;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.OrderService;
import com.webappfoundation.service.WorkflowService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

import static com.webappfoundation.restaurant.RestaurantUtil.*;

/**
 * Table bookings. A booking is a ₹0 "TABLE" sellable placed through the fenced order spine on the "table"
 * workflow, so the host confirms / seats / closes it on the order board and the guest sees live status.
 * Capacity is a simple covers-per-slot budget per outlet (bookings in a cancelled or no-show stage free their seats).
 */
@Service
public class ReservationService {

    public static final int MAX_PARTY = 12;
    public static final int MAX_DAYS_AHEAD = 30;
    public static final int MIN_LEAD_MINUTES = 60;
    private static final Set<String> RELEASED = Set.of("CANCELLED", "NO_SHOW");
    private static final DateTimeFormatter LABEL = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private final ReservationRepository repository;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final WorkflowService workflowService;
    private final AuditService auditService;
    private final int coversPerSlot;

    public ReservationService(ReservationRepository repository, OrderService orderService, OrderRepository orderRepository,
                              WorkflowService workflowService, AuditService auditService,
                              @Value("${restaurant.table.covers-per-slot:32}") int coversPerSlot) {
        this.repository = repository;
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.workflowService = workflowService;
        this.auditService = auditService;
        this.coversPerSlot = coversPerSlot;
    }

    /** Lunch 12:00–15:00 and dinner 19:00–22:30, every 30 minutes (kitchen hours 11:30–15:30, 18:30–23:30). */
    public static List<LocalTime> slotTimes() {
        List<LocalTime> out = new ArrayList<>();
        for (LocalTime t = LocalTime.of(12, 0); !t.isAfter(LocalTime.of(15, 0)); t = t.plusMinutes(30)) out.add(t);
        for (LocalTime t = LocalTime.of(19, 0); !t.isAfter(LocalTime.of(22, 30)); t = t.plusMinutes(30)) out.add(t);
        return out;
    }

    @Transactional(readOnly = true)
    public List<SlotDto> availability(LocalDate date, Long branchId) {
        if (date == null) throw bad("Pick a date");
        Map<LocalTime, Integer> booked = bookedCovers(date, branchId);
        ZonedDateTime now = ZonedDateTime.now(RestaurantConstants.ZONE);
        List<SlotDto> out = new ArrayList<>();
        for (LocalTime t : slotTimes()) {
            int left = Math.max(0, coversPerSlot - booked.getOrDefault(t, 0));
            boolean tooSoon = ZonedDateTime.of(date, t, RestaurantConstants.ZONE).isBefore(now.plusMinutes(MIN_LEAD_MINUTES));
            boolean outOfRange = date.isBefore(now.toLocalDate()) || date.isAfter(now.toLocalDate().plusDays(MAX_DAYS_AHEAD));
            out.add(new SlotDto(t.toString(), LABEL.format(t).toLowerCase(Locale.ENGLISH),
                    t.isBefore(LocalTime.of(16, 0)) ? "Lunch" : "Dinner", left, left > 0 && !tooSoon && !outOfRange));
        }
        return out;
    }

    @Transactional
    public ReservationDto create(Integer userId, CreateReservationRequest req) {
        requireUser(userId);
        if (req == null || req.date() == null || req.time() == null) throw bad("Pick a date and a time");
        LocalTime time;
        try {
            time = LocalTime.parse(req.time());
        } catch (DateTimeParseException e) {
            throw bad("Pick one of the listed times");
        }
        if (!slotTimes().contains(time)) throw bad("Pick one of the listed times");
        int party = req.partySize() == null ? 0 : req.partySize();
        if (party < 1) throw bad("How many guests?");
        if (party > MAX_PARTY) throw bad("For more than " + MAX_PARTY + " guests, please call us and we'll plan your group party");
        String name = blankToNull(req.contactName());
        String phone = req.contactPhone() == null ? null : req.contactPhone().replaceAll("[^0-9+]", "");
        if (name == null) throw bad("Who should we hold the table for?");
        if (phone == null || !phone.matches("(\\+91)?[6-9][0-9]{9}")) throw bad("Enter a 10-digit Indian mobile number");
        if (req.note() != null && req.note().length() > 500) throw bad("Keep the note under 500 characters");

        SlotDto slot = availability(req.date(), req.branchId()).stream()
                .filter(s -> s.time().equals(time.toString())).findFirst().orElseThrow(() -> bad("Pick one of the listed times"));
        if (!slot.available()) throw new ResponseStatusException(HttpStatus.CONFLICT, "That time isn't bookable any more — please pick another");
        if (slot.seatsLeft() < party) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only " + slot.seatsLeft() + " seats left at " + slot.label() + " — try another time");
        }

        Reservation r = repository.save(Reservation.builder().userId(userId).branchId(req.branchId())
                .reservationDate(req.date()).slotTime(time).partySize(party)
                .occasion(req.occasion() == null ? Occasion.NONE : req.occasion())
                .note(blankToNull(req.note())).contactName(name).contactPhone(phone).createdAt(Instant.now()).build());

        OrderDto order = orderService.placeOrder(userId, PlaceOrderRequest.builder()
                .items(List.of(CartLineInput.builder().itemType(RestaurantConstants.TABLE).itemId(r.getId()).quantity(1).build()))
                .branchId(req.branchId())
                .fulfillmentType(FulfillmentType.SELF_PICKUP)
                .paymentMode(PaymentMode.PAY_AT_COUNTER)
                .build());
        r.setOrderId(order.getId());
        repository.save(r);
        auditService.record("TABLE_BOOKED", AuditActions.SUCCESS, "RESERVATION", String.valueOf(r.getId()),
                "date=" + r.getReservationDate() + " time=" + time + " party=" + party);
        return toDto(r, orderRepository.findById(order.getId()).orElse(null), order.isCancellable());
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> mine(Integer userId) {
        requireUser(userId);
        Map<Long, OrderDto> orders = new HashMap<>();
        for (OrderDto o : orderService.myOrders(userId)) orders.put(o.getId(), o);
        Map<Long, Order> raw = ordersById(repository.findByUserIdOrderByReservationDateDescSlotTimeDesc(userId));
        return repository.findByUserIdOrderByReservationDateDescSlotTimeDesc(userId).stream()
                .map(r -> {
                    OrderDto o = r.getOrderId() == null ? null : orders.get(r.getOrderId());
                    return toDto(r, raw.get(r.getOrderId()), o != null && o.isCancellable());
                }).toList();
    }

    @Transactional
    public ReservationDto cancel(Integer userId, Long id) {
        requireUser(userId);
        Reservation r = repository.findById(id).filter(x -> x.getUserId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (r.getOrderId() == null) throw bad("This booking can't be changed online — please call us");
        OrderDto o = orderService.cancel(r.getOrderId(), userId, "Cancelled by guest", false);
        auditService.record("TABLE_CANCELLED", AuditActions.SUCCESS, "RESERVATION", String.valueOf(id), "by=guest");
        return toDto(r, orderRepository.findById(o.getId()).orElse(null), o.isCancellable());
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> adminList() {
        List<Reservation> all = repository.findAllByOrderByReservationDateDescSlotTimeDesc();
        Map<Long, Order> raw = ordersById(all);
        return all.stream().map(r -> toDto(r, raw.get(r.getOrderId()), false)).toList();
    }

    private Map<LocalTime, Integer> bookedCovers(LocalDate date, Long branchId) {
        List<Reservation> sameDay = repository.findByReservationDate(date).stream()
                .filter(r -> Objects.equals(r.getBranchId(), branchId)).toList();
        Map<Long, Order> raw = ordersById(sameDay);
        Map<LocalTime, Integer> covers = new HashMap<>();
        for (Reservation r : sameDay) {
            Order o = raw.get(r.getOrderId());
            if (o != null && RELEASED.contains(o.getCurrentStageCode())) continue;
            covers.merge(r.getSlotTime(), r.getPartySize(), Integer::sum);
        }
        return covers;
    }

    private Map<Long, Order> ordersById(List<Reservation> rows) {
        List<Long> ids = rows.stream().map(Reservation::getOrderId).filter(Objects::nonNull).toList();
        Map<Long, Order> out = new HashMap<>();
        if (!ids.isEmpty()) orderRepository.findAllById(ids).forEach(o -> out.put(o.getId(), o));
        return out;
    }

    private ReservationDto toDto(Reservation r, Order order, boolean cancellable) {
        String code = order == null ? "REQUESTED" : order.getCurrentStageCode();
        String label = code;
        try {
            WorkflowStage s = workflowService.stage(RestaurantConstants.TABLE_WORKFLOW, code);
            label = s.getLabel();
        } catch (RuntimeException ignored) {
            // stage renamed in the builder — fall back to the code
        }
        return new ReservationDto(r.getId(), r.getReservationDate(), r.getSlotTime().toString(),
                LABEL.format(r.getSlotTime()).toLowerCase(Locale.ENGLISH), r.getPartySize(), r.getOccasion(), r.getNote(),
                r.getContactName(), r.getContactPhone(), r.getBranchId(), r.getOrderId(),
                order == null ? null : order.getOrderNumber(), code, label, cancellable, r.getCreatedAt());
    }
}
