package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Records that a guest claimed a passport milestone (once per milestone). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "passport_claim", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "milestone"}))
public class PassportClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private int milestone;

    private String offerCode;

    private Instant createdAt;
}
