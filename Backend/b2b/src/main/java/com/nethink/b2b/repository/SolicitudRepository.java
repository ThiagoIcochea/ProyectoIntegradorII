package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Solicitud;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
//se añadio para que detalle solicitud pueda gestionarse en la lista val
import com.nethink.b2b.entity.DetalleSolicitud;
import com.nethink.b2b.dto.response.SolicitudEntregaResponse;




@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Integer> {

@Query("""
SELECT s
FROM Solicitud s
LEFT JOIN FETCH s.proveedor p
WHERE s.usuario.id = :idUsuario
ORDER BY s.fechaCreacion DESC
""")
List<Solicitud> findByUsuarioOptimized(@Param("idUsuario") Integer idUsuario);

@Query("""
    SELECT s
    FROM Solicitud s
    LEFT JOIN FETCH s.proveedor
    LEFT JOIN FETCH s.empresaCompradora
    WHERE s.idSolicitud = :idSolicitud
""")
Optional<Solicitud> buscarTracking(@Param("idSolicitud") Integer idSolicitud);
   boolean existsByCodigoRecepcion(String codigoRecepcion);
   
   @Modifying
@Query("""
update Solicitud s
set s.estado = :estado
where s.idSolicitud = :id
""")
void actualizarPago(
        @Param("id") Integer id,
        @Param("estado") Solicitud.EstadoSolicitud estado
       
);


// consulta de lista de solicitudes desde la perspectiva del proveedor

@Query("""
SELECT DISTINCT s
FROM Solicitud s
LEFT JOIN FETCH s.usuario u
LEFT JOIN FETCH s.proveedor p
LEFT JOIN FETCH s.empresaCompradora ec
WHERE s.proveedor.idProveedor = :idProveedor
ORDER BY s.fechaCreacion DESC
""")
List<Solicitud> listarSolicitudes(@Param("idProveedor") Integer idProveedor);



// listar solicitudes pagadas para proveedor



    @Query("""
    SELECT new com.nethink.b2b.dto.response.SolicitudEntregaResponse(
        s.idSolicitud,
        s.estado,
        s.total,
        s.fechaCreacion,
          
        emp.razonSocial,
        u.nombres,
        u.apellidos,
        u.telefono,
        u.whatsapp,   
        SUM(d.cantidad),
        s.direccionEnvio   
        
    )
    FROM Solicitud s
    JOIN s.usuario u
    JOIN s.empresaCompradora emp
    JOIN s.detalles d
    WHERE s.proveedor.idProveedor = :idProveedor
    AND s.estado IN  (
           
               'PAGADA',
           
               'EN_PREPARACION',
           
               'EN_CAMINO',
           
               'ENTREGADA'
           
           )        
           
           
           
           
    GROUP BY
        s.idSolicitud,
        s.estado,
        s.total,
        s.fechaCreacion,
          
        emp.razonSocial,
        u.nombres,
        u.apellidos, 
        u.telefono, 
        u.whatsapp,
        s.direccionEnvio
           
     ORDER BY s.fechaCreacion DESC      
           
           
    """)
    List<SolicitudEntregaResponse>
    listarSolicitudesEntrega(
            @Param("idProveedor")
            Integer idProveedor
    );


















//@Query("""
    //SELECT s FROM Solicitud s
   // LEFT JOIN FETCH s.usuario u
   // LEFT JOIN FETCH s.empresaCompradora ec
    //WHERE s.proveedor.idProveedor = :idProveedor
//""")
//List<Solicitud> listarSolicitudes(@Param("idProveedor") Integer idProveedor)        ;

//consulta de los detalles de las solicitudes

//@Query("""
//    SELECT d FROM DetalleSolicitud d
 //   LEFT JOIN FETCH d.proveedorProducto pp
 //   LEFT JOIN FETCH pp.producto p
 //   LEFT JOIN FETCH p.categoria
//    WHERE d.solicitud.idSolicitud = :idSolicitud
//""")
//List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud);
    
    
 @Query("""
SELECT COUNT(s)
FROM Solicitud s
WHERE s.proveedor.idProveedor = :idProveedor
AND s.estado IN ('ENTREGADA', 'COMPLETADA')
AND s.fechaEntrega IS NOT NULL
AND s.fechaLimiteEntrega IS NOT NULL
AND s.fechaEntrega <= s.fechaLimiteEntrega
""")
long contarEntregasATiempo(
        @Param("idProveedor") Integer idProveedor
);


int countByProveedor_IdProveedorAndEstado(Integer idProveedor, EstadoSolicitud estado);

int countByProveedor_IdProveedor(Integer idProveedor);

@Query("""
SELECT 
CASE 
    WHEN COUNT(c) = 0 THEN 0
    ELSE (SUM(CASE WHEN c.tipo = 'POSITIVO' THEN 1 ELSE 0 END) * 100.0) / COUNT(c)
END
FROM Comentario c
WHERE c.idProvProd IN (
    SELECT pp.idProvProd
    FROM ProveedorProducto pp
    WHERE pp.proveedor.idProveedor = :idProveedor
)
""")
Double calcularSatisfaccionProveedor(@Param("idProveedor") Integer idProveedor);


@Query("""
SELECT AVG(
    timestampdiff(day, s.fechaCreacion, s.fechaEntrega)
)
FROM Solicitud s
WHERE s.proveedor.idProveedor = :idProveedor
AND s.fechaEntrega IS NOT NULL
""")
Double calcularTiempoEntregaPromedio(@Param("idProveedor") Integer idProveedor);
}
