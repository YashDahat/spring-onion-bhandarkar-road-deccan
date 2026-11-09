package com.webappfoundation.restaurant;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Locale;

/** Small shared helpers for the domain services. */
public final class RestaurantUtil {
    private RestaurantUtil() {}

    public static Integer requireUser(Integer userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to continue");
        }
        return userId;
    }

    public static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public static String slugify(String input) {
        String n = Normalizer.normalize(input == null ? "" : input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return n.isEmpty() ? "item" : n;
    }

    public static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    public static boolean parseBool(String s, boolean dflt) {
        if (s == null || s.isBlank()) return dflt;
        String v = s.trim().toLowerCase(Locale.ROOT);
        return v.equals("true") || v.equals("yes") || v.equals("y") || v.equals("1");
    }

    public static Integer parseInt(String s, Integer dflt) {
        if (s == null || s.isBlank()) return dflt;
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return dflt;
        }
    }

    public static BigDecimal parseMoney(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return new BigDecimal(s.trim().replace(",", "").replace("₹", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static <E extends Enum<E>> E parseEnum(Class<E> type, String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Enum.valueOf(type, s.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_'));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
