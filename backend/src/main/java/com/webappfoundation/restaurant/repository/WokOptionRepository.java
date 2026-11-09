package com.webappfoundation.restaurant.repository;

import com.webappfoundation.restaurant.model.WokGroup;
import com.webappfoundation.restaurant.model.WokOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WokOptionRepository extends JpaRepository<WokOption, Long> {
    List<WokOption> findByActiveTrueOrderByGroupCodeAscSortOrderAsc();
    List<WokOption> findAllByOrderByGroupCodeAscSortOrderAsc();
    boolean existsByGroupCodeAndNameIgnoreCase(WokGroup groupCode, String name);
}
