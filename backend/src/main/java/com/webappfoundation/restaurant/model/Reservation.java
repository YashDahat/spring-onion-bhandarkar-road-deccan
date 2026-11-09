package com.webappfoundation.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A table booking request (sellable itemType "TABLE", ₹0). Its lifecycle runs on the "table" workflow through
 * the order spine — {@code orderId} links to that order, whose current stage is the booking status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer userId;

    private Long branchId;

    @Column(nullable = false)
    private LocalDate reservationDate;

    @Column(nullable = false)
    private LocalTime slotTime;

    @Column(nullable = false)
    private int partySize;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Occasion occasion = Occasion.NONE;

    @Column(length = 500)
    private String note;

    private String contactName;

    private String contactPhone;

    private Long orderId;

    private Instant createdAt;
}
