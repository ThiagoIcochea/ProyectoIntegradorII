package com.nethink.b2b.repository;

import com.nethink.b2b.entity.DescuentoVolumen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DescuentoVolumenRepository extends JpaRepository<DescuentoVolumen, Integer> {

    List<DescuentoVolumen> findByProveedorProducto_IdProvProd(Integer idProvProd);
    void deleteByProveedorProducto_IdProvProd(Integer idProvProd);
    List<DescuentoVolumen>
findByProveedorProducto_IdProvProdIn(List<Integer> ids);
}