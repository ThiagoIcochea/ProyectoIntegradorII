package com.nethink.b2b.repository;

import com.nethink.b2b.entity.InventarioReserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventarioReservaRepository extends JpaRepository<InventarioReserva, Integer> {

    List<InventarioReserva> findBySolicitud_IdSolicitud(Integer idSolicitud);

    List<InventarioReserva> findByProveedorProducto_IdProvProd(Integer idProvProd);
    @Query("""
SELECT COALESCE(SUM(r.cantidad), 0)
FROM InventarioReserva r
WHERE r.proveedorProducto.idProvProd = :id
AND r.estado IN ('RESERVADO', 'CONFIRMADO', 'PENDIENTE')
""")
Integer sumarReservasActivas(@Param("id") Integer id);
}