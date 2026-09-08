package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository
        extends JpaRepository<Producto, Integer> {

    List<Producto> findByNombreContainingIgnoreCase(
            String nombre
    );

    Optional<Producto>
    findByNombreAndMarca_IdMarca(
            String nombre,
            Integer idMarca
    );

    Optional<Producto>
    findBySkuGlobal(
            String skuGlobal
    );

    boolean existsBySkuGlobal(
            String skuGlobal
    );

    @Query("""
        SELECT DISTINCT p
        FROM Producto p
        JOIN FETCH p.marca
        JOIN FETCH p.categoria
        WHERE p.estado = 'ACTIVO'
    """)
    List<Producto> findCatalogoBase();

    @Query("""
        SELECT DISTINCT p
        FROM Producto p
        JOIN FETCH p.marca
        JOIN FETCH p.categoria
        WHERE (
            :categorias IS NULL
            OR p.categoria.idCategoria
            IN :categorias
        )
        AND (
            :marcas IS NULL
            OR p.marca.idMarca
            IN :marcas
        )
        AND p.estado = 'ACTIVO'
    """)
    List<Producto> buscarConFiltros(
            @Param("categorias")
            List<Integer> categorias,

            @Param("marcas")
            List<Integer> marcas
    );

    List<Producto> findByIdProductoIn(
            List<Integer> ids
    );

    @Query(value = """
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            m.nombre AS marca,
            c.nombre AS categoria,
            COUNT(ds.id_detalle) AS veces_pedido
        FROM detalle_solicitud ds

        INNER JOIN proveedor_producto pp
            ON pp.id_prov_prod = ds.id_prov_prod

        INNER JOIN productos p
            ON p.id_producto = pp.id_producto

        LEFT JOIN marcas m
            ON m.id_marca = p.id_marca

        LEFT JOIN categorias c
            ON c.id_categoria = p.id_categoria

        WHERE pp.estado = 'ACTIVO'

        GROUP BY
            p.id_producto,
            p.nombre,
            p.descripcion,
            m.nombre,
            c.nombre

        ORDER BY veces_pedido DESC

        LIMIT 10
    """, nativeQuery = true)
    List<Object[]> findTopProductos();

    @Query("""
        SELECT p
        FROM Producto p
        WHERE LOWER(p.nombre)
        = LOWER(:nombre)
        AND p.marca.idMarca = :idMarca
        AND p.categoria.idCategoria = :idCategoria
    """)
    Optional<Producto> buscarProductoSimilar(
            @Param("nombre") String nombre,
            @Param("idMarca") Integer idMarca,
            @Param("idCategoria") Integer idCategoria
    );
    
    @Query(value = """
    SELECT
        p.id_producto AS idProducto,
        p.nombre AS name,
        p.sku_global AS skuGlobal,
        m.nombre AS brand,
        c.nombre AS category,
        COUNT(DISTINCT pp.id_proveedor) AS providersCount,
        COALESCE(SUM(pp.stock), 0) AS totalStock,
        COALESCE(p.estado, 'ACTIVO') AS status

    FROM productos p

    LEFT JOIN marcas m
        ON m.id_marca = p.id_marca

    LEFT JOIN categorias c
        ON c.id_categoria = p.id_categoria

    LEFT JOIN proveedor_producto pp
        ON pp.id_producto = p.id_producto

    GROUP BY
        p.id_producto,
        p.nombre,
        p.sku_global,
        m.nombre,
        c.nombre,
        p.estado
""", nativeQuery = true)
List<Object[]> obtenerProductosAdmin();
}