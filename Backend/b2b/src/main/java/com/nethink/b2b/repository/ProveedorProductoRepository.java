package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProveedorProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProveedorProductoRepository
        extends JpaRepository<ProveedorProducto, Integer> {

    @Query("""
        SELECT pp
        FROM ProveedorProducto pp
        WHERE pp.proveedor.idProveedor = :idProveedor
        AND pp.producto.idProducto = :idProducto
    """)
    Optional<ProveedorProducto> buscarPorProveedorYProducto(
            @Param("idProveedor") Integer idProveedor,
            @Param("idProducto") Integer idProducto
    );

    Optional<ProveedorProducto>
    findByProveedor_IdProveedorAndProducto_IdProducto(
            Integer idProveedor,
            Integer idProducto
    );

    @Query(value = """
        SELECT pp.id_proveedor
        FROM proveedor_producto pp
        JOIN proveedores pr
            ON pp.id_proveedor = pr.id_proveedor
        JOIN usuarios u
            ON pr.id_usuario = u.id_usuario
        WHERE pp.id_producto IN :productos
        AND pp.stock > 0
        AND pp.estado = 'ACTIVO'
        AND pr.estado = 'ACTIVO'
        AND u.estado = 'ACTIVO'
        GROUP BY pp.id_proveedor
        HAVING COUNT(DISTINCT pp.id_producto) = :total
    """, nativeQuery = true)
    List<Integer> findProveedoresConTodosLosProductos(
            @Param("productos") List<Integer> productos,
            @Param("total") Integer total
    );

    @Query(value = """
        SELECT DISTINCT pp.id_proveedor
        FROM proveedor_producto pp
        JOIN proveedores pr
            ON pp.id_proveedor = pr.id_proveedor
        JOIN usuarios u
            ON pr.id_usuario = u.id_usuario
        WHERE pp.id_producto IN :productos
        AND pp.stock > 0
        AND pp.estado = 'ACTIVO'
        AND pr.estado = 'ACTIVO'
        AND u.estado = 'ACTIVO'
    """, nativeQuery = true)
    List<Integer> findProveedoresConAlgunProducto(
            @Param("productos") List<Integer> productos
    );

    @Query("""
        SELECT pp
        FROM ProveedorProducto pp
        WHERE pp.proveedor.idProveedor
        IN :proveedoresIds
        AND pp.producto.idProducto
        IN :productosIds
    """)
    List<ProveedorProducto> findDetallesParaScoring(
            @Param("proveedoresIds")
            List<Integer> proveedoresIds,

            @Param("productosIds")
            List<Integer> productosIds
    );

    List<ProveedorProducto>
    findByProveedor_IdProveedor(
            Integer idProveedor
    );

    List<ProveedorProducto>
    findByProducto_IdProducto(
            Integer idProducto
    );
    @Query("""
    SELECT pp
    FROM ProveedorProducto pp
    JOIN FETCH pp.producto p
    JOIN FETCH p.marca
    JOIN FETCH p.categoria
    WHERE pp.proveedor.idProveedor = :idProveedor
""")
List<ProveedorProducto> findProductosCompletosPorProveedor(
        @Param("idProveedor") Integer idProveedor
);


@Query("""
SELECT AVG(pp.precio)
FROM ProveedorProducto pp
WHERE pp.proveedor.idProveedor = :idProveedor
""")
Double promedioPrecioProveedor(Integer idProveedor);

@Query("""
SELECT AVG(pp.tiempoEntregaDias)
FROM ProveedorProducto pp
WHERE pp.proveedor.idProveedor = :idProveedor
""")
Double promedioTiempoEntregaProveedor(Integer idProveedor);
}
