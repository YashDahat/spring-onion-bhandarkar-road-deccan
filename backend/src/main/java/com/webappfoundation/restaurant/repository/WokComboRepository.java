package com.webappfoundation.restaurant.repository;

import com.webappfoundation.restaurant.model.WokCombo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WokComboRepository extends JpaRepository<WokCombo, Long> {
    Optional<WokCombo> findBySignature(String signature);
    List<WokCombo> findByIdIn(Collection<Long> ids);
}
