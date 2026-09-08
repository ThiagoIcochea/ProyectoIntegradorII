/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.nethink.b2b.entity.LogsSistema;

import java.util.List;

public interface LogsSistemaRepository extends JpaRepository<LogsSistema, Integer> {
    List<LogsSistema> findAllByOrderByFechaDesc();
}