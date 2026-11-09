package com.webappfoundation.restaurant.controller;

import com.webappfoundation.restaurant.dto.RestaurantDtos.*;
import com.webappfoundation.restaurant.service.FavouriteService;
import com.webappfoundation.restaurant.service.PassportService;
import com.webappfoundation.restaurant.service.ReservationService;
import com.webappfoundation.restaurant.service.TrackingService;
import com.webappfoundation.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Signed-in guest endpoints: favourites, table bookings, the Oriental Passport and live tracking. */
@RestController
@RequestMapping("/api/v1")
public class RestaurantGuestController {

    private final FavouriteService favouriteService;
    private final ReservationService reservationService;
    private final PassportService passportService;
    private final TrackingService trackingService;

    public RestaurantGuestController(FavouriteService favouriteService, ReservationService reservationService,
                                     PassportService passportService, TrackingService trackingService) {
        this.favouriteService = favouriteService;
        this.reservationService = reservationService;
        this.passportService = passportService;
        this.trackingService = trackingService;
    }

    @GetMapping("/favourites")
    public List<FavouriteDto> favourites(@CurrentUser Integer userId) {
        return favouriteService.list(userId);
    }

    @PostMapping("/favourites/toggle")
    public ToggleFavouriteResult toggle(@CurrentUser Integer userId, @RequestBody ToggleFavouriteRequest request) {
        return favouriteService.toggle(userId, request);
    }

    @GetMapping("/reservations")
    public List<ReservationDto> myReservations(@CurrentUser Integer userId) {
        return reservationService.mine(userId);
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationDto book(@CurrentUser Integer userId, @RequestBody CreateReservationRequest request) {
        return reservationService.create(userId, request);
    }

    @PostMapping("/reservations/{id}/cancel")
    public ReservationDto cancel(@CurrentUser Integer userId, @PathVariable Long id) {
        return reservationService.cancel(userId, id);
    }

    @GetMapping("/passport")
    public PassportDto passport(@CurrentUser Integer userId) {
        return passportService.get(userId);
    }

    @PostMapping("/passport/milestones/{milestone}/claim")
    public ClaimMilestoneResult claim(@CurrentUser Integer userId, @PathVariable int milestone) {
        return passportService.claim(userId, milestone);
    }

    @GetMapping("/track/{orderId}")
    public TrackDto track(@CurrentUser Integer userId, @PathVariable Long orderId) {
        return trackingService.track(userId, orderId);
    }
}
