package com.webappfoundation.restaurant.catalog;

import com.webappfoundation.inventory.InventoryProvider;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.repository.MenuItemRepository;
import org.springframework.stereotype.Component;

/**
 * Dishes are cooked to order (no stock), but not every outlet serves every dish: availability follows the
 * dish's branch list (empty = all outlets). Reserve/commit/release are no-ops.
 */
@Component
public class DishInventoryProvider implements InventoryProvider {

    private final MenuItemRepository repository;

    public DishInventoryProvider(MenuItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public String itemType() {
        return RestaurantConstants.DISH;
    }

    @Override
    public boolean availableAt(Long itemId, Long branchId) {
        return repository.findById(itemId)
                .map(m -> m.isActive() && (branchId == null || m.getBranchIds() == null
                        || m.getBranchIds().isEmpty() || m.getBranchIds().contains(branchId)))
                .orElse(false);
    }

    @Override
    public void reserve(Long itemId, String variantKey, Long branchId, int qty) {
        // cooked to order — nothing to hold
    }

    @Override
    public void commit(Long itemId, String variantKey, Long branchId, int qty) {
        // cooked to order
    }

    @Override
    public void release(Long itemId, String variantKey, Long branchId, int qty) {
        // cooked to order
    }
}
