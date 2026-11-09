package com.webappfoundation.restaurant.catalog;

import com.webappfoundation.catalog.CatalogItemResolver;
import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.dto.RestaurantDtos.WokComboDto;
import com.webappfoundation.restaurant.model.WokCombo;
import com.webappfoundation.restaurant.repository.WokComboRepository;
import com.webappfoundation.restaurant.service.WokPricing;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Maps a built {@link WokCombo} to the sellable contract (itemType "WOK"), re-priced from live options. */
@Component
public class WokCatalogResolver implements CatalogItemResolver {

    private final WokComboRepository comboRepository;
    private final WokPricing pricing;

    public WokCatalogResolver(WokComboRepository comboRepository, WokPricing pricing) {
        this.comboRepository = comboRepository;
        this.pricing = pricing;
    }

    @Override
    public String itemType() {
        return RestaurantConstants.WOK;
    }

    @Override
    public List<CatalogItemDto> resolve(Collection<Long> ids) {
        return comboRepository.findByIdIn(ids).stream()
                .map(pricing::describe)
                .filter(Objects::nonNull)
                .map(WokCatalogResolver::toDto)
                .toList();
    }

    private static CatalogItemDto toDto(WokComboDto w) {
        Map<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("diet", w.diet().name());
        attrs.put("spiceLevel", w.spiceLevel());
        attrs.put("summary", w.summary());
        return CatalogItemDto.builder()
                .itemType(RestaurantConstants.WOK)
                .itemId(w.id())
                .name(w.name())
                .description(w.summary())
                .price(w.price())
                .detailPath("/wok-bar?combo=" + w.id())
                .category("WOK_BAR")
                .active(true)
                .cartable(true)
                .workflowCode(RestaurantConstants.KITCHEN_WORKFLOW)
                .attributes(attrs)
                .build();
    }
}
