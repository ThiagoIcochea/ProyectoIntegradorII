package com.nethink.b2b.service;

import com.nethink.b2b.config.security.JwtUtil;
import com.nethink.b2b.entity.Rol;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServicePasswordTest {

    @Mock
    private UsuarioRepository repo;

    @Mock
    private LogsSistemaService logsSistemaService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private MfaService mfaService;

    @Mock
    private LoginSecurityService loginSecurityService;

    @Mock
    private HttpServletRequest request;

    private AuthService authService;

    @Test
    void loginAcceptsBcryptHashedPassword() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        authService = new AuthService();
        authService.setRepo(repo);
        authService.setLogsSistemaService(logsSistemaService);
        authService.setJwtUtil(jwtUtil);
        authService.setMfaService(mfaService);
        authService.setLoginSecurityService(loginSecurityService);
        authService.setPasswordEncoder(encoder);
        String rawPassword = "ClaveSegura123";
        String hashedPassword = encoder.encode(rawPassword);

        Usuario user = new Usuario();
        user.setCorreo("cliente@test.com");
        user.setPassword(hashedPassword);
        user.setEstado(EstadoUsuario.ACTIVO);
        Rol rol = new Rol();
        rol.setNombre("CLIENTE");
        user.setRol(rol);

        when(repo.findByCorreo("cliente@test.com")).thenReturn(Optional.of(user));
        when(loginSecurityService.obtenerIp(request)).thenReturn("127.0.0.1");
        doNothing().when(loginSecurityService).validarIp("127.0.0.1");
        when(mfaService.start(
                "cliente@test.com",
                MfaService.PURPOSE_LOGIN,
                "email",
                "/app/dashboard",
                false,
                null
        )).thenReturn(new com.nethink.b2b.dto.response.MfaStartResponse());

        assertDoesNotThrow(() -> authService.login("cliente@test.com", rawPassword, request));

    }

    @Test
    void loginRejectsPlainTextStoredPassword() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        authService = new AuthService();
        authService.setRepo(repo);
        authService.setLogsSistemaService(logsSistemaService);
        authService.setJwtUtil(jwtUtil);
        authService.setMfaService(mfaService);
        authService.setLoginSecurityService(loginSecurityService);
        authService.setPasswordEncoder(encoder);

        Usuario user = new Usuario();
        user.setCorreo("cliente@test.com");
        user.setPassword("ClaveSegura123");
        user.setEstado(EstadoUsuario.ACTIVO);
        Rol rol = new Rol();
        rol.setNombre("CLIENTE");
        user.setRol(rol);

        when(repo.findByCorreo("cliente@test.com")).thenReturn(Optional.of(user));
        when(loginSecurityService.obtenerIp(request)).thenReturn("127.0.0.1");
        doNothing().when(loginSecurityService).validarIp("127.0.0.1");

        assertThrows(RuntimeException.class, () -> authService.login("cliente@test.com", "ClaveSegura123", request));
    }

    @Test
    void completeLoginIncludesRoleDashboardRedirect() {
        authService = new AuthService();
        authService.setRepo(repo);
        authService.setLogsSistemaService(logsSistemaService);
        authService.setJwtUtil(jwtUtil);

        Usuario user = new Usuario();
        user.setIdUsuario(7);
        user.setCorreo("proveedor@test.com");
        user.setEstado(EstadoUsuario.ACTIVO);
        Rol rol = new Rol();
        rol.setNombre("PROVEEDOR");
        user.setRol(rol);

        when(repo.findByCorreo("proveedor@test.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("proveedor@test.com", "PROVEEDOR")).thenReturn("jwt-token");

        var response = authService.completeLogin("proveedor@test.com", request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("/app/provider/dashboard", response.getRedirectTo());
    }
}
