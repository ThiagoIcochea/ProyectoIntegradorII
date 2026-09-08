package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List; 

@Repository
public interface PagoRepository extends JpaRepository<Pago, Integer> {
    
    
  
    
    @Query("""
    SELECT DISTINCT p
    FROM Pago p
    JOIN FETCH p.solicitud s
    LEFT JOIN FETCH s.proveedor pr
    LEFT JOIN FETCH s.usuario u
    LEFT JOIN FETCH s.empresaCompradora ec
    WHERE pr.idProveedor = :idProveedor
    ORDER BY p.fechaPago DESC
""")
List<Pago> listarPagosProveedor(
        @Param("idProveedor") Integer idProveedor);
    
    
    
    
    
    
    
    
    
}
