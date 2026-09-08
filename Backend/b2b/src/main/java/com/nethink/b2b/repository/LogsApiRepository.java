/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.repository;

import com.nethink.b2b.entity.LogsApi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LogsApiRepository extends JpaRepository<LogsApi, Integer> {



Optional<LogsApi>
findTopByProveedor_IdProveedorOrderByFechaDesc(Integer idProveedor);
}