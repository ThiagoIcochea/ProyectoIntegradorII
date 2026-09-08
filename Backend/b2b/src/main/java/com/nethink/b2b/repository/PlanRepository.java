package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Integer> {
    Optional<Plan> findByNombreIgnoreCase(String nombre);
}
