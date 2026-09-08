package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Reclamo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReclamoRepository extends JpaRepository<Reclamo, Integer> {

    @Query("""
        SELECT r
        FROM Reclamo r
        WHERE r.idProveedor = :idProveedor
        ORDER BY r.fechaCreacion DESC
    """)
    List<Reclamo> findByIdProveedorOrderByFechaCreacionDesc(Integer idProveedor);

    List<Reclamo> findByIdSolicitudAndTipoOrderByFechaCreacionDesc(Integer idSolicitud, String tipo);

    @Query("""
        SELECT COUNT(r)
        FROM Reclamo r
        WHERE r.idProveedor = :idProveedor
    """)
    Integer contarReclamos(Integer idProveedor);

    @Query("""
        SELECT COUNT(r)
        FROM Reclamo r
        WHERE r.idProveedor = :idProveedor
        AND (r.estado IS NULL OR UPPER(r.estado) NOT IN ('RESUELTO', 'RECHAZADO'))
    """)
    Integer contarReclamosPenalizables(Integer idProveedor);

    List<Reclamo> findByIdProveedor(Integer idProveedor);
}
