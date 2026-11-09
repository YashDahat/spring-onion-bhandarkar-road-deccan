package com.webappfoundation.restaurant.catalog;

import com.webappfoundation.catalog.CatalogItemResolver;
import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.model.MenuItem;
import com.webappfoundation.restaurant.repository.MenuItemRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Maps a {@link MenuItem} to the universal sellable contract (itemType "DISH"). */
@Component
public class DishCatalogResolver implements CatalogItemResolver {

    private final MenuItemRepository repository;

    public DishCatalogResolver(MenuItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public String itemType() {
        return RestaurantConstants.DISH;
    }

    @Override
    public List<CatalogItemDto> resolve(Collection<Long> ids) {
        return repository.findByIdIn(ids).stream().filter(MenuItem::isActive).map(DishCatalogResolver::toDto).toList();
    }

    public static CatalogItemDto toDto(MenuItem m) {
        Map<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("diet", m.getDiet().name());
        attrs.put("spiceLevel", m.getSpiceLevel());
        attrs.put("course", m.getCourse().name());
        attrs.put("signature", m.isSignature());
        return CatalogItemDto.builder()
                .itemType(RestaurantConstants.DISH)
                .itemId(m.getId())
                .name(m.getName())
                .description(m.getDescription())
                .price(m.getPrice())
                .imageUrl(m.getImageUrl())
                .slug(m.getSlug())
                .detailPath("/menu?dish=" + m.getSlug())
                .category(m.getCuisine().name())
                .active(m.isActive())
                .cartable(true)
                .workflowCode(m.getWorkflowCode())
                .attributes(attrs)
                .build();
    }
}
