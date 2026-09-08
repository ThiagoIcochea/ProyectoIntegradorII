package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Publicidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PublicidadRepository extends JpaRepository<Publicidad, Integer> {

    @Query("""
        SELECT p FROM Publicidad p
        WHERE p.estado = :estado
        AND p.fechaInicio <= :now
        AND p.fechaFin >= :now
    """)
    List<Publicidad> findActivas(
            @Param("estado") Publicidad.Estado estado,
            @Param("now") LocalDateTime now
    );
}