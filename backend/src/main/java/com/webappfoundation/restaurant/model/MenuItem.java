package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A dish on the Spring Onion menu (sellable itemType "DISH", mapped by DishCatalogResolver).
 * {@code branchIds} empty = served at every outlet; otherwise only at the listed branches.
 * {@code passport} marks the dishes that earn a stamp in the Oriental Passport.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "menu_item")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Cuisine cuisine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DietType diet;

    /** 0 = mild … 3 = fiery. */
    @Builder.Default
    private int spiceLevel = 0;

    @Builder.Default
    private boolean signature = false;

    @Builder.Default
    private boolean passport = false;

    /** Can be made Jain (no onion, garlic or root vegetables) on request. */
    @Builder.Default
    private boolean jainOption = false;

    private String imageUrl;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int sortOrder = 0;

    @Builder.Default
    private String workflowCode = "kitchen";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "menu_item_branches", joinColumns = @JoinColumn(name = "menu_item_id"))
    @Column(name = "branch_id")
    @Builder.Default
    private Set<Long> branchIds = new LinkedHashSet<>();

    private Instant createdAt;
    private Instant updatedAt;
}
