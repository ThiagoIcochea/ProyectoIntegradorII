package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ConfiguracionCreateRequest;
import com.nethink.b2b.dto.request.ConfiguracionUpdateRequest;
import com.nethink.b2b.dto.response.ConfiguracionResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.service.ConfigService;
import com.nethink.b2b.service.MfaService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
@CrossOrigin("*")
public class ConfiguracionController {

    private final ConfigService service;
    private final MfaService mfaService;

    public ConfiguracionController(ConfigService service, MfaService mfaService) {
        this.service = service;
        this.mfaService = mfaService;
    }

    @GetMapping
    public ResponseEntity<List<ConfiguracionResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/{clave}")
    public String get(@PathVariable String clave) {
        return service.getValor(clave);
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody ConfiguracionCreateRequest req,
            Principal principal,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken
    ) {
        mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
        service.crear(req.getClave(), req.getValor(), req.getTipo(), req.getEstado());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(
            @PathVariable Integer id,
            @RequestBody ConfiguracionUpdateRequest req,
            Principal principal,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken
    ) {
        mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
        service.actualizarDatos(id, req.getClave(), req.getValor(), req.getTipo(), req.getEstado());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(
            @PathVariable Integer id,
            Principal principal,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken
    ) {
        mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<String> probar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.probarConexion(id));
    }

    @PutMapping
    public void update(@RequestBody Configuracion config) {
        service.actualizar(config.getClave(), config.getValor());
    }
}