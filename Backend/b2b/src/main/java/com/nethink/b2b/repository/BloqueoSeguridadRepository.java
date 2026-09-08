package com.nethink.b2b.repository;

import com.nethink.b2b.entity.BloqueoSeguridad;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BloqueoSeguridadRepository extends JpaRepository<BloqueoSeguridad, Long> {
    Optional<BloqueoSeguridad> findByTipoAndIdentificador(String tipo, String identificador);
    List<BloqueoSeguridad> findByTipoAndBloqueadoTrueOrderByFechaBloqueoDesc(String tipo);
}
