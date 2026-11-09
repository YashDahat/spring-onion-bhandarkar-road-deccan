package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A guest's saved dish or wok, referenced polymorphically by (itemType, itemId). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "favourite", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "itemType", "itemId"}))
public class Favourite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private String itemType;

    @Column(nullable = false)
    private Long itemId;

    private Instant createdAt;
}
