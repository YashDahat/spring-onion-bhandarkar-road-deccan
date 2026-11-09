package com.webappfoundation.restaurant.repository;

import com.webappfoundation.restaurant.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByIdIn(Collection<Long> ids);
    List<MenuItem> findByActiveTrueOrderBySortOrderAscNameAsc();
    List<MenuItem> findAllByOrderBySortOrderAscNameAsc();
    List<MenuItem> findByPassportTrueAndActiveTrueOrderBySortOrderAsc();
    Optional<MenuItem> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
