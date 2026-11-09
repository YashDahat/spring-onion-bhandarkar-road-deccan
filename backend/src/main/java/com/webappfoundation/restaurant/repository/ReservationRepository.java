package com.webappfoundation.restaurant.repository;

import com.webappfoundation.restaurant.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByIdIn(Collection<Long> ids);
    List<Reservation> findByUserIdOrderByReservationDateDescSlotTimeDesc(Integer userId);
    List<Reservation> findByReservationDate(LocalDate date);
    List<Reservation> findAllByOrderByReservationDateDescSlotTimeDesc();
}
