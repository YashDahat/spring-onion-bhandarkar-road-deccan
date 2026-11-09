package com.webappfoundation.restaurant.controller;

import com.webappfoundation.restaurant.dto.RestaurantDtos.*;
import com.webappfoundation.restaurant.model.Cuisine;
import com.webappfoundation.restaurant.model.DietType;
import com.webappfoundation.restaurant.service.MenuService;
import com.webappfoundation.restaurant.service.ReservationService;
import com.webappfoundation.restaurant.service.StoryService;
import com.webappfoundation.restaurant.service.WokService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Public, read-mostly endpoints: menu, wok bar, story and table availability. */
@RestController
@RequestMapping("/api/v1")
public class RestaurantPublicController {

    private final MenuService menuService;
    private final WokService wokService;
    private final StoryService storyService;
    private final ReservationService reservationService;

    public RestaurantPublicController(MenuService menuService, WokService wokService, StoryService storyService,
                                      ReservationService reservationService) {
        this.menuService = menuService;
        this.wokService = wokService;
        this.storyService = storyService;
        this.reservationService = reservationService;
    }

    @GetMapping("/menu")
    public List<MenuItemDto> menu(@RequestParam(required = false) Cuisine cuisine,
                                  @RequestParam(required = false) DietType diet,
                                  @RequestParam(required = false) String q,
                                  @RequestParam(required = false) Long branchId) {
        return menuService.listPublic(cuisine, diet, q, branchId);
    }

    @GetMapping("/wok/options")
    public List<WokOptionDto> wokOptions() {
        return wokService.activeOptions();
    }

    /** Saves (or re-uses) a wok build and returns its server-side price. Open to guests so they can build before logging in. */
    @PostMapping("/wok/build")
    public WokComboDto build(@RequestBody WokBuildRequest request) {
        return wokService.build(request);
    }

    @GetMapping("/wok/combos/{id}")
    public WokComboDto combo(@PathVariable Long id) {
        return wokService.get(id);
    }

    @GetMapping("/story")
    public List<StoryChapterDto> story() {
        return storyService.listPublic();
    }

    @GetMapping("/reservations/availability")
    public List<SlotDto> availability(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                      @RequestParam(required = false) Long branchId) {
        return reservationService.availability(date, branchId);
    }
}
