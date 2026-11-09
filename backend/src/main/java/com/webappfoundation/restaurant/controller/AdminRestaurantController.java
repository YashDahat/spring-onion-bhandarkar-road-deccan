package com.webappfoundation.restaurant.controller;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.restaurant.dto.RestaurantDtos.*;
import com.webappfoundation.restaurant.service.MenuService;
import com.webappfoundation.restaurant.service.ReservationService;
import com.webappfoundation.restaurant.service.StoryService;
import com.webappfoundation.restaurant.service.WokService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Admin management for the restaurant domain. ADMIN-gated by SecurityConfig (/api/v1/admin/**); writes audited in services. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminRestaurantController {

    private final MenuService menuService;
    private final WokService wokService;
    private final StoryService storyService;
    private final ReservationService reservationService;

    public AdminRestaurantController(MenuService menuService, WokService wokService, StoryService storyService,
                                     ReservationService reservationService) {
        this.menuService = menuService;
        this.wokService = wokService;
        this.storyService = storyService;
        this.reservationService = reservationService;
    }

    // ── Menu ──
    @GetMapping("/menu")
    public List<MenuItemDto> menu() { return menuService.adminList(); }

    @PostMapping("/menu")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemDto createDish(@RequestBody UpsertMenuItemRequest r) { return menuService.create(r); }

    @PutMapping("/menu/{id}")
    public MenuItemDto updateDish(@PathVariable Long id, @RequestBody UpsertMenuItemRequest r) { return menuService.update(id, r); }

    @DeleteMapping("/menu/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDish(@PathVariable Long id) { menuService.delete(id); }

    @PostMapping("/menu/bulk-upload")
    public BulkUploadResult bulkMenu(@RequestParam("file") MultipartFile file) { return menuService.bulkImport(file); }

    // ── Wok bar options ──
    @GetMapping("/wok-options")
    public List<WokOptionDto> wokOptions() { return wokService.adminList(); }

    @PostMapping("/wok-options")
    @ResponseStatus(HttpStatus.CREATED)
    public WokOptionDto createOption(@RequestBody UpsertWokOptionRequest r) { return wokService.create(r); }

    @PutMapping("/wok-options/{id}")
    public WokOptionDto updateOption(@PathVariable Long id, @RequestBody UpsertWokOptionRequest r) { return wokService.update(id, r); }

    @DeleteMapping("/wok-options/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateOption(@PathVariable Long id) { wokService.deactivate(id); }

    @PostMapping("/wok-options/bulk-upload")
    public BulkUploadResult bulkWok(@RequestParam("file") MultipartFile file) { return wokService.bulkImport(file); }

    // ── Story ──
    @GetMapping("/story")
    public List<StoryChapterDto> story() { return storyService.adminList(); }

    @PostMapping("/story")
    @ResponseStatus(HttpStatus.CREATED)
    public StoryChapterDto createChapter(@RequestBody UpsertStoryChapterRequest r) { return storyService.create(r); }

    @PutMapping("/story/{id}")
    public StoryChapterDto updateChapter(@PathVariable Long id, @RequestBody UpsertStoryChapterRequest r) { return storyService.update(id, r); }

    @DeleteMapping("/story/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChapter(@PathVariable Long id) { storyService.delete(id); }

    @PostMapping("/story/bulk-upload")
    public BulkUploadResult bulkStory(@RequestParam("file") MultipartFile file) { return storyService.bulkImport(file); }

    // ── Reservations (read-only list; status changes happen on the order board, "table" workflow) ──
    @GetMapping("/reservations")
    public List<ReservationDto> reservations() { return reservationService.adminList(); }
}
