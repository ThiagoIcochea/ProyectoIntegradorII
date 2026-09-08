package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProductoEspecificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ProductoEspecificacionRepository extends JpaRepository<ProductoEspecificacion, Integer> {

    List<ProductoEspecificacion> findByProducto_IdProducto(Integer idProducto);
    List<ProductoEspecificacion> findByProducto_IdProductoIn(List<Integer> ids);
    void deleteByProducto_IdProducto(Integer idProducto);
    
    
    @Query("""
    SELECT pe
    FROM ProductoEspecificacion pe
    WHERE pe.producto.idProducto = :idProducto
""")
List<ProductoEspecificacion> listarPorProducto(
    @Param("idProducto") Integer idProducto
);

    @Query("""
    SELECT pe
    FROM ProductoEspecificacion pe
    WHERE pe.producto.idProducto IN :idProductos
""")
List<ProductoEspecificacion> listarPorProductos(
    @Param("idProductos") List<Integer> idProductos
);
    
    
    
}