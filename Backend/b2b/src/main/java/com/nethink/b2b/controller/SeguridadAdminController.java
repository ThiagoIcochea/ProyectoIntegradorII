package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.BloqueoSeguridadResponse;
import com.nethink.b2b.service.LoginSecurityService;
import com.nethink.b2b.service.MfaService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seguridad/admin")
public class SeguridadAdminController {
    private final LoginSecurityService seguridad;
    private final MfaService mfaService;

    public SeguridadAdminController(LoginSecurityService seguridad, MfaService mfaService) {
        this.seguridad = seguridad;
        this.mfaService = mfaService;
    }

    @GetMapping("/usuarios-bloqueados")
    public List<BloqueoSeguridadResponse> usuariosBloqueados() { return seguridad.listar("USUARIO"); }

    @GetMapping("/ips-bloqueadas")
    public List<BloqueoSeguridadResponse> ipsBloqueadas() { return seguridad.listar("IP"); }

    @PostMapping("/{tipo}/bloquear")
    public ResponseEntity<Void> bloquear(@PathVariable String tipo, @RequestParam String identificador,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaToken, Principal principal) {
        mfaService.consumeActionToken(mfaToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
        seguridad.bloquearManual(validarTipo(tipo), identificador.trim().toLowerCase());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tipo}/desbloquear")
    public ResponseEntity<Void> desbloquear(@PathVariable String tipo, @RequestParam String identificador,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaToken, Principal principal) {
        mfaService.consumeActionToken(mfaToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
        seguridad.desbloquear(validarTipo(tipo), identificador.trim().toLowerCase());
        return ResponseEntity.noContent().build();
    }

    private String validarTipo(String tipo) {
        String valor = tipo == null ? "" : tipo.trim().toUpperCase();
        if (!"USUARIO".equals(valor) && !"IP".equals(valor)) throw new IllegalArgumentException("Tipo de bloqueo inválido");
        return valor;
    }
}
