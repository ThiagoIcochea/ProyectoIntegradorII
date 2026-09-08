package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.dto.response.SolicitudHistorialResponse;
import com.nethink.b2b.dto.response.SolicitudResponse;
import com.nethink.b2b.dto.response.TrackingResponse;
import com.nethink.b2b.entity.MetodoPago;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.MetodoPagoRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.PagoService;
import com.nethink.b2b.service.SolicitudService;
import com.nethink.b2b.dto.response.SolicitudEntregaResponse; 

import com.nethink.b2b.dto.response.TrackingStepResponse; 
import com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse; 
//se añadio val
import com.nethink.b2b.entity.Proveedor;

import com.nethink.b2b.entity.Solicitud; 

import com.nethink.b2b.repository.ProveedorRepository;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;


import java.util.List;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.repository.query.Param;
import com.nethink.b2b.dto.response.TrackingStepEntregaResponse; 

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final MetodoPagoRepository metodoPagoRepository;
    private final PagoService pagoService;
    private final UsuarioRepository usuarioRepo;
    private final SolicitudRepository solicitudRepo;
    private final ProveedorRepository proveedorRepo;  

    public SolicitudController(
            SolicitudService solicitudService,
            MetodoPagoRepository metodoPagoRepository,
            PagoService pagoService,
            UsuarioRepository usuarioRepo,
            SolicitudRepository solicitudRepo,
            ProveedorRepository proveedorRepo
            
    ) {
        this.solicitudService = solicitudService;
        this.metodoPagoRepository = metodoPagoRepository;
        this.pagoService = pagoService;
        this.usuarioRepo = usuarioRepo;
        this.solicitudRepo = solicitudRepo;
        this.proveedorRepo= proveedorRepo; 
        
    }

        @PostMapping("/{idSolicitud}/notify-evaluation")
        public ResponseEntity<?> notifyEvaluation(@PathVariable Integer idSolicitud) {
                solicitudService.notifyEvaluation(idSolicitud);
                return ResponseEntity.ok(Map.of("message", "Notificación de evaluación solicitada"));
        }

        @PostMapping("/{idSolicitud}/auto-complete")
        public ResponseEntity<?> autoComplete(@PathVariable Integer idSolicitud) {
                solicitudService.autoCompleteIfUnresolved(idSolicitud);
                return ResponseEntity.ok(Map.of("message", "Auto-complete ejecutado"));
        }

        @PostMapping("/{idSolicitud}/evaluation")
        public ResponseEntity<?> resolveEvaluation(@PathVariable Integer idSolicitud) {
                solicitudService.resolveEvaluation(idSolicitud);
                return ResponseEntity.ok(Map.of("message", "Evaluación registrada"));
        }

    
    @GetMapping("/mis-solicitudes")
    public ResponseEntity<List<SolicitudResponse>> listarMisSolicitudes(Principal principal) {

        Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(
                solicitudService.listarMisSolicitudes(usuario.getIdUsuario())
        );
    }
    
   @GetMapping("/mis-solicitudes/historial")
public ResponseEntity<List<SolicitudHistorialResponse>>
listarHistorial(Principal principal) {

    Usuario usuario = usuarioRepo
            .findByCorreo(principal.getName())
            .orElseThrow(() ->
                    new RuntimeException("Usuario no encontrado")
            );

    return ResponseEntity.ok(
            solicitudService.listarHistorial(
                    usuario.getIdUsuario()
            )
    );
}

    @PostMapping("/crear")
    public ResponseEntity<?> crear(
            @RequestBody SolicitudCrearRequest request,
            Principal principal,
            HttpServletRequest httpRequest
    ) {
        String correo = principal.getName();
        return ResponseEntity.ok(
                solicitudService.crearSolicitud(request, correo, httpRequest)
        );
    }

    @GetMapping("/proveedor/{idProveedor}/metodos-pago")
    public ResponseEntity<List<MetodoPago>> obtenerMetodosPago(
            @PathVariable Integer idProveedor
    ) {
        return ResponseEntity.ok(
                metodoPagoRepository.findByIdProveedor(idProveedor)
        );
    }

    @PostMapping(value = "/{idSolicitud}/pagar", consumes = "multipart/form-data")
    public ResponseEntity<?> pagar(
            @PathVariable Integer idSolicitud,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam("entidad") String entidad,
            @RequestParam("codigoOperacion") String codigoOperacion,
            @RequestParam("metodo") String metodo,
            Principal principal,
            HttpServletRequest httpRequest
    ) {

        try {
            return ResponseEntity.ok(
                    pagoService.registrarPago(
                            idSolicitud,
                            archivo,
                            entidad,
                            codigoOperacion,
                            metodo,
                            principal.getName(),
                            httpRequest
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error al procesar el pago: " + e.getMessage());
        }
    }

    @GetMapping("/{idSolicitud}/tracking")
    public ResponseEntity<?> tracking(@PathVariable Integer idSolicitud, Principal principal,HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(
                solicitudService.obtenerTracking(idSolicitud, usuario.getIdUsuario(),httpRequest)
        );
    }
 @PutMapping("/{idSolicitud}/cancelar")
public ResponseEntity<?> cancelar(
        @PathVariable Integer idSolicitud,
        Principal principal,
        HttpServletRequest httpRequest
) {

    return ResponseEntity.ok(
            solicitudService.cancelarSolicitud(
                    idSolicitud,
                    principal.getName(),
                    httpRequest
            )
    );
}





@GetMapping("/proveedor/mis-solicitudes")
public ResponseEntity<List<SolicitudResponse>> listarMisSolicitudesProveedor(
        Principal principal,HttpServletRequest httpRequest
) {

    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Proveedor proveedor = proveedorRepo.findByUsuario_Correo(principal.getName())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario no tiene un proveedor asociado")
                );

    return ResponseEntity.ok(
            solicitudService.listarSolicitudesProveedor(
                    proveedor.getIdProveedor(), usuario.getIdUsuario(), httpRequest
            )
    );
}






@GetMapping("/proveedor/entregas")
public ResponseEntity<List<SolicitudEntregaResponse>>
listarSolicitudesEntrega(

        Principal principal,

        HttpServletRequest httpRequest

) {

    // =========================
    // PROVEEDOR AUTENTICADO
    // =========================

    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(
                    principal.getName()
            ).orElseThrow(() ->

                    new ResponseStatusException(

                            HttpStatus.FORBIDDEN,

                            "Proveedor no encontrado"

                    )
            );

    // =========================
    // LISTAR SOLICITUDES
    // =========================

    return ResponseEntity.ok(

            solicitudService
                    .listarSolicitudesEntregaProveedor(

                            proveedor.getIdProveedor()

                    )

    );

}












@GetMapping("/proveedor/{idSolicitud}/tracking")
public ResponseEntity<List<TrackingStepEntregaResponse>>
listarTrackingSolicitud(

        @PathVariable Integer idSolicitud,

        Principal principal

) {

    // =========================
    // PROVEEDOR AUTENTICADO
    // =========================

    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(
                    principal.getName()
            ).orElseThrow(() ->

                    new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "Proveedor no encontrado"
                    )
            );

    // =========================
    // TRACKING
    // =========================

    return ResponseEntity.ok(

            solicitudService
                    .listarTrackingSolicitud(

                            idSolicitud,

                            proveedor.getIdProveedor()

                    )

    );

}



@GetMapping("/proveedor/entregas/detalles/{idSolicitud}")
public ResponseEntity<List<SolicitudDetalleEntregaResponse>>
listarDetallesEntregaProveedor(

        @PathVariable Integer idSolicitud,
        Principal principal

) {

    Proveedor proveedor = proveedorRepo
            .findByUsuario_Correo(principal.getName())
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "Proveedor no encontrado"
                    )
            );

    return ResponseEntity.ok(
            solicitudService.listarDetallesEntregaProveedor(
                    proveedor.getIdProveedor(),
                    idSolicitud
            )
    );
}






//@GetMapping("/proveedor/{idProveedor}")
//public ResponseEntity<List<SolicitudResponse>>
//listarSolicitudesProveedor(
//        @PathVariable Integer idProveedor
//) {

//    return ResponseEntity.ok(
 //           solicitudService
 //                   .listarSolicitudesProveedor(
 //                           idProveedor
 //                   )
  //  );
//}


@GetMapping("/admin/listar")
public ResponseEntity<List<SolicitudResponse>> listarTodas(Principal principal, HttpServletRequest httpRequest) {
   Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return ResponseEntity.ok(
            solicitudService.listarTodasSolicitudes(usuario.getIdUsuario(),httpRequest)
    );
}


@PutMapping("/{idSolicitud}/aprobar")
public ResponseEntity<?> aprobarPedido(
        @PathVariable Integer idSolicitud,
        Principal principal,
        HttpServletRequest httpRequest
) {

    solicitudService.aprobarPedido(idSolicitud,principal.getName(), httpRequest);

    Map<String, String> response =
            new HashMap<>();

    response.put(
            "mensaje",
            "Pedido aprobado"
    );

    return ResponseEntity.ok(response);
} 
@PutMapping("/{idSolicitud}/{prompt}/rechazar")
public ResponseEntity<?> rechazarPedido(
        @PathVariable Integer idSolicitud,
        @PathVariable String prompt,
        Principal principal,
        HttpServletRequest httpRequest
) {

    solicitudService.rechazarPedido(idSolicitud,prompt,principal.getName(), httpRequest);

    Map<String, String> response =
            new HashMap<>();

    response.put(
            "mensaje",
            "Pedido rechazado"
    );

    return ResponseEntity.ok(response);
} 



@PutMapping("/proveedor/{idSolicitud}/estado")
public ResponseEntity<Void> actualizarEstadoTracking(

        @PathVariable Integer idSolicitud,

        @RequestParam Solicitud.EstadoSolicitud estado,

        @RequestParam(required = false) String codigo,

        Principal principal,

        HttpServletRequest httpRequest

) {

   System.out.println("USER: " + principal.getName());
   
    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(
                    principal.getName()
            ).orElseThrow(() ->

                    new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "Proveedor no encontrado"
                    )
            );

    // =========================
    // ACTUALIZAR TRACKING
    // =========================
    solicitudService.actualizarEstado(
            idSolicitud,
            estado,
            codigo,
            principal.getName(),
            httpRequest
    );

    return ResponseEntity.ok().build();
}





//@PutMapping("/{id}/estado")
//public ResponseEntity<Void> actualizarEstado(
//        @PathVariable Integer id,
//        @RequestParam Solicitud.EstadoSolicitud estado,
//        @RequestParam(required = false) String codigo,
//        Principal principal
//) {

//    solicitudService.actualizarEstado(
 //           id,
//           estado,
 //           codigo,
 //           principal.getName()
//    );

 //   return ResponseEntity.ok().build();
//}







}
