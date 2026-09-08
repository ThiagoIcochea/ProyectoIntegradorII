package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.CrearComentarioRequest;
import com.nethink.b2b.dto.request.ReaccionComentarioRequest;
import com.nethink.b2b.dto.response.ListarComentarioResponse;
import com.nethink.b2b.entity.Comentario;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.ComentarioService;
import java.security.Principal;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;
     @Autowired
    private  UsuarioRepository usuarioRepo;
     
     @Autowired
     
     private ProveedorProductoRepository proveedorProductoRepo;

    public ComentarioController(
            ComentarioService comentarioService
    ) {
        this.comentarioService = comentarioService;
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody CrearComentarioRequest request,
              Principal principal
    ) {
        
        Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(
                comentarioService.crearComentario(
                        request, usuario.getIdUsuario()
                )
        );
    }

    @GetMapping("/{idProv}/{idProd}")
    public ResponseEntity<List<ListarComentarioResponse>> listar(
            @PathVariable Integer idProv,
            @PathVariable Integer idProd
            
    ) {
        
       ProveedorProducto provProd = proveedorProductoRepo.findByProveedor_IdProveedorAndProducto_IdProducto(idProv, idProd).orElseThrow( () -> new RuntimeException("Proveedor producto no encontrado"));

        
        
        return ResponseEntity.ok(
                comentarioService.listar(
                        provProd.getIdProvProd()
                )
        );
    }

    @PostMapping("/reaccion")
    public ResponseEntity<?> reaccionar(
            @RequestBody ReaccionComentarioRequest request,
              Principal principal
    ) {
       Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        comentarioService.reaccionar(
                request, usuario.getIdUsuario()
        );

        return ResponseEntity.ok().build();
    }
}