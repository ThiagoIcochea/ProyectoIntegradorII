package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByCorreo(String correo);

    @Query("""
        SELECT u
        FROM Usuario u
        WHERE UPPER(u.rol.nombre) IN ('ADMIN', 'ROLE_ADMIN')
    """)
    List<Usuario> findAdministradores();

    @Query("""
        SELECT DISTINCT u
        FROM Usuario u
        LEFT JOIN FETCH u.rol r
        ORDER BY u.fechaRegistro DESC
    """)
    List<Usuario> findAllForAdmin();
}
