package com.webappfoundation.restaurant;

import java.time.ZoneId;

/** itemType keys and workflow codes owned by the Spring Onion domain. */
public final class RestaurantConstants {
    private RestaurantConstants() {}

    public static final String DISH = "DISH";
    public static final String WOK = "WOK";
    public static final String TABLE = "TABLE";

    /** Food orders — pickup and delivery. */
    public static final String KITCHEN_WORKFLOW = "kitchen";
    /** Table bookings. */
    public static final String TABLE_WORKFLOW = "table";

    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
}
