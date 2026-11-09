package com.webappfoundation.dto;

import com.webappfoundation.model.OfferTrigger;
import com.webappfoundation.model.OfferType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Stand-in for the foundation's missing UpdateOfferRequest (referenced by the fenced OfferAdminService /
 * AdminOfferController but absent from webapp-foundation). Fields mirror the foundation frontend type
 * {@code UpdateOfferRequest} in types/loyalty.ts. Reported upstream as a suspected foundation bug.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOfferRequest {
    private OfferTrigger trigger;
    private OfferType type;
    private BigDecimal value;
    private BigDecimal minSpend;
    private BigDecimal maxDiscount;
    private Integer maxUses;
    private Instant startsAt;
    private Instant expiresAt;
    private String campaignId;
}
