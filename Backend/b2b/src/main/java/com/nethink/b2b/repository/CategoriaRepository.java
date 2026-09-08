package com.nethink.b2b.repository;


import com.nethink.b2b.dto.response.FiltroItemDTO;
import com.nethink.b2b.entity.Categoria;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    Optional<Categoria> findByNombre(String nombre);
   @Query("SELECT new com.nethink.b2b.dto.response.FiltroItemDTO(c.idCategoria, c.nombre, COUNT(p)) " +
           "FROM Producto p " +
           "RIGHT JOIN p.categoria c " +
           "GROUP BY c.idCategoria, c.nombre")
    List<FiltroItemDTO> obtenerFiltrosConConteo();
    
}
