package com.nethink.b2b.repository;


import com.nethink.b2b.dto.response.FiltroItemDTO;
import com.nethink.b2b.entity.Marca;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Query;


public interface MarcaRepository extends JpaRepository<Marca, Integer> {

    Optional<Marca> findByNombre(String nombre);
        @Query("SELECT new com.nethink.b2b.dto.response.FiltroItemDTO(m.idMarca, m.nombre, COUNT(p)) " +
           "FROM Producto p " +
           "RIGHT JOIN p.marca m " +
           "GROUP BY m.idMarca, m.nombre")
    List<FiltroItemDTO> obtenerFiltrosConConteo();
}