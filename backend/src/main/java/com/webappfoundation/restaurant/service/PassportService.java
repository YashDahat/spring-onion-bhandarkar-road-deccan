package com.webappfoundation.restaurant.service;

import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.model.Offer;
import com.webappfoundation.model.OfferTrigger;
import com.webappfoundation.model.PaymentState;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.dto.RestaurantDtos.*;
import com.webappfoundation.restaurant.model.MenuItem;
import com.webappfoundation.restaurant.model.PassportClaim;
import com.webappfoundation.restaurant.repository.MenuItemRepository;
import com.webappfoundation.restaurant.repository.PassportClaimRepository;
import com.webappfoundation.service.AuditActions;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.OfferService;
import com.webappfoundation.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

import static com.webappfoundation.restaurant.RestaurantUtil.bad;
import static com.webappfoundation.restaurant.RestaurantUtil.requireUser;

/**
 * The Oriental Passport: every passport dish a guest has eaten (in a paid, non-cancelled order) earns a hanko
 * stamp. Milestones at 4, 8 and 12 stamps unlock a reward through the fenced loyalty offer engine (MILESTONE
 * trigger) — so the admin's discount kill switch, budget and holdout rules all still apply.
 */
@Service
public class PassportService {

    private static final int[] MILESTONES = {4, 8, 12};

    private final MenuItemRepository menuRepository;
    private final PassportClaimRepository claimRepository;
    private final OrderService orderService;
    private final OfferService offerService;
    private final AuditService auditService;

    public PassportService(MenuItemRepository menuRepository, PassportClaimRepository claimRepository,
                           OrderService orderService, OfferService offerService, AuditService auditService) {
        this.menuRepository = menuRepository;
        this.claimRepository = claimRepository;
        this.orderService = orderService;
        this.offerService = offerService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PassportDto get(Integer userId) {
        requireUser(userId);
        List<MenuItem> dishes = menuRepository.findByPassportTrueAndActiveTrueOrderBySortOrderAsc();
        Map<Long, Instant> firstEaten = firstEaten(userId);
        List<StampDto> stamps = dishes.stream()
                .map(d -> new StampDto(d.getId(), d.getName(), d.getSlug(), d.getCuisine(), d.getDiet(), d.getImageUrl(),
                        firstEaten.containsKey(d.getId()), firstEaten.get(d.getId())))
                .toList();
        int count = (int) stamps.stream().filter(StampDto::stamped).count();
        Map<Integer, PassportClaim> claims = new HashMap<>();
        claimRepository.findByUserId(userId).forEach(c -> claims.put(c.getMilestone(), c));
        List<MilestoneDto> milestones = new ArrayList<>();
        for (int at : MILESTONES) {
            if (at > dishes.size()) continue;
            PassportClaim c = claims.get(at);
            milestones.add(new MilestoneDto(at, count >= at, c != null, c == null ? null : c.getOfferCode()));
        }
        return new PassportDto(count, dishes.size(), stamps, milestones);
    }

    @Transactional
    public ClaimMilestoneResult claim(Integer userId, int milestone) {
        requireUser(userId);
        if (Arrays.stream(MILESTONES).noneMatch(m -> m == milestone)) throw bad("Unknown milestone");
        PassportDto passport = get(userId);
        if (passport.stampedCount() < milestone) throw bad("Collect " + milestone + " stamps to unlock this reward");
        if (claimRepository.existsByUserIdAndMilestone(userId, milestone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You've already claimed this reward");
        }
        Offer offer = offerService.decideOffer(userId, OfferTrigger.MILESTONE, null);
        String code = offer == null ? null : offer.getCode();
        claimRepository.save(PassportClaim.builder().userId(userId).milestone(milestone).offerCode(code)
                .createdAt(Instant.now()).build());
        auditService.record("PASSPORT_MILESTONE_CLAIMED", AuditActions.SUCCESS, "PASSPORT", String.valueOf(userId),
                "milestone=" + milestone + " offerIssued=" + (code != null));
        String message = code != null
                ? "Your reward code is ready — it's also in your email. Use it at checkout."
                : "Milestone recorded! Rewards are paused right now, but your stamps and this milestone are saved.";
        return new ClaimMilestoneResult(milestone, code, message);
    }

    private Map<Long, Instant> firstEaten(Integer userId) {
        Map<Long, Instant> first = new HashMap<>();
        for (OrderDto o : orderService.myOrders(userId)) {
            if (o.getPaymentState() != PaymentState.PAID || "CANCELLED".equals(o.getCurrentStageCode())) continue;
            if (o.getItems() == null) continue;
            for (OrderDto.OrderItemDto i : o.getItems()) {
                if (!RestaurantConstants.DISH.equals(i.getItemType())) continue;
                first.merge(i.getItemId(), o.getCreatedAt(), (a, b) -> a == null ? b : (b == null || a.isBefore(b) ? a : b));
            }
        }
        return first;
    }
}
