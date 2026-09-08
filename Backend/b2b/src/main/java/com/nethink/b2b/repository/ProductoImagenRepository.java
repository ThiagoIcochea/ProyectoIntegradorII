package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProductoImagen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoImagenRepository extends JpaRepository<ProductoImagen, Integer> {

    List<ProductoImagen> findByProducto_IdProducto(Integer idProducto);
    List<ProductoImagen> findByProducto_IdProductoIn(List<Integer> ids);
    void deleteByProducto_IdProducto(Integer idProducto);
}