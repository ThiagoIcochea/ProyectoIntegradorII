package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ProfileUpdateRequest;
import com.nethink.b2b.dto.request.AdminUserUpdateRequest;
import com.nethink.b2b.dto.request.AdminCreateUserRequest;
import com.nethink.b2b.dto.request.RegisterClientRequest;
import com.nethink.b2b.dto.response.ProfileResponse;
import com.nethink.b2b.service.UsuarioService;
import com.nethink.b2b.service.MfaService;
import java.security.Principal;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.nethink.b2b.dto.response.AdminUserResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
     private final UsuarioRepository usuarioRepo;
     private final MfaService mfaService;

    public UsuarioController(UsuarioService usuarioService,  UsuarioRepository usuarioRepo, MfaService mfaService) {
        this.usuarioService = usuarioService;
        this.usuarioRepo = usuarioRepo;
        this.mfaService = mfaService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterClientRequest request, HttpServletRequest httpRequest
    ) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Usa /api/auth/register-client/start para registrar clientes con MFA por correo."
        );
    }

    @GetMapping("/perfil")
    public ResponseEntity<ProfileResponse> perfil(
            Principal principal, HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(
                usuarioService.obtenerPerfil(
                        principal.getName(), httpRequest
                )
        );
    }

    @PutMapping(value = "/perfil", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> actualizarPerfil(
            Principal principal,
            @ModelAttribute ProfileUpdateRequest req,
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            @RequestParam(value = "fotoUrl", required = false) String fotoUrl,
            @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken,
            HttpServletRequest httpRequest
    ) {
        mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_PROFILE_UPDATE);

        usuarioService.actualizarPerfil(
                principal.getName(),
                req,
                foto,
                fotoUrl,
                httpRequest
        );

        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/admin/listar")
public ResponseEntity<List<AdminUserResponse>>
listarUsuarios(Principal principal, HttpServletRequest httpRequest) {
 Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return ResponseEntity.ok(
            usuarioService.listarUsuarios(usuario.getIdUsuario(),httpRequest)
    );
}

@PostMapping("/admin")
public ResponseEntity<AdminUserResponse> crearUsuarioAdmin(
        @RequestBody AdminCreateUserRequest request,
        @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken,
        Principal principal,
        HttpServletRequest httpRequest
) {
    mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
    return ResponseEntity.ok(usuarioService.crearUsuarioAdmin(request, httpRequest));
}

@PutMapping("/admin/{idUsuario}")
public ResponseEntity<AdminUserResponse> actualizarUsuarioAdmin(
        @PathVariable Integer idUsuario,
        @RequestBody AdminUserUpdateRequest request,
        @RequestHeader(value = "X-MFA-Authorization", required = false) String mfaActionToken,
        Principal principal,
        HttpServletRequest httpRequest
) {
    mfaService.consumeActionToken(mfaActionToken, principal.getName(), MfaService.PURPOSE_ADMIN_ACTION);
    return ResponseEntity.ok(usuarioService.actualizarUsuarioAdmin(idUsuario, request, httpRequest));
}

    @GetMapping("/roles")
    public ResponseEntity<List<String>> listarRoles() {
        return ResponseEntity.ok(usuarioService.listarRoles());
    }
}
