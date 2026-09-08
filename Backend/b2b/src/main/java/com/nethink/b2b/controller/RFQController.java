package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.RFQService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rfq")
public class RFQController {

    private final RFQService rfqService;
     private final UsuarioRepository usuarioRepo;

    public RFQController(RFQService rfqService,UsuarioRepository usuarioRepo) {
        this.rfqService = rfqService;
        this.usuarioRepo = usuarioRepo;
    }

    @PostMapping("/buscar-proveedores")
    public ResponseEntity<List<RFQProveedorResponse>> buscarProveedores(@Valid @RequestBody RFQRequest request,Principal principal, HttpServletRequest httpRequest) {
            Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<RFQProveedorResponse> resultados = rfqService.buscarYCalificarProveedores(request,usuario.getIdUsuario(),httpRequest);
        
        if (resultados.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(resultados);
    }
}
