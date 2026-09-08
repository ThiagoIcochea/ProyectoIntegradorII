package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Evaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Integer> {

@Query("""
    SELECT AVG(
        (e.estrellasServicio +
         e.estrellasCalidad +
         e.estrellasTiempo +
         e.estrellasComunicacion) / 4.0
    )
    FROM Evaluacion e
    WHERE e.idSolicitud IN (
        SELECT s.idSolicitud
        FROM Solicitud s
        WHERE s.proveedor.idProveedor = :idProveedor
    )
""")
Double promedioCalidad(Integer idProveedor);

 boolean existsByIdSolicitud(Integer idSolicitud);
}