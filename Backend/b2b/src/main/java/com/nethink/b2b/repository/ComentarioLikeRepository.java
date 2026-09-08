package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ComentarioLike;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComentarioLikeRepository
        extends JpaRepository<ComentarioLike, Integer> {

    int countByIdComentarioAndTipo(
            Integer idComentario,
            String tipo
    );

    boolean existsByIdComentarioAndIdUsuario(
            Integer idComentario,
            Integer idUsuario
    );

    Optional<ComentarioLike>
    findByIdComentarioAndIdUsuario(
            Integer idComentario,
            Integer idUsuario
    );
}