package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.response.AdminProviderResponse;
import com.nethink.b2b.dto.response.IndicadorProveedorResponse;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import java.util.HashMap;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.PrioridadRFQ;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.ProveedorService;
import com.nethink.b2b.service.ScoringService;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/provider")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;
    @Autowired
    private  UsuarioRepository usuarioRepo;
    @Autowired
private ScoringService scoringService;

   @PostMapping("/register")
public Map<String, String> register(@RequestBody RegisterProviderRequest req,  HttpServletRequest httpRequest) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Usa /api/auth/register-provider/start para registrar proveedores con MFA por correo."
    );
}

@GetMapping("/admin/listar")
public List<AdminProviderResponse> listarProviders(Principal principal, HttpServletRequest httpRequest ) {
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return proveedorService.listarProviders( usuario.getIdUsuario(),  httpRequest);
}

@PostMapping("/admin/estado")
public Map<String, Object> actualizarEstadoProveedor(@RequestBody Map<String, Object> payload, Principal principal) {
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Integer idProveedor = payload.containsKey("idProveedor") ? Integer.valueOf(String.valueOf(payload.get("idProveedor"))) : null;
    String estado = payload.containsKey("estado") ? String.valueOf(payload.get("estado")) : null;

    if (idProveedor == null || estado == null || estado.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parametros invalidos");
    }

    proveedorService.actualizarEstadoProveedor(idProveedor, estado.toUpperCase());

    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("idProveedor", idProveedor);
    response.put("estado", estado.toUpperCase());
    return response;
}

@GetMapping("/{idProveedor}/indicadores")
public IndicadorProveedorResponse indicadoresProveedor(
        @PathVariable Integer idProveedor,
        Principal principal,
        HttpServletRequest request
) {
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    return proveedorService.obtenerIndicadoresPorProveedor(idProveedor);
}

@GetMapping("/proveedores/top")
public List<IndicadorProveedorResponse> top10(
        Principal principal,
        HttpServletRequest request
) {
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    return proveedorService.top10Proveedores();
}

@PostMapping("/scoring")
public List<RFQProveedorResponse> calcularScoring(
        @RequestBody List<RFQProveedorResponse> proveedores,
        @RequestParam(required = false) PrioridadRFQ prioridad
) {
    scoringService.calcularScore(proveedores, prioridad);
    return proveedores;
}

}
