package com.nethink.b2b.repository;

import com.nethink.b2b.entity.PreferenciaUsuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PreferenciaUsuarioRepository
        extends JpaRepository<PreferenciaUsuario, Integer> {

    Optional<PreferenciaUsuario> findByUsuario_IdUsuario(Integer idUsuario);
}