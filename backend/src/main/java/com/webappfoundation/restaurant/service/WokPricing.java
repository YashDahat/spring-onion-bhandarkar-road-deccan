package com.webappfoundation.restaurant.service;

import com.webappfoundation.restaurant.dto.RestaurantDtos.WokComboDto;
import com.webappfoundation.restaurant.model.DietType;
import com.webappfoundation.restaurant.model.WokCombo;
import com.webappfoundation.restaurant.model.WokOption;
import com.webappfoundation.restaurant.repository.WokOptionRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Prices and names a wok from the live option rows. Returns null when any part is missing or switched off. */
@Component
public class WokPricing {

    private static final String[] SPICE = {"Mild", "Medium", "Hot", "Fiery"};

    private final WokOptionRepository optionRepository;

    public WokPricing(WokOptionRepository optionRepository) {
        this.optionRepository = optionRepository;
    }

    public WokComboDto describe(WokCombo c) {
        List<Long> ids = new ArrayList<>(List.of(c.getBaseId(), c.getProteinId(), c.getSauceId()));
        ids.addAll(c.getAddOnIds());
        Map<Long, WokOption> byId = new HashMap<>();
        optionRepository.findAllById(ids).forEach(o -> byId.put(o.getId(), o));
        for (Long id : ids) {
            WokOption o = byId.get(id);
            if (o == null || !o.isActive()) return null;
        }
        WokOption base = byId.get(c.getBaseId());
        WokOption protein = byId.get(c.getProteinId());
        WokOption sauce = byId.get(c.getSauceId());
        BigDecimal price = base.getPrice().add(protein.getPrice()).add(sauce.getPrice());
        List<String> extras = new ArrayList<>();
        boolean egg = false, nonVeg = false;
        for (Long id : ids) {
            DietType d = byId.get(id).getDiet();
            if (d == DietType.NON_VEG) nonVeg = true;
            if (d == DietType.EGG) egg = true;
        }
        for (Long id : c.getAddOnIds()) {
            WokOption o = byId.get(id);
            price = price.add(o.getPrice());
            extras.add(o.getName());
        }
        DietType diet = nonVeg ? DietType.NON_VEG : egg ? DietType.EGG : DietType.VEG;
        int spice = Math.max(0, Math.min(3, c.getSpiceLevel()));
        String name = protein.getName() + " " + base.getName() + " in " + sauce.getName();
        String summary = SPICE[spice] + (extras.isEmpty() ? "" : " · with " + String.join(", ", extras));
        return new WokComboDto(c.getId(), name, summary, price, diet, spice,
                c.getBaseId(), c.getProteinId(), c.getSauceId(), List.copyOf(c.getAddOnIds()));
    }
}
