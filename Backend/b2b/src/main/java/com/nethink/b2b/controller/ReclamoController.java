package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ActualizarReclamoRequest;
import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.dto.response.ReclamoProveedorResponse;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.ReclamoService;
import com.nethink.b2b.service.SolicitudService;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reclamos")
public class ReclamoController {

    private final SolicitudService solicitudService;
    private final ReclamoService reclamoService;
    private final ProveedorRepository proveedorRepository;
    private final UsuarioRepository usuarioRepository;

    public ReclamoController(
            SolicitudService solicitudService,
            ReclamoService reclamoService,
            ProveedorRepository proveedorRepository,
            UsuarioRepository usuarioRepository) {
        this.solicitudService = solicitudService;
        this.reclamoService = reclamoService;
        this.proveedorRepository = proveedorRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping(value = "/demora", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> crear(
            @ModelAttribute ReclamoRequest request,
            Principal principal,
            HttpServletRequest httpRequest) throws IOException {
        reclamoService.registrarReclamo(request, principal.getName(), httpRequest);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/proveedor/mis-reclamos")
    public ResponseEntity<List<ReclamoProveedorResponse>> listarMisReclamosProveedor(Principal principal) {
        Proveedor proveedor = obtenerProveedor(principal);
        return ResponseEntity.ok(reclamoService.listarReclamosProveedor(proveedor.getIdProveedor()));
    }

    @PutMapping("/proveedor/{idReclamo}/estado")
    public ResponseEntity<ReclamoProveedorResponse> actualizarEstadoProveedor(
            @PathVariable Integer idReclamo,
            @RequestBody ActualizarReclamoRequest request,
            Principal principal,
            HttpServletRequest httpRequest) {

        Proveedor proveedor = obtenerProveedor(principal);
        Usuario usuario = usuarioRepository.findByCorreo(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario no encontrado"));

        return ResponseEntity.ok(reclamoService.actualizarEstadoProveedor(
                idReclamo,
                proveedor.getIdProveedor(),
                usuario.getIdUsuario(),
                request,
                httpRequest
        ));
    }

    private Proveedor obtenerProveedor(Principal principal) {
        return proveedorRepository.findByUsuario_Correo(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Proveedor no encontrado"));
    }
}
