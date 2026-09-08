package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nethink.b2b.dto.request.ActualizarReclamoRequest;
import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.dto.response.ReclamoHistorialResponse;
import com.nethink.b2b.dto.response.ReclamoProveedorResponse;
import com.nethink.b2b.dto.response.IAComentarioResponse;
import com.nethink.b2b.entity.Reclamo;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.ReclamoRepository;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReclamoService {

    private static final List<String> ESTADOS_RECLAMO = List.of(
            "ABIERTO",
            "EN_REVISION",
            "RESUELTO",
            "RECHAZADO"
    );

    private final ReclamoRepository reclamoRepository;
    private final SolicitudRepository solicitudRepository;
    private final SolicitudHistorialRepository historialRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final EmailService emailService;
    private final Cloudinary cloudinary;
    private final ModeracionService moderacionService;
    private final LogsSistemaService logsSistemaService;
    private final InventarioReservaService inventarioReservaService;

    @Autowired
    public ReclamoService(
            ReclamoRepository reclamoRepository,
            SolicitudRepository solicitudRepository,
            SolicitudHistorialRepository historialRepository,
            UsuarioRepository usuarioRepository,
            ProveedorRepository proveedorRepository,
            EmailService emailService,
            Cloudinary cloudinary,
            ModeracionService moderacionService,
            InventarioReservaService inventarioReservaService,
            LogsSistemaService logsSistemaService) {

        this.reclamoRepository = reclamoRepository;
        this.solicitudRepository = solicitudRepository;
        this.historialRepository = historialRepository;
        this.usuarioRepository = usuarioRepository;
        this.proveedorRepository = proveedorRepository;
        this.emailService = emailService;
        this.cloudinary = cloudinary;
        this.moderacionService = moderacionService;
        this.logsSistemaService = logsSistemaService;
        this.inventarioReservaService = inventarioReservaService;
    }

    public ReclamoService(
            ReclamoRepository reclamoRepository,
            SolicitudRepository solicitudRepository,
            SolicitudHistorialRepository historialRepository,
            UsuarioRepository usuarioRepository,
            ProveedorRepository proveedorRepository,
            EmailService emailService,
            Cloudinary cloudinary,
            ModeracionService moderacionService) {
        this(
                reclamoRepository,
                solicitudRepository,
                historialRepository,
                usuarioRepository,
                proveedorRepository,
                emailService,
                cloudinary,
                moderacionService,
                null,
                null
        );
    }

    private String subirACloudinary(MultipartFile archivo) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(
                archivo.getBytes(),
                ObjectUtils.asMap("folder", "b2b/reclamos")
        );

        return uploadResult.get("secure_url").toString();
    }

    @Transactional
    public void registrarReclamo(ReclamoRequest request, String correoUsuario) throws IOException {
        registrarReclamo(request, correoUsuario, null);
    }

    @Transactional
    public void registrarReclamo(ReclamoRequest request, String correoUsuario, HttpServletRequest httpRequest) throws IOException {
        Usuario usuario = usuarioRepository
                .findByCorreo(correoUsuario)
                .orElseThrow();

        Solicitud solicitud = solicitudRepository
                .findById(request.getIdSolicitud())
                .orElseThrow();

        String tipo = normalizarTipo(request.getTipo());
        String tipoNegocio = normalizarTipoNegocio(request.getTipo());
        String accion = normalizarAccion(request.getAccion(), tipoNegocio);

        IAComentarioResponse evaluacion = moderacionService.moderarReclamo(request.getDescripcion());
        if (evaluacion == null || !"OK".equalsIgnoreCase(evaluacion.getEstado()) || Boolean.FALSE.equals(evaluacion.getEsReclamo())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    evaluacion != null && evaluacion.getRazon() != null
                            ? evaluacion.getRazon()
                            : "El mensaje no corresponde a un reclamo válido"
            );
        }

        if (existeReclamoActivo(solicitud.getIdSolicitud(), tipo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un reclamo activo para este tipo en la solicitud"
            );
        }

        Reclamo reclamo = new Reclamo();
        reclamo.setIdSolicitud(solicitud.getIdSolicitud());
        reclamo.setIdUsuario(usuario.getIdUsuario());
        reclamo.setIdProveedor(solicitud.getProveedor().getIdProveedor());
        reclamo.setTipo(tipo);
        reclamo.setDescripcion(request.getDescripcion());
        reclamo.setEstado("ABIERTO");
        reclamo.setFechaCreacion(LocalDateTime.now());

        String evidenciaUrl = null;
        if (request.getEvidencia() != null && !request.getEvidencia().isEmpty()) {
            evidenciaUrl = subirACloudinary(request.getEvidencia());
        }

        reclamo.setEvidenciaUrl(evidenciaUrl);
        reclamoRepository.save(reclamo);
        registrarLog(
                usuario.getIdUsuario(),
                "REGISTRAR_RECLAMO",
                "RECLAMOS",
                "Reclamo " + reclamo.getTipo() + " registrado para solicitud " + solicitud.getIdSolicitud(),
                httpRequest
        );
        evaluarSuspensionProveedor(reclamo.getIdProveedor());

        aplicarAccionSolicitud(solicitud, tipoNegocio, accion, request.getNuevoEstado(), request.getMotivoCancelacion(), null);
        solicitudRepository.save(solicitud);
        guardarHistorialReclamo(
                solicitud,
                usuario.getIdUsuario(),
                "ABIERTO",
                construirDescripcionReclamo(tipoNegocio, accion, request.getMotivoCancelacion(), solicitud.getEstado())
        );

        emailService.enviarCorreoReclamoDemora(solicitud, request.getDescripcion(), "");
        emailService.enviarCorreoActualizacionCliente(
                solicitud,
                "Reclamo recibido",
                "Hemos recibido tu reclamo para la solicitud " + solicitud.getIdSolicitud() + ". Un proveedor lo revisará pronto.",
                "Reclamo recibido - Solicitud " + solicitud.getIdSolicitud()
        );
        emailService.enviarCorreoEstadoReclamo(
                solicitud,
                "ABIERTO",
                "Se registro un reclamo para la solicitud " + solicitud.getIdSolicitud() + "."
        );
    }

    private void evaluarSuspensionProveedor(Integer idProveedor) {
        if (idProveedor == null) {
            return;
        }

        int reclamos = reclamoRepository.contarReclamosPenalizables(idProveedor) != null
                ? reclamoRepository.contarReclamosPenalizables(idProveedor)
                : 0;

        if (reclamos < 5) {
            return;
        }

        proveedorRepository.findById(idProveedor).ifPresent(proveedor -> {
            proveedor.setEstado("SUSPENDIDO");
            if (proveedor.getUsuario() != null) {
                proveedor.getUsuario().setEstado(EstadoUsuario.BLOQUEADO);
            }
            proveedorRepository.save(proveedor);

            usuarioRepository.findAdministradores().forEach(admin ->
                    emailService.enviarAlertaProveedorSuspendido(
                            admin.getCorreo(),
                            proveedor.getRazonSocial(),
                            proveedor.getUsuario() != null ? proveedor.getUsuario().getCorreo() : "Sin correo",
                            reclamos
                    )
            );
        });
    }

    private void aplicarAccionSolicitud(
            Solicitud solicitud,
            String tipo,
            String accion,
            String nuevoEstado,
            String motivoCancelacion,
            String codigoEntrega) {

        if (solicitud == null) {
            return;
        }

        String tipoNormalizado = normalizarTipoNegocio(tipo);
        String accionNormalizada = normalizarAccion(accion, tipoNormalizado);

        if ("CANCELAR".equals(accionNormalizada)) {
            cancelarSolicitud(solicitud, motivoCancelacion);
            cancelarReservaSiExiste(solicitud);
            return;
        }

        if ("AVANZAR".equals(accionNormalizada) || "RETROCEDER".equals(accionNormalizada)) {
            EstadoSolicitud nuevoEstadoSolicitud = resolverEstadoPorAccion(solicitud.getEstado(), accionNormalizada);
            if (nuevoEstadoSolicitud != null) {
                if (nuevoEstadoSolicitud == EstadoSolicitud.ENTREGADA) {
                    validarCodigoEntrega(solicitud, codigoEntrega);
                    entregarReservaSiExiste(solicitud);
                }
                solicitud.setEstado(nuevoEstadoSolicitud);
            }
            return;
        }

        if ("DEMORA".equals(tipoNormalizado)) {
            switch (accionNormalizada) {
                case "EN_PREPARACION" -> solicitud.setEstado(EstadoSolicitud.EN_PREPARACION);
                case "PAGO_PENDIENTE" -> solicitud.setEstado(EstadoSolicitud.PAGO_PENDIENTE);
                case "PAGO_VALIDANDO" -> solicitud.setEstado(EstadoSolicitud.PAGO_VALIDANDO);
                default -> {
                    // Mantener el estado actual del pedido.
                }
            }
            return;
        }

        if ("CANCELACION".equals(tipoNormalizado)) {
            switch (accionNormalizada) {
                case "PAGO_PENDIENTE" -> solicitud.setEstado(EstadoSolicitud.PAGO_PENDIENTE);
                case "PAGO_VALIDANDO" -> solicitud.setEstado(EstadoSolicitud.PAGO_VALIDANDO);
                case "EN_PREPARACION" -> solicitud.setEstado(EstadoSolicitud.EN_PREPARACION);
                default -> {
                    // Mantener el estado actual del pedido.
                }
            }
            return;
        }

        if ("ENTREGA_INCOMPLETA".equals(tipoNormalizado) && "EN_PREPARACION".equals(accionNormalizada)) {
            solicitud.setEstado(EstadoSolicitud.EN_PREPARACION);
            return;
        }

        if (nuevoEstado != null && !nuevoEstado.isBlank()) {
            try {
                solicitud.setEstado(EstadoSolicitud.valueOf(nuevoEstado.trim().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // Se mantiene el estado anterior si llega uno no soportado.
            }
        }
    }

    private void validarCodigoEntrega(Solicitud solicitud, String codigoIngresado) {
        if (solicitud == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código requerido para marcar como ENTREGADA");
        }

        if (codigoIngresado == null || codigoIngresado.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código requerido para marcar como ENTREGADA");
        }

        String codigoRecepcion = solicitud.getCodigoRecepcion();
        if (codigoRecepcion == null || codigoRecepcion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código requerido para marcar como ENTREGADA");
        }

        if (!codigoIngresado.trim().equalsIgnoreCase(codigoRecepcion.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código incorrecto");
        }

        solicitud.setFechaEntrega(LocalDateTime.now());
    }

    private EstadoSolicitud resolverEstadoPorAccion(EstadoSolicitud estadoActual, String accion) {
        if (estadoActual == null) {
            return null;
        }

        if ("AVANZAR".equals(accion)) {
            return switch (estadoActual) {
                case CREADA -> EstadoSolicitud.PEDIDO_APROBADO;
                case PEDIDO_APROBADO -> EstadoSolicitud.PAGO_PENDIENTE;
                case PAGO_PENDIENTE -> EstadoSolicitud.PAGO_VALIDANDO;
                case PAGO_VALIDANDO -> EstadoSolicitud.PAGADA;
                case PAGADA -> EstadoSolicitud.EN_PREPARACION;
                case EN_PREPARACION -> EstadoSolicitud.EN_CAMINO;
                case EN_CAMINO -> EstadoSolicitud.ENTREGADA;
                case ENTREGADA -> EstadoSolicitud.COMPLETADA;
                default -> estadoActual;
            };
        }

        if ("RETROCEDER".equals(accion)) {
            return switch (estadoActual) {
                case PEDIDO_APROBADO -> EstadoSolicitud.CREADA;
                case PAGO_PENDIENTE -> EstadoSolicitud.PEDIDO_APROBADO;
                case PAGO_VALIDANDO -> EstadoSolicitud.PAGO_PENDIENTE;
                case PAGADA -> EstadoSolicitud.PAGO_VALIDANDO;
                case EN_PREPARACION -> EstadoSolicitud.PAGADA;
                case EN_CAMINO -> EstadoSolicitud.EN_PREPARACION;
                case ENTREGADA -> EstadoSolicitud.EN_CAMINO;
                case COMPLETADA -> EstadoSolicitud.ENTREGADA;
                default -> estadoActual;
            };
        }

        return estadoActual;
    }

    private void cancelarSolicitud(Solicitud solicitud, String motivoCancelacion) {
        solicitud.setEstado(EstadoSolicitud.CANCELADA);
        solicitud.setCanceladoPor(Solicitud.CanceladoPor.CLIENTE);
        solicitud.setMotivoCancelacion(
                (motivoCancelacion == null || motivoCancelacion.isBlank())
                        ? "Cancelación solicitada por el cliente a través del reclamo"
                        : motivoCancelacion.trim()
        );
        solicitud.setFechaCancelacion(LocalDateTime.now());
    }

    private void cancelarReservaSiExiste(Solicitud solicitud) {
        if (inventarioReservaService != null && solicitud != null && solicitud.getIdSolicitud() != null) {
            inventarioReservaService.cancelarReserva(solicitud.getIdSolicitud());
        }
    }

    private void entregarReservaSiExiste(Solicitud solicitud) {
        if (inventarioReservaService != null && solicitud != null && solicitud.getIdSolicitud() != null) {
            inventarioReservaService.entregarReserva(solicitud.getIdSolicitud());
        }
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return "DEM";
        }

        String normalizado = tipo.trim().toUpperCase().replace(' ', '_');
        return switch (normalizado) {
            case "CANCELACION", "CANCELAR", "CANCEL", "CANCELADO", "CANCELADA" -> "CAN";
            case "ENTREGA_INCOMPLETA", "ENTREGA_INCOMPLETO", "ENTREGA_INCOMP", "ENTREGA" -> "ENT";
            case "DEMORA", "DEMORADO", "RETRASO", "ATRASO" -> "DEM";
            default -> normalizado.length() > 10 ? normalizado.substring(0, 10) : normalizado;
        };
    }

    private String normalizarTipoNegocio(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return "DEMORA";
        }

        String normalizado = tipo.trim().toUpperCase().replace(' ', '_');
        return switch (normalizado) {
            case "CAN", "CANCELACION", "CANCELAR", "CANCEL", "CANCELADO", "CANCELADA" -> "CANCELACION";
            case "ENT", "ENTREGA_INCOMPLETA", "ENTREGA_INCOMPLETO", "ENTREGA_INCOMP", "ENTREGA" -> "ENTREGA_INCOMPLETA";
            case "DEM", "DEMORA", "DEMORADO", "RETRASO", "ATRASO" -> "DEMORA";
            default -> normalizado;
        };
    }

    private String normalizarAccion(String accion, String tipo) {
        if (accion == null || accion.isBlank()) {
            return "MANTENER";
        }

        String normalizado = accion.trim().toUpperCase().replace(' ', '_');
        return switch (normalizado) {
            case "MANTENER", "MANTENER_ESTADO" -> "MANTENER";
            case "CANCELAR", "CANCELAR_SOLICITUD" -> "CANCELAR";
            case "EN_PREPARACION" -> "EN_PREPARACION";
            case "PAGO_PENDIENTE" -> "PAGO_PENDIENTE";
            case "PAGO_VALIDANDO" -> "PAGO_VALIDANDO";
            case "AVANZAR", "AVANZAR_ESTADO", "SIGUIENTE_ESTADO" -> "AVANZAR";
            case "RETROCEDER", "RETROCEDER_ESTADO", "ESTADO_ANTERIOR" -> "RETROCEDER";
            default -> normalizado;
        };
    }

    private boolean existeReclamoActivo(Integer idSolicitud, String tipo) {
        if (idSolicitud == null || tipo == null || tipo.isBlank()) {
            return false;
        }

        return reclamoRepository.findByIdSolicitudAndTipoOrderByFechaCreacionDesc(idSolicitud, tipo)
                .stream()
                .anyMatch(reclamo -> {
                    String estado = reclamo.getEstado();
                    return estado != null && !List.of("RESUELTO", "RECHAZADO").contains(estado.trim().toUpperCase());
                });
    }

    private String construirDescripcionReclamo(String tipo, String accion, String motivo, EstadoSolicitud estado) {
        String base = switch (tipo) {
            case "CANCELACION" -> "Reclamo por cancelación registrado por el cliente";
            case "ENTREGA_INCOMPLETA" -> "Reclamo por entrega incompleta registrado por el cliente";
            default -> "Reclamo por demora registrado por el cliente";
        };

        String detalle = switch (accion) {
            case "CANCELAR" -> " con acción de cancelación";
            case "EN_PREPARACION" -> " con cambio a EN PREPARACION";
            case "PAGO_PENDIENTE" -> " con cambio a PAGO PENDIENTE";
            case "PAGO_VALIDANDO" -> " con cambio a PAGO VALIDANDO";
            default -> " manteniendo el estado actual";
        };

        if (motivo != null && !motivo.isBlank()) {
            return base + detalle + ". Motivo: " + motivo.trim();
        }

        return base + detalle + ". Estado final: " + (estado != null ? estado.name() : "SIN_CAMBIO");
    }

    @Transactional(readOnly = true)
    public List<ReclamoProveedorResponse> listarReclamosProveedor(Integer idProveedor) {
        List<Reclamo> reclamos = reclamoRepository.findByIdProveedorOrderByFechaCreacionDesc(idProveedor);
        List<Integer> idsSolicitudes = reclamos.stream()
                .map(Reclamo::getIdSolicitud)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Integer, Solicitud> solicitudesPorId = solicitudRepository.findAllById(idsSolicitudes)
                .stream()
                .collect(Collectors.toMap(Solicitud::getIdSolicitud, solicitud -> solicitud));

        return reclamos.stream()
                .map(reclamo -> toProveedorResponse(reclamo, solicitudesPorId.get(reclamo.getIdSolicitud())))
                .toList();
    }

    @Transactional
    public ReclamoProveedorResponse actualizarEstadoProveedor(
            Integer idReclamo,
            Integer idProveedor,
            Integer idUsuario,
            ActualizarReclamoRequest request) {
        return actualizarEstadoProveedor(idReclamo, idProveedor, idUsuario, request, null);
    }

    @Transactional
    public ReclamoProveedorResponse actualizarEstadoProveedor(
            Integer idReclamo,
            Integer idProveedor,
            Integer idUsuario,
            ActualizarReclamoRequest request,
            HttpServletRequest httpRequest) {

        Reclamo reclamo = reclamoRepository.findById(idReclamo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reclamo no encontrado"));

        if (!idProveedor.equals(reclamo.getIdProveedor())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El reclamo no pertenece al proveedor autenticado");
        }

        String nuevoEstado = normalizarEstado(request.getEstado());
        reclamo.setEstado(nuevoEstado);
        reclamo.setResolucion(request.getResolucion());

        if (request != null && "RESUELTO".equals(nuevoEstado) && "AVANZAR".equals(normalizarAccion(request.getAccion(), reclamo.getTipo()))) {
            solicitudRepository.findById(reclamo.getIdSolicitud()).ifPresent(solicitud -> validarCodigoEntrega(solicitud, request.getCodigoEntrega()));
        }

        if ("RESUELTO".equals(nuevoEstado) || "RECHAZADO".equals(nuevoEstado)) {
            reclamo.setFechaResolucion(LocalDateTime.now());
        } else {
            reclamo.setFechaResolucion(null);
        }

        Reclamo guardado = reclamoRepository.save(reclamo);
        solicitudRepository.findById(reclamo.getIdSolicitud())
                .ifPresent(solicitud -> {
                    if ("RESUELTO".equals(nuevoEstado) || "RECHAZADO".equals(nuevoEstado)) {
                        aplicarAccionSolicitud(solicitud, normalizarTipoNegocio(reclamo.getTipo()), request.getAccion(), null, request.getResolucion(), request.getCodigoEntrega());
                        solicitudRepository.save(solicitud);
                    }
                    guardarHistorialReclamo(
                            solicitud,
                            idUsuario,
                            nuevoEstado,
                            descripcionCambioReclamo(nuevoEstado, request.getResolucion())
                    );
                    emailService.enviarCorreoEstadoReclamo(
                            solicitud,
                            nuevoEstado,
                            descripcionCambioReclamo(nuevoEstado, request.getResolucion())
                    );
                });

        registrarLog(
                idUsuario,
                "ACTUALIZAR_ESTADO_RECLAMO",
                "RECLAMOS",
                "Reclamo " + idReclamo + " cambio a " + nuevoEstado,
                httpRequest
        );

        return toProveedorResponse(guardado);
    }

    private void registrarLog(Integer idUsuario, String accion, String modulo, String descripcion, HttpServletRequest request) {
        if (logsSistemaService == null) {
            return;
        }
        logsSistemaService.registrarLog(idUsuario, accion, modulo, descripcion, request);
    }

    private String normalizarEstado(String estado) {
        String normalizado = estado == null ? "" : estado.trim().toUpperCase();
        if (!ESTADOS_RECLAMO.contains(normalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de reclamo invalido");
        }
        return normalizado;
    }

    private void guardarHistorialReclamo(Solicitud solicitud, Integer idUsuario, String estado, String descripcion) {
        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(solicitud);
        historial.setIdUsuario(idUsuario);
        historial.setEstado("RECLAMO_" + estado);
        historial.setDescripcion(descripcion);
        historial.setFecha(LocalDateTime.now());
        historialRepository.save(historial);
    }

    private String descripcionCambioReclamo(String estado, String resolucion) {
        String base = switch (estado) {
            case "ABIERTO" -> "Reclamo reabierto por el proveedor";
            case "EN_REVISION" -> "Reclamo en revision por el proveedor";
            case "RESUELTO" -> "Reclamo resuelto por el proveedor";
            case "RECHAZADO" -> "Reclamo rechazado por el proveedor";
            default -> "Estado del reclamo actualizado";
        };

        if (resolucion == null || resolucion.isBlank()) {
            return base;
        }

        return base + ": " + resolucion.trim();
    }

    private ReclamoProveedorResponse toProveedorResponse(Reclamo reclamo) {
        return toProveedorResponse(reclamo, null);
    }

    private ReclamoProveedorResponse toProveedorResponse(Reclamo reclamo, Solicitud solicitud) {
        ReclamoProveedorResponse response = new ReclamoProveedorResponse();
        response.setIdReclamo(reclamo.getIdReclamo());
        response.setIdSolicitud(reclamo.getIdSolicitud());
        response.setIdUsuario(reclamo.getIdUsuario());
        response.setIdProveedor(reclamo.getIdProveedor());
        response.setTipo(reclamo.getTipo());
        response.setDescripcion(reclamo.getDescripcion());
        response.setEvidenciaUrl(reclamo.getEvidenciaUrl());
        response.setEstado(reclamo.getEstado());
        response.setResolucion(reclamo.getResolucion());
        response.setFechaCreacion(reclamo.getFechaCreacion());
        response.setFechaResolucion(reclamo.getFechaResolucion());

        if (solicitud != null) {
            response.setDireccionEnvio(solicitud.getDireccionEnvio());
            response.setTotalSolicitud(solicitud.getTotal());
            response.setEstadoSolicitud(solicitud.getEstado() != null ? solicitud.getEstado().name() : null);

            if (solicitud.getUsuario() != null) {
                Usuario usuario = solicitud.getUsuario();
                response.setNombreCliente((usuario.getNombres() + " " + usuario.getApellidos()).trim());
                response.setCorreoCliente(usuario.getCorreo());
                response.setTelefonoCliente(usuario.getTelefono());
            }

            if (solicitud.getEmpresaCompradora() != null) {
                response.setNombreEmpresa(solicitud.getEmpresaCompradora().getRazonSocial());
            }

            response.setHistorial(historialRepository
                    .findBySolicitud_IdSolicitudOrderByFechaAsc(solicitud.getIdSolicitud())
                    .stream()
                    .filter(item -> item.getEstado() != null && item.getEstado().startsWith("RECLAMO_"))
                    .map(item -> new ReclamoHistorialResponse(
                            item.getEstado().replace("RECLAMO_", ""),
                            item.getDescripcion(),
                            item.getFecha()
                    ))
                    .toList());
        }

        return response;
    }
}
