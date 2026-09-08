package com.nethink.b2b.repository;

import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Solicitud;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nethink.b2b.dto.response.TrackingStepEntregaResponse;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

public interface SolicitudHistorialRepository
        extends JpaRepository<SolicitudHistorial, Integer> {

    List<SolicitudHistorial> findBySolicitud_IdSolicitudOrderByFechaAsc(
            Integer idSolicitud
    );

    Optional<SolicitudHistorial>
    findTopBySolicitud_IdSolicitudOrderByFechaDesc(
            Integer idSolicitud
    );

    Optional<SolicitudHistorial>
    findTopBySolicitud_IdSolicitudAndEstadoOrderByFechaDesc(
            Integer idSolicitud,
            String estado
    );
    
    
   @Query("""
SELECT new com.nethink.b2b.dto.response.TrackingStepEntregaResponse(

    sh.solicitud.idSolicitud,

    sh.estado,

    sh.descripcion,
          
    sh.fecha      

)

FROM SolicitudHistorial sh

WHERE sh.solicitud.idSolicitud = :idSolicitud
          AND sh.solicitud.proveedor.idProveedor = :idProveedor

ORDER BY sh.fecha ASC
""")
List<TrackingStepEntregaResponse>
listarTrackingSolicitud(
        @Param("idSolicitud")
        Integer idSolicitud,
        
        @Param("idProveedor")
        Integer idProveedor
        
        
        
        
); 

@Query("""
SELECT h.solicitud
FROM SolicitudHistorial h
WHERE h.estado = 'ENTREGADA'
AND h.solicitud.estado = 'ENTREGADA'
GROUP BY h.solicitud
HAVING MAX(h.fecha) <= :fechaLimite
""")
List<Solicitud> listarSolicitudesEntregadasParaAutocompletar(
        @Param("fechaLimite") LocalDateTime fechaLimite
);
    
    
    
    
    
    
    
}
