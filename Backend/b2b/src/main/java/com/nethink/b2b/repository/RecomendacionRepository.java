package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Recomendacion;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RecomendacionRepository extends JpaRepository<Recomendacion, Integer> {

    @Query("""
        SELECT r FROM Recomendacion r
        ORDER BY r.score DESC
    """)
    List<Recomendacion> findTopRecomendados(Pageable pageable);
}