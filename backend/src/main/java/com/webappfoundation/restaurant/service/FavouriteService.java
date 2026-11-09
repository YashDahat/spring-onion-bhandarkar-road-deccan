package com.webappfoundation.restaurant.service;

import com.webappfoundation.catalog.CatalogService;
import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.dto.RestaurantDtos.FavouriteDto;
import com.webappfoundation.restaurant.dto.RestaurantDtos.ToggleFavouriteRequest;
import com.webappfoundation.restaurant.dto.RestaurantDtos.ToggleFavouriteResult;
import com.webappfoundation.restaurant.model.Favourite;
import com.webappfoundation.restaurant.repository.FavouriteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.webappfoundation.restaurant.RestaurantUtil.bad;
import static com.webappfoundation.restaurant.RestaurantUtil.requireUser;

/** Saved dishes and woks — the source of the one-tap "my usual" reorder. */
@Service
public class FavouriteService {

    private static final Set<String> ALLOWED = Set.of(RestaurantConstants.DISH, RestaurantConstants.WOK);

    private final FavouriteRepository repository;
    private final CatalogService catalogService;

    public FavouriteService(FavouriteRepository repository, CatalogService catalogService) {
        this.repository = repository;
        this.catalogService = catalogService;
    }

    @Transactional(readOnly = true)
    public List<FavouriteDto> list(Integer userId) {
        requireUser(userId);
        List<Favourite> favs = repository.findByUserIdOrderByCreatedAtDesc(userId);
        List<CatalogService.ItemRef> refs = favs.stream().map(f -> new CatalogService.ItemRef(f.getItemType(), f.getItemId())).toList();
        Map<String, CatalogItemDto> resolved = new HashMap<>();
        for (CatalogItemDto dto : catalogService.resolveMixed(refs)) {
            resolved.put(dto.getItemType() + ":" + dto.getItemId(), dto);
        }
        return favs.stream()
                .map(f -> new FavouriteDto(f.getId(), f.getItemType(), f.getItemId(),
                        resolved.get(f.getItemType() + ":" + f.getItemId()), f.getCreatedAt()))
                .filter(f -> f.item() != null)
                .toList();
    }

    @Transactional
    public ToggleFavouriteResult toggle(Integer userId, ToggleFavouriteRequest req) {
        requireUser(userId);
        if (req == null || req.itemType() == null || req.itemId() == null || !ALLOWED.contains(req.itemType())) {
            throw bad("Only dishes and woks can be saved");
        }
        var existing = repository.findByUserIdAndItemTypeAndItemId(userId, req.itemType(), req.itemId());
        if (existing.isPresent()) {
            repository.delete(existing.get());
            return new ToggleFavouriteResult(false);
        }
        if (catalogService.resolveOne(req.itemType(), req.itemId()) == null) {
            throw bad("That item isn't on the menu right now");
        }
        repository.save(Favourite.builder().userId(userId).itemType(req.itemType()).itemId(req.itemId())
                .createdAt(Instant.now()).build());
        return new ToggleFavouriteResult(true);
    }
}
