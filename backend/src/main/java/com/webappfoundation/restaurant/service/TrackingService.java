package com.webappfoundation.restaurant.service;

import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.model.OrderStageEvent;
import com.webappfoundation.model.WorkflowStage;
import com.webappfoundation.repository.OrderStageEventRepository;
import com.webappfoundation.restaurant.dto.RestaurantDtos.TrackDto;
import com.webappfoundation.restaurant.dto.RestaurantDtos.TrackStepDto;
import com.webappfoundation.service.OrderService;
import com.webappfoundation.service.WorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

import static com.webappfoundation.restaurant.RestaurantUtil.requireUser;

/**
 * Live order / booking progress for the guest, read straight from the order's workflow: the happy path is every
 * non-terminal stage in order plus the first non-cancelled terminal stage; time stamps come from the stage history.
 */
@Service
public class TrackingService {

    private final OrderService orderService;
    private final WorkflowService workflowService;
    private final OrderStageEventRepository stageEventRepository;

    public TrackingService(OrderService orderService, WorkflowService workflowService,
                           OrderStageEventRepository stageEventRepository) {
        this.orderService = orderService;
        this.workflowService = workflowService;
        this.stageEventRepository = stageEventRepository;
    }

    @Transactional(readOnly = true)
    public TrackDto track(Integer userId, Long orderId) {
        requireUser(userId);
        OrderDto order = orderService.get(userId, orderId); // ownership-checked by the spine
        List<WorkflowStage> stages = workflowService.stages(order.getWorkflowCode());
        String current = order.getCurrentStageCode();

        Map<String, Instant> entered = new HashMap<>();
        for (OrderStageEvent e : stageEventRepository.findByOrderIdOrderByEnteredAtAsc(orderId)) {
            entered.put(e.getStageCode(), e.getEnteredAt());
        }
        List<WorkflowStage> path = new ArrayList<>();
        WorkflowStage currentStage = null;
        boolean terminalAdded = false;
        for (WorkflowStage s : stages) {
            if (s.getCode().equals(current)) currentStage = s;
            if (WorkflowService.CANCELLED_CODE.equals(s.getCode())) continue;
            if (!s.isTerminal()) {
                path.add(s);
            } else if (!terminalAdded) {
                path.add(s);
                terminalAdded = true;
            }
        }
        // an alternative terminal (e.g. NO_SHOW) replaces the happy-path ending when it's where the order landed
        if (currentStage != null && currentStage.isTerminal() && !WorkflowService.CANCELLED_CODE.equals(current)
                && path.stream().noneMatch(s -> s.getCode().equals(current))) {
            path.removeIf(WorkflowStage::isTerminal);
            path.add(currentStage);
        }
        int currentIdx = -1;
        for (int i = 0; i < path.size(); i++) if (path.get(i).getCode().equals(current)) currentIdx = i;
        boolean cancelled = WorkflowService.CANCELLED_CODE.equals(current);
        List<TrackStepDto> steps = new ArrayList<>();
        for (int i = 0; i < path.size(); i++) {
            WorkflowStage s = path.get(i);
            String state = cancelled ? (entered.containsKey(s.getCode()) ? "DONE" : "SKIPPED")
                    : i < currentIdx ? "DONE" : i == currentIdx ? (s.isTerminal() ? "DONE" : "CURRENT") : "UPCOMING";
            steps.add(new TrackStepDto(s.getCode(), s.getLabel(), state, entered.get(s.getCode()), s.getTargetMinutes()));
        }
        String label = currentStage == null ? current : currentStage.getLabel();
        boolean finished = currentStage != null && currentStage.isTerminal();
        return new TrackDto(order.getId(), order.getOrderNumber(), order.getWorkflowCode(), current, label, cancelled,
                finished, order.getFulfillmentType() == null ? null : order.getFulfillmentType().name(),
                order.getPaymentState() == null ? null : order.getPaymentState().name(), order.getTotal(), steps,
                order.getCreatedAt());
    }
}
