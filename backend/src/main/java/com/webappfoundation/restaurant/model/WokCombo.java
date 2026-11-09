package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A wok a guest has built (sellable itemType "WOK"). Immutable and de-duplicated by {@code signature}, so
 * the same build always maps to the same id — which is what makes favourites and one-tap reorder work.
 * The price is never stored: WokCatalogResolver re-prices it from the live options every time.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wok_combo")
public class WokCombo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String signature;

    @Column(nullable = false)
    private Long baseId;

    @Column(nullable = false)
    private Long proteinId;

    @Column(nullable = false)
    private Long sauceId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "wok_combo_addons", joinColumns = @JoinColumn(name = "wok_combo_id"))
    @OrderColumn(name = "addon_order")
    @Column(name = "option_id")
    @Builder.Default
    private List<Long> addOnIds = new ArrayList<>();

    /** 0 = mild … 3 = fiery. */
    private int spiceLevel;

    private Instant createdAt;
}
