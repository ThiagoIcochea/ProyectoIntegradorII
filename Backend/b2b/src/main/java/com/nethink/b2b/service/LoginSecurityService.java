package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.BloqueoSeguridadResponse;
import com.nethink.b2b.entity.BloqueoSeguridad;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.BloqueoSeguridadRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoginSecurityService {
    private static final String TIPO_USUARIO = "USUARIO";
    private static final String TIPO_IP = "IP";
    private static final int MAX_INTENTOS_USUARIO = 5;
    private static final int MAX_INTENTOS_IP = 12;
    private final BloqueoSeguridadRepository bloqueos;
    private final UsuarioRepository usuarios;

    public LoginSecurityService(BloqueoSeguridadRepository bloqueos, UsuarioRepository usuarios) {
        this.bloqueos = bloqueos;
        this.usuarios = usuarios;
    }

    public String obtenerIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    public void validarIp(String ip) { validarNoBloqueado(TIPO_IP, ip, "Esta IP fue bloqueada por actividad sospechosa."); }
    public void validarUsuario(String correo) { validarNoBloqueado(TIPO_USUARIO, normalizarCorreo(correo), "Esta cuenta fue bloqueada por demasiados intentos fallidos."); }

    @Transactional
    public void registrarFallo(String correo, Usuario usuario, String ip) {
        registrarFallo(TIPO_IP, ip, MAX_INTENTOS_IP, "Actividad sospechosa: demasiados intentos de inicio de sesión desde esta IP.");
        if (usuario != null) {
            registrarFallo(TIPO_USUARIO, normalizarCorreo(correo), MAX_INTENTOS_USUARIO, "Cuenta bloqueada por demasiados intentos de contraseña fallidos.");
            if (estaBloqueado(TIPO_USUARIO, normalizarCorreo(correo))) {
                usuario.setEstado(EstadoUsuario.BLOQUEADO);
                usuarios.save(usuario);
            }
        }
    }

    @Transactional
    public void registrarExito(String correo, String ip) {
        limpiarIntentos(TIPO_USUARIO, normalizarCorreo(correo));
        limpiarIntentos(TIPO_IP, ip);
    }

    public List<BloqueoSeguridadResponse> listar(String tipo) {
        return bloqueos.findByTipoAndBloqueadoTrueOrderByFechaBloqueoDesc(tipo).stream().map(this::respuesta).toList();
    }

    @Transactional
    public void bloquearManual(String tipo, String identificador) {
        BloqueoSeguridad bloqueo = obtener(tipo, identificador);
        bloqueo.setBloqueado(true); bloqueo.setMotivo("Bloqueo manual por administrador.");
        bloqueo.setFechaBloqueo(LocalDateTime.now()); bloqueos.save(bloqueo);
        if (TIPO_USUARIO.equals(tipo)) usuarios.findByCorreo(identificador).ifPresent(u -> { u.setEstado(EstadoUsuario.BLOQUEADO); usuarios.save(u); });
    }

    @Transactional
    public void desbloquear(String tipo, String identificador) {
        bloqueos.findByTipoAndIdentificador(tipo, identificador).ifPresent(b -> {
            b.setBloqueado(false); b.setIntentosFallidos(0); b.setMotivo(null); b.setFechaBloqueo(null); bloqueos.save(b);
        });
        if (TIPO_USUARIO.equals(tipo)) usuarios.findByCorreo(identificador).ifPresent(u -> { u.setEstado(EstadoUsuario.ACTIVO); usuarios.save(u); });
    }

    private void validarNoBloqueado(String tipo, String identificador, String mensaje) {
        if (estaBloqueado(tipo, identificador)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, mensaje);
    }
    private boolean estaBloqueado(String tipo, String identificador) { return bloqueos.findByTipoAndIdentificador(tipo, identificador).map(BloqueoSeguridad::isBloqueado).orElse(false); }
    private void registrarFallo(String tipo, String identificador, int maximo, String motivo) {
        BloqueoSeguridad b = obtener(tipo, identificador);
        b.setIntentosFallidos(b.getIntentosFallidos() + 1); b.setUltimoIntento(LocalDateTime.now());
        if (b.getIntentosFallidos() >= maximo) { b.setBloqueado(true); b.setMotivo(motivo); b.setFechaBloqueo(LocalDateTime.now()); }
        bloqueos.save(b);
    }
    private void limpiarIntentos(String tipo, String identificador) { bloqueos.findByTipoAndIdentificador(tipo, identificador).ifPresent(b -> { if (!b.isBloqueado()) { b.setIntentosFallidos(0); bloqueos.save(b); } }); }
    private BloqueoSeguridad obtener(String tipo, String identificador) { return bloqueos.findByTipoAndIdentificador(tipo, identificador).orElseGet(() -> { BloqueoSeguridad b = new BloqueoSeguridad(); b.setTipo(tipo); b.setIdentificador(identificador); return b; }); }
    private BloqueoSeguridadResponse respuesta(BloqueoSeguridad b) {
        Usuario u = TIPO_USUARIO.equals(b.getTipo()) ? usuarios.findByCorreo(b.getIdentificador()).orElse(null) : null;
        String nombre = u == null ? null : (u.getNombres() + " " + u.getApellidos()).trim();
        return new BloqueoSeguridadResponse(b.getIdBloqueo(), b.getTipo(), b.getIdentificador(), b.getIntentosFallidos(), b.getMotivo(), b.getFechaBloqueo(), nombre, u == null ? null : u.getCorreo());
    }
    private String normalizarCorreo(String correo) { return correo == null ? "" : correo.trim().toLowerCase(); }
}
