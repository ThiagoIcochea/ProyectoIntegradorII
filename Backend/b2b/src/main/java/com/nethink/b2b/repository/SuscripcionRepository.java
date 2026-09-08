/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Suscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuscripcionRepository extends JpaRepository<Suscripcion, Integer> {
    Optional<Suscripcion> findByPaypalOrderId(String paypalOrderId);

    List<Suscripcion> findByUsuario_IdUsuarioOrderByFechaCreacionDesc(Integer idUsuario);

    List<Suscripcion> findByUsuario_IdUsuarioAndEstadoOrderByFechaCreacionDesc(
            Integer idUsuario,
            Suscripcion.EstadoSuscripcion estado
    );
}