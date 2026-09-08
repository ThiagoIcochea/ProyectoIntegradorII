package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nethink.b2b.entity.Pago;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.PagoRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.nethink.b2b.dto.response.PagoResponse; 
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList; 
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
//se añadio
import java.util.List; 

@Service
public class PagoService {

    private final PagoRepository pagoRepo;
    private final SolicitudRepository solicitudRepo;
    private final SolicitudHistorialRepository historialRepo;
    private final UsuarioRepository usuarioRepo;
    private final Cloudinary cloudinary;
    private final InventarioReservaService inventarioReservaService;
    private final LogsSistemaService logsSistemaService;
    private final EmailService emailService;
    

    public PagoService(
            PagoRepository pagoRepo,
            SolicitudRepository solicitudRepo,
            SolicitudHistorialRepository historialRepo,
            UsuarioRepository usuarioRepo,
            Cloudinary cloudinary,
            InventarioReservaService inventarioReservaService,
            LogsSistemaService logsSistemaService,
            EmailService emailService
    ) {
        this.pagoRepo = pagoRepo;
        this.solicitudRepo = solicitudRepo;
        this.historialRepo = historialRepo;
        this.usuarioRepo = usuarioRepo;
        this.cloudinary = cloudinary;
        this.inventarioReservaService= inventarioReservaService;
        this.logsSistemaService = logsSistemaService;
        this.emailService = emailService;
    }

    @Transactional
    public Pago registrarPago(
            Integer idSolicitud,
            MultipartFile archivo,
            String entidad,
            String codigoOp,
            String metodo,
            String correoUsuario,
            HttpServletRequest req
    ) throws IOException {

        Usuario usuario = usuarioRepo.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String urlPublica = subirACloudinary(archivo);

        Solicitud sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        solicitudRepo.actualizarPago(
                idSolicitud,
                Solicitud.EstadoSolicitud.PAGO_VALIDANDO
                
        );
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "PAGO_VALIDANDO",
    "PAGOS",
    "Pago enviado para validación solicitud ID: "
        + sol.getIdSolicitud(),
   req
);
        inventarioReservaService.confirmarReserva(sol.getIdSolicitud());
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "RESERVA_CONFIRMADA",
    "INVENTARIO",
    "Reserva confirmada solicitud ID: "
        + sol.getIdSolicitud(),
    req
);
        Pago pago = new Pago();
        pago.setSolicitud(sol);   // setIdSolicitud(idSolicitud) revisar con thiago
        pago.setEntidad(entidad);
        pago.setCodigoOperacion(codigoOp);
        pago.setMonto(sol.getTotal());
        pago.setMetodo(metodo);
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado(Pago.EstadoPago.VALIDANDO);
        pago.setComprobanteUrl(urlPublica);

        Pago pagoGuardado = pagoRepo.save(pago);
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "REGISTRAR_PAGO",
    "PAGOS",
    "Pago registrado para solicitud ID: "
        + sol.getIdSolicitud()
        + " | Monto: "
        + sol.getTotal(),
    req
);

        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(sol);
        historial.setEstado("PAGO_VALIDANDO");
        historial.setIdUsuario(usuario.getIdUsuario());
        historial.setDescripcion("Pago enviado y pendiente de validación");
        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

        return pagoGuardado;
    }

    private String subirACloudinary(MultipartFile archivo) throws IOException {

        Map uploadResult = cloudinary.uploader().upload(
                archivo.getBytes(),
                ObjectUtils.asMap(
                        "folder", "b2b/comprobantes"
                )
        );

        return uploadResult.get("secure_url").toString();
    }
    
    
    
    
    
   

    
// lista de pagos de proveedor autenticado
    public List<PagoResponse> listarPagosProveedor(Integer idProveedor ,  HttpServletRequest req   ) {
        
        logsSistemaService.registrarLog(
    idProveedor,
    "LISTAR_PAGOS",
    "PAGOS",
    "Consulta pagos proveedor ID: "
        + idProveedor,
   req
);

        List<Pago> pagos = pagoRepo.listarPagosProveedor(idProveedor);

        List<PagoResponse> response =
                new ArrayList<>();

        for (Pago p : pagos) {

            PagoResponse dto =
                    new PagoResponse();

            // =====================================
            // DATOS PAGO
            // =====================================

            dto.setIdPago(
                    p.getIdPago());

            //dto.setMonto(
            //        p.getMonto());

            dto.setMetodo(
                    p.getMetodo());

            dto.setEntidad(
                    p.getEntidad());

            dto.setCodigoOperacion(
                    p.getCodigoOperacion());

            dto.setEstado(
                    p.getEstado().name());

            dto.setFechaPago(
                    p.getFechaPago());
            
            dto.setFechaValidacion(p.getFechaValidacion()); 

            dto.setComprobanteUrl(
                    p.getComprobanteUrl());

            // =====================================
            // DATOS SOLICITUD
            // =====================================

            
            Solicitud s= p.getSolicitud();
            
            dto.setIdSolicitud(
                    p.getSolicitud()
                     .getIdSolicitud());
            
            
            
            dto.setTotalSolicitud(
                    p.getSolicitud()
                     .getTotal());
            
            
            dto.setFechaSolicitud(s.getFechaCreacion()); 
                
            
            

            //dto.setNombreClienteEmpresa(
            //        p.getSolicitud()
            //         .getNombreEmpresa());

            //dto.setCorreoCliente(
             //       p.getSolicitud()
             //        .getCorreoCliente());

            
            if (s.getUsuario() != null) {

                dto.setNombreClienteEmpresa(
                        s.getUsuario().getNombres()
                        + " "
                        + s.getUsuario().getApellidos()
                );

                dto.setCorreoCliente(
                        s.getUsuario().getCorreo()
                );
            }
            

            if (s.getEmpresaCompradora() != null) {

                dto.setNombreEmpresa(
                        s.getEmpresaCompradora()
                         .getRazonSocial()
                );

                dto.setRucEmpresa(
                        s.getEmpresaCompradora()
                         .getRuc()
                );
            }
            
            
            
            
            response.add(dto);
        }

        return response;
    }

    
    
    
    // actualizar estado del pago desde proveedor
    
    
    @Transactional
public void aprobarPago(Integer idPago, Integer idUsuario,HttpServletRequest req) {

    Pago pago = pagoRepo.findById(idPago)
            .orElseThrow(() ->
                    new RuntimeException("Pago no encontrado"));
         Usuario usuario = usuarioRepo.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    // =========================
    // ACTUALIZAR PAGO
    // =========================

    pago.setEstado(
            Pago.EstadoPago.APROBADO
    );
    
    
    pago.setValidado(true); 
    
    pago.setFechaValidacion( LocalDateTime.now());
    
    pago.setValidadoPor(idUsuario); 
    

    // =========================
    // ACTUALIZAR SOLICITUD
    // =========================

    Solicitud solicitud = pago.getSolicitud();

    solicitud.setEstado(
            Solicitud.EstadoSolicitud.PAGADA
    );
    
    
    
    SolicitudHistorial historial =
            new SolicitudHistorial();

    historial.setSolicitud(solicitud);

    historial.setIdUsuario(idUsuario);

    historial.setEstado(
            Solicitud.EstadoSolicitud.PAGADA.name()
    );

    historial.setDescripcion(
            "Pago aprobado por proveedor"
    );

    historial.setFecha(
            LocalDateTime.now()
    ); 
    
    
    historialRepo.save(historial); 
    
    pagoRepo.save(pago);
    
    logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "PAGO_APROBADO",
    "PAGOS",
    "Pago aprobado ID: "
        + pago.getIdPago()
        + " | Solicitud: "
        + solicitud.getIdSolicitud(),
    req
);

    emailService.enviarCorreoEstadoSolicitud(
            solicitud,
            Solicitud.EstadoSolicitud.PAGADA.name(),
            "Pago aprobado por el proveedor"
    );
    
        
      

}
    
    
    
@Transactional
public void rechazarPago(Integer idPago, Integer idUsuario, HttpServletRequest req) {

    Pago pago = pagoRepo.findById(idPago)
            .orElseThrow(() ->
                    new RuntimeException("Pago no encontrado"));

    // =========================
    // ACTUALIZAR PAGO
    // =========================

    pago.setEstado(
            Pago.EstadoPago.RECHAZADO
    );
    
    
    pago.setValidado(true); 
    
    pago.setFechaValidacion( LocalDateTime.now());
    
    pago.setValidadoPor(idUsuario); 
    

    // =========================
    // ACTUALIZAR SOLICITUD
    // =========================

    Solicitud solicitud = pago.getSolicitud();

    solicitud.setEstado(
            Solicitud.EstadoSolicitud.CANCELADA
    );
    solicitud.setFechaCancelacion(LocalDateTime.now());
    inventarioReservaService.cancelarReserva(solicitud.getIdSolicitud());
    
    
    
    
   SolicitudHistorial historial =
            new SolicitudHistorial();

    historial.setSolicitud(solicitud);

    historial.setIdUsuario(idUsuario);

    historial.setEstado(
            Solicitud.EstadoSolicitud.CANCELADA.name()
    );

    historial.setDescripcion(
            "Pago rechazado por proveedor"
    );

    historial.setFecha(
            LocalDateTime.now()
    ); 
    
    
    historialRepo.save(historial);  
    
    pagoRepo.save(pago);

    logsSistemaService.registrarLog(
            idUsuario,
            "PAGO_RECHAZADO",
            "PAGOS",
            "Pago rechazado ID: " + pago.getIdPago() + " | Solicitud: " + solicitud.getIdSolicitud(),
            req
    );

    logsSistemaService.registrarLog(
            idUsuario,
            "RESERVA_CANCELADA",
            "INVENTARIO",
            "Reservas eliminadas por rechazo de pago solicitud ID: " + solicitud.getIdSolicitud(),
            req
    );

    emailService.enviarCorreoEstadoSolicitud(
            solicitud,
            Solicitud.EstadoSolicitud.CANCELADA.name(),
            "Pago rechazado por el proveedor"
    );

} 










    
    
}
