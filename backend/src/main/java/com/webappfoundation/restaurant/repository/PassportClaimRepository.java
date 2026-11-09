package com.webappfoundation.restaurant.repository;

import com.webappfoundation.restaurant.model.PassportClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PassportClaimRepository extends JpaRepository<PassportClaim, Long> {
    List<PassportClaim> findByUserId(Integer userId);
    boolean existsByUserIdAndMilestone(Integer userId, int milestone);
}
