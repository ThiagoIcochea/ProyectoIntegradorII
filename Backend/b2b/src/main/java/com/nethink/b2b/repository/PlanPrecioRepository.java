/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.repository;

import com.nethink.b2b.entity.PlanPrecio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanPrecioRepository extends JpaRepository<PlanPrecio, Integer> {
    Optional<PlanPrecio> findByPlan_IdPlanAndPeriodoMesesAndActivoTrue(Integer idPlan, Integer periodoMeses);
}