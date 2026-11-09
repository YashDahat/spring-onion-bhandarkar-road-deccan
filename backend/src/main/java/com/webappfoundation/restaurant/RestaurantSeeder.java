package com.webappfoundation.restaurant;

import com.webappfoundation.connector.builtin.EmailConnector;
import com.webappfoundation.connector.demo.DemoDeliveryConnector;
import com.webappfoundation.connector.demo.DemoRefundConnector;
import com.webappfoundation.dto.UpsertBranchRequest;
import com.webappfoundation.dto.UpsertRecommendationRequest;
import com.webappfoundation.dto.WorkflowDto;
import com.webappfoundation.model.RecommendationType;
import com.webappfoundation.model.RefundPolicy;
import com.webappfoundation.model.Workflow;
import com.webappfoundation.repository.BranchRepository;
import com.webappfoundation.repository.WorkflowRepository;
import com.webappfoundation.restaurant.model.*;
import com.webappfoundation.restaurant.repository.MenuItemRepository;
import com.webappfoundation.restaurant.repository.StoryChapterRepository;
import com.webappfoundation.restaurant.repository.WokOptionRepository;
import com.webappfoundation.service.BranchService;
import com.webappfoundation.service.RecommendationService;
import com.webappfoundation.service.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static com.webappfoundation.restaurant.RestaurantUtil.slugify;

/**
 * Idempotent first-boot seed for Spring Onion: the two workflows it really runs (kitchen orders, table bookings),
 * the Bhandarkar Road outlet, the menu, the wok-bar options and the Our Story chapters. Runs after the foundation
 * seeds its workflows (@Order 0) and before loyalty bindings (@Order 50) and sprint bootstrap (@Order 100), so
 * the new workflows pick up loyalty connectors and an active sprint automatically.
 *
 * <p>Menu prices are indicative placeholders for the demo — the owner should confirm them in /admin/restaurant.
 */
@Component
public class RestaurantSeeder {

    private static final Logger log = LoggerFactory.getLogger(RestaurantSeeder.class);

    private final WorkflowRepository workflowRepository;
    private final WorkflowService workflowService;
    private final BranchRepository branchRepository;
    private final BranchService branchService;
    private final MenuItemRepository menuRepository;
    private final WokOptionRepository wokRepository;
    private final StoryChapterRepository storyRepository;
    private final RecommendationService recommendationService;

    public RestaurantSeeder(WorkflowRepository workflowRepository, WorkflowService workflowService,
                            BranchRepository branchRepository, BranchService branchService,
                            MenuItemRepository menuRepository, WokOptionRepository wokRepository,
                            StoryChapterRepository storyRepository, RecommendationService recommendationService) {
        this.workflowRepository = workflowRepository;
        this.workflowService = workflowService;
        this.branchRepository = branchRepository;
        this.branchService = branchService;
        this.menuRepository = menuRepository;
        this.wokRepository = wokRepository;
        this.storyRepository = storyRepository;
        this.recommendationService = recommendationService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(10)
    public void seed() {
        safely("workflows", this::seedWorkflows);
        safely("branch", this::seedBranch);
        safely("menu", this::seedMenu);
        safely("wok options", this::seedWokOptions);
        safely("story", this::seedStory);
    }

    private void safely(String what, Runnable r) {
        try {
            r.run();
        } catch (RuntimeException e) {
            log.warn("Spring Onion seed step '{}' failed: {}", what, e.getMessage());
        }
    }

    // ── Workflows ──

    private void seedWorkflows() {
        ensureWorkflow(RestaurantConstants.KITCHEN_WORKFLOW, "Kitchen orders (pickup & delivery)", "Wok crew", List.of(
                stage("PLACED", "Order placed", true, false, false, true, RefundPolicy.FULL, null, 5),
                stage("ACCEPTED", "Order received", false, true, false, true, RefundPolicy.FULL, null, 5,
                        bind(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER), bind(EmailConnector.ID, EmailConnector.EMAIL_STORE)),
                stage("IN_THE_WOK", "In the wok", false, false, false, true, RefundPolicy.PARTIAL, 50, 20),
                stage("PACKED", "Packed & ready", false, false, false, false, RefundPolicy.NONE, null, 15,
                        bind(DemoDeliveryConnector.ID, DemoDeliveryConnector.DELIVERY_INITIATE), bind(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER)),
                stage("COMPLETED", "Collected / delivered", false, false, true, false, RefundPolicy.NONE, null, null),
                stage(WorkflowService.CANCELLED_CODE, "Cancelled", false, false, true, false, RefundPolicy.NONE, null, null,
                        bind(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER), bind(EmailConnector.ID, EmailConnector.EMAIL_STORE),
                        bind(DemoRefundConnector.ID, DemoRefundConnector.REFUND_ISSUE))));

        ensureWorkflow(RestaurantConstants.TABLE_WORKFLOW, "Table bookings", "Host", List.of(
                stage("REQUESTED", "Requested", true, false, false, true, RefundPolicy.NONE, null, null),
                stage("PENDING", "Awaiting confirmation", false, true, false, true, RefundPolicy.NONE, null, 30,
                        bind(EmailConnector.ID, EmailConnector.EMAIL_STORE)),
                stage("CONFIRMED", "Confirmed", false, false, false, true, RefundPolicy.NONE, null, null,
                        bind(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER)),
                stage("SEATED", "Seated", false, false, false, false, RefundPolicy.NONE, null, 120),
                stage("COMPLETED", "Visit complete", false, false, true, false, RefundPolicy.NONE, null, null),
                stage("NO_SHOW", "No-show", false, false, true, false, RefundPolicy.NONE, null, null),
                stage(WorkflowService.CANCELLED_CODE, "Cancelled", false, false, true, false, RefundPolicy.NONE, null, null,
                        bind(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER), bind(EmailConnector.ID, EmailConnector.EMAIL_STORE))));
    }

    private void ensureWorkflow(String code, String label, String staffRole, List<WorkflowDto.StageDto> stages) {
        if (workflowRepository.existsByCode(code)) return;
        workflowRepository.save(Workflow.builder().code(code).label(label).isDefault(false).staffRole(staffRole).build());
        workflowService.replaceWorkflow(code, WorkflowDto.builder().code(code).label(label).staffRole(staffRole)
                .stages(stages).build());
        log.info("Seeded workflow '{}'", code);
    }

    private static WorkflowDto.StageDto stage(String code, String label, boolean initial, boolean onPaid, boolean terminal,
                                              boolean cancellable, RefundPolicy policy, Integer refundPct, Integer target,
                                              WorkflowDto.BindingDto... bindings) {
        return WorkflowDto.StageDto.builder().code(code).label(label).initial(initial).onPaidEntry(onPaid)
                .terminal(terminal).cancellable(cancellable).refundPolicy(policy).refundPercent(refundPct)
                .targetMinutes(target).bindings(new ArrayList<>(Arrays.asList(bindings))).build();
    }

    private static WorkflowDto.BindingDto bind(String connectorId, String action) {
        return WorkflowDto.BindingDto.builder().connectorId(connectorId).actionCode(action).enabled(true)
                .params(new HashMap<>()).build();
    }

    // ── Outlet ──

    private void seedBranch() {
        if (branchRepository.count() > 0) return;
        branchService.create(UpsertBranchRequest.builder()
                .name("Spring Onion — Bhandarkar Road, Deccan")
                .slug("bhandarkar-road-deccan")
                .phone("+91 97677 22444")
                .addressLine("Shop No-4B, Ground Floor, Millennium Tower, Bhandarkar Rd, Deccan Gymkhana")
                .city("Pune").state("Maharashtra").pincode("411004")
                .latitude(18.5181632).longitude(73.8381977)
                .googleMapsUrl("https://www.google.com/maps/place/?q=place_id:ChIJyUIXOIa_wjsRPEWQF-01YRc")
                .openingHours("Daily 11:30 am – 3:30 pm, 6:30 pm – 11:30 pm")
                .active(true).build());
    }

    // ── Menu (dish names from public listings; prices are indicative placeholders) ──

    private record Dish(String name, int price, Cuisine cuisine, Course course, DietType diet, int spice,
                        boolean signature, boolean passport, boolean jain, String description) {}

    private void seedMenu() {
        if (menuRepository.count() > 0) return;
        List<Dish> dishes = List.of(
                new Dish("Veg Manchow Soup", 229, Cuisine.INDO_CHINESE, Course.SOUP, DietType.VEG, 2, true, true, true,
                        "The soup regulars order first: dark, peppery broth packed with chopped vegetables, topped with crisp fried noodles."),
                new Dish("Chicken Manchow Soup", 259, Cuisine.INDO_CHINESE, Course.SOUP, DietType.NON_VEG, 2, false, false, false,
                        "Our Manchow with shredded chicken and a hit of garlic, finished with crunchy noodles."),
                new Dish("Dumpling Soup", 279, Cuisine.CHINESE, Course.SOUP, DietType.NON_VEG, 0, true, true, false,
                        "Silky dumplings in a clear, gentle broth with greens — comfort in a bowl."),
                new Dish("Tom Kha Soup", 269, Cuisine.THAI, Course.SOUP, DietType.VEG, 1, true, true, false,
                        "Coconut milk, galangal, lemongrass and kaffir lime — creamy, fragrant and softly tangy."),
                new Dish("Tom Yum Soup", 269, Cuisine.THAI, Course.SOUP, DietType.VEG, 2, false, true, false,
                        "Hot and sour Thai broth with mushrooms, lemongrass and fresh chilli."),
                new Dish("Veg Spring Rolls", 299, Cuisine.CHINESE, Course.STARTER, DietType.VEG, 0, false, true, true,
                        "Crisp, golden rolls of julienned vegetables with a house dipping sauce."),
                new Dish("Chicken Chilli Dry", 379, Cuisine.INDO_CHINESE, Course.STARTER, DietType.NON_VEG, 2, true, true, false,
                        "Wok-tossed chicken with peppers, onion and green chilli — the Indo-Chinese classic, done properly."),
                new Dish("Paneer Burnt Coriander Dry", 349, Cuisine.INDO_CHINESE, Course.STARTER, DietType.VEG, 1, false, true, true,
                        "Paneer tossed with charred coriander and garlic in a dry, savoury glaze."),
                new Dish("Baby Corn Mushroom Salt & Pepper", 329, Cuisine.CHINESE, Course.STARTER, DietType.VEG, 1, false, false, true,
                        "Crisp baby corn and mushrooms with cracked pepper, garlic and spring onion."),
                new Dish("Prawns Chilli Dry", 469, Cuisine.INDO_CHINESE, Course.STARTER, DietType.NON_VEG, 2, false, false, false,
                        "Juicy prawns tossed hot in the wok with chilli, peppers and spring onion."),
                new Dish("Chicken Momos", 299, Cuisine.PAN_ASIAN, Course.DIM_SUM, DietType.NON_VEG, 1, true, true, false,
                        "Steamed, hand-folded chicken momos with a fiery red chutney."),
                new Dish("Veg Dumplings", 279, Cuisine.CHINESE, Course.DIM_SUM, DietType.VEG, 0, false, true, true,
                        "Delicate steamed dumplings filled with seasoned vegetables."),
                new Dish("Thai Red Curry — Veg", 399, Cuisine.THAI, Course.MAIN, DietType.VEG, 2, true, true, false,
                        "Our most-loved curry: red curry paste, coconut milk, Thai basil and crunchy vegetables. Best with jasmine rice."),
                new Dish("Thai Red Curry — Chicken", 449, Cuisine.THAI, Course.MAIN, DietType.NON_VEG, 2, false, false, false,
                        "The same fragrant red curry with tender chicken."),
                new Dish("Exotic Veg in Signature Sauce", 379, Cuisine.CHINESE, Course.MAIN, DietType.VEG, 1, false, false, true,
                        "Broccoli, bok choy, mushrooms and baby corn in the house signature sauce."),
                new Dish("Paneer Chef Special", 389, Cuisine.INDO_CHINESE, Course.MAIN, DietType.VEG, 2, false, false, true,
                        "The chef's own paneer gravy — ask your server what's in the wok today."),
                new Dish("Burnt Garlic Noodles", 299, Cuisine.CHINESE, Course.RICE_NOODLES, DietType.VEG, 1, true, true, false,
                        "Wok-tossed noodles with deeply toasted garlic and spring onion — smoky, simple, addictive."),
                new Dish("Pad Thai", 349, Cuisine.THAI, Course.RICE_NOODLES, DietType.VEG, 1, true, true, false,
                        "Flat rice noodles, tamarind, bean sprouts and crushed peanuts with a squeeze of lime."),
                new Dish("Mei Goreng", 329, Cuisine.PAN_ASIAN, Course.RICE_NOODLES, DietType.VEG, 2, false, true, false,
                        "Malaysian-style fried noodles — sweet, spicy and a little smoky."),
                new Dish("Teppanyaki Noodles", 329, Cuisine.JAPANESE, Course.RICE_NOODLES, DietType.VEG, 0, false, true, false,
                        "Griddle-style noodles with vegetables in a savoury Japanese glaze."),
                new Dish("Ming Rice", 299, Cuisine.CHINESE, Course.RICE_NOODLES, DietType.VEG, 1, false, false, false,
                        "Fragrant wok-fried rice, a house favourite with any gravy."),
                new Dish("Triple Schezwan Noodles", 329, Cuisine.INDO_CHINESE, Course.RICE_NOODLES, DietType.VEG, 3, false, false, false,
                        "Noodles, fried rice and crispy noodles under a fiery Schezwan gravy. For heat lovers."),
                new Dish("Steamed Jasmine Rice", 179, Cuisine.THAI, Course.RICE_NOODLES, DietType.VEG, 0, false, false, true,
                        "Fluffy jasmine rice — made for Thai curries."),
                new Dish("Honey Noodles with Ice Cream", 249, Cuisine.DESSERT, Course.DESSERT, DietType.VEG, 0, true, true, false,
                        "Crisp noodles glazed in honey and sesame with a scoop of vanilla ice cream. The way to end a Spring Onion meal."),
                new Dish("Chocolate Brownie", 229, Cuisine.DESSERT, Course.DESSERT, DietType.EGG, 0, false, false, false,
                        "Warm, fudgy brownie — add ice cream if you like."));
        Instant now = Instant.now();
        int order = 10;
        Map<String, Long> ids = new HashMap<>();
        for (Dish d : dishes) {
            MenuItem saved = menuRepository.save(MenuItem.builder().name(d.name()).slug(slugify(d.name()))
                    .description(d.description()).price(BigDecimal.valueOf(d.price())).cuisine(d.cuisine())
                    .course(d.course()).diet(d.diet()).spiceLevel(d.spice()).signature(d.signature())
                    .passport(d.passport()).jainOption(d.jain()).active(true).sortOrder(order)
                    .workflowCode(RestaurantConstants.KITCHEN_WORKFLOW).createdAt(now).updatedAt(now).build());
            ids.put(d.name(), saved.getId());
            order += 10;
        }
        pair(ids, "Thai Red Curry — Veg", "Steamed Jasmine Rice", 1.0);
        pair(ids, "Thai Red Curry — Chicken", "Steamed Jasmine Rice", 1.0);
        pair(ids, "Veg Manchow Soup", "Veg Spring Rolls", 0.8);
        pair(ids, "Chicken Chilli Dry", "Burnt Garlic Noodles", 0.9);
        pair(ids, "Burnt Garlic Noodles", "Exotic Veg in Signature Sauce", 0.8);
        pair(ids, "Pad Thai", "Honey Noodles with Ice Cream", 0.7);
        pair(ids, "Chicken Momos", "Dumpling Soup", 0.6);
    }

    private void pair(Map<String, Long> ids, String source, String target, double score) {
        try {
            recommendationService.create(UpsertRecommendationRequest.builder()
                    .sourceItemType(RestaurantConstants.DISH).sourceItemId(ids.get(source))
                    .targetItemType(RestaurantConstants.DISH).targetItemId(ids.get(target))
                    .relationType(RecommendationType.CROSS_SELL).score(score).active(true).build());
        } catch (RuntimeException e) {
            log.debug("Skipped recommendation {} -> {}: {}", source, target, e.getMessage());
        }
    }

    // ── Wok bar ──

    private void seedWokOptions() {
        if (wokRepository.count() > 0) return;
        int i = 0;
        for (Object[] o : new Object[][]{
                {WokGroup.BASE, "Hakka Noodles", 249, DietType.VEG, "Springy wheat noodles, tossed high and fast."},
                {WokGroup.BASE, "Flat Rice Noodles", 269, DietType.VEG, "Wide, silky rice noodles — gluten-light."},
                {WokGroup.BASE, "Burnt Garlic Rice", 249, DietType.VEG, "Fried rice with deeply toasted garlic."},
                {WokGroup.BASE, "Jasmine Rice", 229, DietType.VEG, "Steamed and fragrant, for saucier woks."},
                {WokGroup.PROTEIN, "Tofu", 60, DietType.VEG, null},
                {WokGroup.PROTEIN, "Paneer", 70, DietType.VEG, null},
                {WokGroup.PROTEIN, "Mushroom & Baby Corn", 50, DietType.VEG, null},
                {WokGroup.PROTEIN, "Egg", 40, DietType.EGG, null},
                {WokGroup.PROTEIN, "Chicken", 90, DietType.NON_VEG, null},
                {WokGroup.PROTEIN, "Prawns", 150, DietType.NON_VEG, null},
                {WokGroup.SAUCE, "Burnt Garlic", 0, DietType.VEG, "Smoky, savoury, gently sweet."},
                {WokGroup.SAUCE, "Hakka", 0, DietType.VEG, "Light soy, garlic and pepper — the everyday classic."},
                {WokGroup.SAUCE, "Chilli Basil", 0, DietType.VEG, "Fresh chilli and Thai basil, bright and hot."},
                {WokGroup.SAUCE, "Burnt Coriander", 0, DietType.VEG, "Charred coriander and garlic, herby and dry."},
                {WokGroup.SAUCE, "Triple Schezwan", 20, DietType.VEG, "Our fiery Schezwan, layered three ways."},
                {WokGroup.SAUCE, "Thai Red Curry", 40, DietType.VEG, "Coconut, red curry paste and kaffir lime."},
                {WokGroup.VEGGIES, "Bok Choy", 40, DietType.VEG, null},
                {WokGroup.VEGGIES, "Broccoli", 40, DietType.VEG, null},
                {WokGroup.VEGGIES, "Bell Peppers", 30, DietType.VEG, null},
                {WokGroup.VEGGIES, "Water Chestnuts", 40, DietType.VEG, null},
                {WokGroup.VEGGIES, "Bean Sprouts", 30, DietType.VEG, null},
                {WokGroup.FINISH, "Spring Onion & Sesame", 0, DietType.VEG, "Of course."},
                {WokGroup.FINISH, "Crispy Garlic", 20, DietType.VEG, null},
                {WokGroup.FINISH, "Toasted Peanuts", 20, DietType.VEG, null},
                {WokGroup.FINISH, "Fried Egg on Top", 40, DietType.EGG, null}}) {
            wokRepository.save(WokOption.builder().groupCode((WokGroup) o[0]).name((String) o[1])
                    .price(BigDecimal.valueOf((Integer) o[2])).diet((DietType) o[3]).description((String) o[4])
                    .active(true).sortOrder(i += 10).build());
        }
    }

    // ── Our Story (facts from public listings and reviews; editable in admin) ──

    private void seedStory() {
        if (storyRepository.count() > 0) return;
        String[][] chapters = {
                {"The motto", "No Aji. No Motto.",
                        "Spring Onion's kitchen has always worked to one rule, printed right on its listing: Oriental awesomeness, with no Ajinomoto. Flavour has to come from the wok, the sauce and good ingredients — and guests often tell us the food tastes clean, not heavy with garlic or ginger."},
                {"The craft", "Thirty-odd sauces, made in-house",
                        "Hakka, chilli basil, burnt garlic, burnt coriander, a signature sauce for exotic vegetables, Schezwan for the brave — the sauces, dips and chutneys are made in our own kitchen. They're the reason a simple plate of noodles here tastes like ours and nobody else's."},
                {"The founder", "A cricketer's kitchen",
                        "Spring Onion was started by former Ranji Trophy cricketer Anand Yalvigi, who brought a sportsman's discipline to Chinese and Thai cooking in Pune and later Mumbai."},
                {"The neighbourhood", "Bhandarkar Road, Deccan",
                        "Our Deccan home sits on the ground floor of Millennium Tower on Bhandarkar Road, a short walk from Deccan Gymkhana and FC Road. College friends, families on a Sunday, office lunches, first dates — the room has seen them all."},
                {"The regulars", "What people come back for",
                        "A bowl of Manchow or Tom Kha to start. Chicken Chilli Dry and momos for the table. Thai red curry with jasmine rice, burnt garlic noodles, and honey noodles with ice cream to finish. Portions are generous — one main is usually plenty for two."},
                {"Across Pune", "More than one wok",
                        "Spring Onion cooks at more than one address in Pune, including VJ Happiness Street in Hinjawadi. Same motto, same sauces, wherever you find us."}};
        int i = 10;
        for (String[] c : chapters) {
            storyRepository.save(StoryChapter.builder().eyebrow(c[0]).title(c[1]).body(c[2]).sortOrder(i).active(true).build());
            i += 10;
        }
    }
}
