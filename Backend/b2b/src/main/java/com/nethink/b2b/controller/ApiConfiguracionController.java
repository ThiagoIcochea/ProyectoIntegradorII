package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ApiConfiguracionRequest;
import com.nethink.b2b.dto.response.ApiConfiguracionResponse;
import com.nethink.b2b.service.ApiConfiguracionService;
import com.nethink.b2b.service.MfaService;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proveedor-api")
public class ApiConfiguracionController {

    private final ApiConfiguracionService service;
    private final MfaService mfaService;

    public ApiConfiguracionController(
            ApiConfiguracionService service,
            MfaService mfaService
    ) {
        this.service = service;
        this.mfaService = mfaService;
    }

    @GetMapping
    public ApiConfiguracionResponse obtener(
            Principal principal
    ) {
        return service.obtenerConfiguracion(principal.getName());
    }

    @PutMapping
    public void actualizar(
            Principal principal,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken,
            @RequestBody ApiConfiguracionRequest request
    ) {
        mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_PROVIDER_API_UPDATE);
        service.actualizarConfiguracion(principal.getName(), request);
    }

    @PostMapping("/probar")
    public ApiConfiguracionResponse probar(
            Principal principal
    ) {
        return service.probarConexion(principal.getName());
    }
}
