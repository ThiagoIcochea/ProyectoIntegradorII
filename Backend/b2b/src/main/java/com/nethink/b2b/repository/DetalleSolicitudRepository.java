package com.nethink.b2b.repository;

import com.nethink.b2b.entity.DetalleSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import org.springframework.data.repository.query.Param;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse; 

@Repository
public interface DetalleSolicitudRepository extends JpaRepository<DetalleSolicitud, Integer> {
    
    
    /* se añadio query para buscar los detalles segun la id de solicitud
    
    @Query("""
    SELECT DISTINCT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    LEFT JOIN FETCH p.especificaciones pe
    WHERE d.solicitud.idSolicitud = :idSolicitud
""")
 List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud); */  
    
   
@Query("""
    SELECT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    LEFT JOIN FETCH p.marca m
    LEFT JOIN FETCH p.categoria c
    WHERE d.solicitud.idSolicitud = :idSolicitud
""")
List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud);

@Query("""
    SELECT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    LEFT JOIN FETCH p.marca m
    LEFT JOIN FETCH p.categoria c
    WHERE d.solicitud.idSolicitud IN :idSolicitudes
""")
List<DetalleSolicitud> listarDetallesPorSolicitudes(@Param("idSolicitudes") List<Integer> idSolicitudes);

@Query(value = """
SELECT *
FROM (
    SELECT
        pr.id_proveedor AS idProveedor,
        COALESCE(pr.razon_social, 'Proveedor premium') AS proveedor,
        p.id_producto AS idProducto,
        p.nombre AS producto,
        COALESCE(m.nombre, '') AS marca,
        SUM(ds.cantidad) AS unidadesVendidas,
        ROW_NUMBER() OVER (
            PARTITION BY pr.id_proveedor
            ORDER BY SUM(ds.cantidad) DESC, p.nombre ASC
        ) AS ranking
    FROM detalle_solicitud ds
    JOIN proveedor_producto pp ON ds.id_prov_prod = pp.id_prov_prod
    JOIN productos p ON pp.id_producto = p.id_producto
    LEFT JOIN marcas m ON p.id_marca = m.id_marca
    JOIN solicitudes s ON ds.id_solicitud = s.id_solicitud
    JOIN proveedores pr ON pp.id_proveedor = pr.id_proveedor
    JOIN suscripciones su ON pr.id_usuario = su.id_usuario
    JOIN plan_precios ppr ON su.id_precio = ppr.id_precio
    JOIN planes pl ON ppr.id_plan = pl.id_plan
    WHERE su.estado = 'ACTIVA'
      AND (su.fecha_fin IS NULL OR su.fecha_fin >= CURRENT_TIMESTAMP)
      AND LOWER(pl.nombre) LIKE '%premium%'
      AND pr.estado = 'ACTIVO'
      AND pp.estado = 'ACTIVO'
      AND s.estado NOT IN ('CANCELADA', 'RECHAZADA', 'PEDIDO_RECHAZADO', 'VENCIDA')
    GROUP BY pr.id_proveedor, pr.razon_social, p.id_producto, p.nombre, m.nombre
) ranked
WHERE ranked.ranking <= 3
ORDER BY ranked.idProveedor, ranked.ranking
""", nativeQuery = true)
List<PremiumTopProductRow> listarTopProductosPremium();

interface PremiumTopProductRow {
    Integer getIdProveedor();
    String getProveedor();
    Integer getIdProducto();
    String getProducto();
    String getMarca();
    Integer getUnidadesVendidas();
    Integer getRanking();
}


// listar detalles de solicitudes en fase entregas




@Query("""
SELECT new com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse(

    s.idSolicitud,

    p.nombre,

    ds.cantidad,
       
    p.skuGlobal,

    CAST(s.estado AS string),

    s.fechaCreacion

)

FROM DetalleSolicitud ds

JOIN ds.proveedorProducto pp

JOIN pp.producto p

JOIN ds.solicitud s

WHERE s.proveedor.idProveedor = :idProveedor

AND s.estado IN (
    'PAGADA',
    'EN_PREPARACION',
    'EN_CAMINO',
    'ENTREGADA'
)
       
AND  s.idSolicitud = :idSolicitud

ORDER BY s.fechaCreacion DESC
""")
List<SolicitudDetalleEntregaResponse>
listarDetallesEntregaProveedor(
    @Param("idProveedor") Integer idProveedor,
    @Param("idSolicitud") Integer idSolicitud
);








//version dos

/*   @Query("""
SELECT new com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse(

    ds.solicitud.idSolicitud,

    p.nombre,

    ds.cantidad,

    ds.solicitud.estado.name(),

    ds.solicitud.fechaCreacion

)

FROM DetalleSolicitud ds

JOIN ds.proveedorProducto pp

JOIN pp.producto p

JOIN ds.solicitud s

WHERE s.proveedor.idProveedor = :idProveedor

AND s.estado IN (

    'PAGADA',

    'EN_PREPARACION',

    'EN_CAMINO',

    'ENTREGADA'

)

ORDER BY s.fechaCreacion DESC
""")
List<SolicitudDetalleEntregaResponse>
listarDetallesEntregaProveedordos(

        @Param("idProveedor")
        Integer idProveedor
); */







 
    
    
//}
    
    
    
    
    
    
    
  /*  
    @Query("""
    SELECT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    JOIN FETCH p.categoria
    WHERE d.solicitud.idSolicitud = :idSolicitud
""")
List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud);
*/
    
    
    
}
