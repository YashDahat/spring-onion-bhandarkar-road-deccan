package com.webappfoundation.restaurant.repository;

import com.webappfoundation.restaurant.model.Favourite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavouriteRepository extends JpaRepository<Favourite, Long> {
    List<Favourite> findByUserIdOrderByCreatedAtDesc(Integer userId);
    Optional<Favourite> findByUserIdAndItemTypeAndItemId(Integer userId, String itemType, Long itemId);
}
