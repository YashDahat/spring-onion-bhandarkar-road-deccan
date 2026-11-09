package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** One choice in the wok builder (a base, a protein, one of the house sauces, a veg add-on or a finish). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wok_option")
public class WokOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WokGroup groupCode;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    /** Base: the bowl price. Every other group: the price added on top. */
    @Column(nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DietType diet = DietType.VEG;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int sortOrder = 0;
}
