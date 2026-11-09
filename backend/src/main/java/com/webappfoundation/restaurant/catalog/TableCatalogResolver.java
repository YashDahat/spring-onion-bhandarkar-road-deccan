package com.webappfoundation.restaurant.catalog;

import com.webappfoundation.catalog.CatalogItemResolver;
import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.model.Reservation;
import com.webappfoundation.restaurant.repository.ReservationRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** A table booking as a ₹0 sellable (itemType "TABLE") so it runs on the "table" workflow. Not cartable. */
@Component
public class TableCatalogResolver implements CatalogItemResolver {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private final ReservationRepository repository;

    public TableCatalogResolver(ReservationRepository repository) {
        this.repository = repository;
    }

    @Override
    public String itemType() {
        return RestaurantConstants.TABLE;
    }

    @Override
    public List<CatalogItemDto> resolve(Collection<Long> ids) {
        return repository.findByIdIn(ids).stream().map(TableCatalogResolver::toDto).toList();
    }

    public static String title(Reservation r) {
        return "Table for " + r.getPartySize() + " · " + DATE.format(r.getReservationDate()) + ", "
                + TIME.format(r.getSlotTime()).toLowerCase(Locale.ENGLISH);
    }

    private static CatalogItemDto toDto(Reservation r) {
        return CatalogItemDto.builder()
                .itemType(RestaurantConstants.TABLE)
                .itemId(r.getId())
                .name(title(r))
                .price(BigDecimal.ZERO)
                .detailPath("/book")
                .category("TABLE")
                .active(true)
                .cartable(false)
                .workflowCode(RestaurantConstants.TABLE_WORKFLOW)
                .attributes(Map.<String, Object>of("partySize", r.getPartySize()))
                .build();
    }
}
