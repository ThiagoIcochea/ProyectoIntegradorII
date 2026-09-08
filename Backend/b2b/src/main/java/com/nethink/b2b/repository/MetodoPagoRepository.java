package com.nethink.b2b.repository;

import com.nethink.b2b.entity.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Integer> {

    @Query("SELECT m FROM MetodoPago m WHERE m.idProveedor = :idProveedor")
    List<MetodoPago> findByIdProveedor(@Param("idProveedor") Integer idProveedor);
}
