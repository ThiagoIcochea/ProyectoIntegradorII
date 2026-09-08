package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.request.MetodoPagoRequest;
import com.nethink.b2b.dto.request.CertificacionRequest;
import com.nethink.b2b.dto.response.SunatResponse;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nethink.b2b.dto.response.AdminProviderResponse;
import com.nethink.b2b.dto.response.IndicadorProveedorResponse;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Comparator;
import java.util.Optional;

@Service
public class ProveedorService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private SunatService sunatService;

    @Autowired
    private EmailService emailService;
      @Autowired
    private ScoringService scoringService;

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;
    
    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private CertificacionRepository certificacionRepository;

    @Autowired
    private ProveedorCertificacionRepository proveedorCertificacionRepository;
    
    @Autowired
    
    private SolicitudRepository solicitudRepo;
    
    @Autowired
private LogsSistemaService logsSistemaService;
    
    @Autowired
private LogsApiRepository logsApiRepository;

    @Autowired
    private ReclamoRepository reclamoRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private PlanPrecioRepository planPrecioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PlanRepository planRepository;

    @Transactional
    public void registerProvider(RegisterProviderRequest req,  HttpServletRequest request) {
        validarRegistroProveedor(req);

        if (usuarioRepository.findByCorreo(req.getCorreo()).isPresent()) {
            logsSistemaService.registrarLog(
    null,
    "CORREO_DUPLICADO",
    "PROVEEDORES",
    "Intento registro proveedor con correo existente: "
        + req.getCorreo(),
    request
);
            throw new RuntimeException("Correo ya registrado");
        }

        if (proveedorRepository.findByRuc(req.getRuc()).isPresent()) {
            
            logsSistemaService.registrarLog(
    null,
    "RUC_DUPLICADO",
    "PROVEEDORES",
    "Intento registro con RUC existente: "
        + req.getRuc(),
    request
);
            
            throw new RuntimeException("RUC ya registrado");
        }

        SunatResponse sunat = sunatService.consultarRucCompleto(req.getRuc());

        if (sunat == null || sunat.getRazonSocial() == null) {
            logsSistemaService.registrarLog(
    null,
    "SUNAT_ERROR",
    "SUNAT",
    "RUC inválido consultado: "
        + req.getRuc(),
   request
);
            throw new RuntimeException("RUC inválido en SUNAT");
        }

        Rol rolProveedor = rolRepository.findById(3)
                .orElseThrow(() -> new RuntimeException("Rol proveedor no existe"));

        Usuario user = new Usuario();
        user.setNombres(req.getNombres());
        user.setApellidos(req.getApellidos());
        user.setCorreo(req.getCorreo());
        user.setTelefono(req.getTelefono());
        user.setWhatsapp(req.getWhatsapp());
        user.setPassword(encodePassword(req.getPassword()));
        user.setDireccion(req.getDireccion());
        user.setEstado(EstadoUsuario.ACTIVO);
        user.setFechaRegistro(LocalDateTime.now());
        user.setRol(rolProveedor);

        user = usuarioRepository.save(user);
        
        logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "USUARIO_PROVEEDOR_CREADO",
    "PROVEEDORES",
    "Usuario proveedor registrado: "
        + user.getCorreo(),
   request
);

        Proveedor prov = new Proveedor();
        prov.setUsuario(user);
        prov.setRazonSocial(sunat.getRazonSocial());
        prov.setRuc(req.getRuc());
        prov.setDescripcion(sunat.getDescripcion());
        prov.setApiUrl(req.getApiUrl());
        prov.setApiTipo(req.getApiTipo());
        prov.setApiToken(normalizarTokenOpcional(req.getApiToken()));
        prov.setFechaRegistro(LocalDateTime.now());
        prov.setEstado("ACTIVO");

       prov = proveedorRepository.save(prov);
       
       logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "PROVEEDOR_REGISTRADO",
    "PROVEEDORES",
    "Proveedor registrado: "
        + prov.getRazonSocial()
        + " | RUC: "
        + prov.getRuc(),
    request
);

        if (req.getMetodosPago() != null) {
            for (MetodoPagoRequest mp : req.getMetodosPago()) {

                MetodoPago metodo = new MetodoPago();
                metodo.setIdProveedor(prov.getIdProveedor());
                metodo.setTipo(mp.getTipo());
                metodo.setEntidad(mp.getEntidad());
                metodo.setNumeroCuenta(mp.getNumeroCuenta());

                metodoPagoRepository.save(metodo);
                
                logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "METODO_PAGO_REGISTRADO",
    "PROVEEDORES",
    "Método pago agregado proveedor: "
        + prov.getRazonSocial(),
   request
);
            }
        }

        if (req.getCertificaciones() != null) {
            for (CertificacionRequest c : req.getCertificaciones()) {

                Certificacion cert = certificacionRepository.findById(c.getIdCertificacion())
                        .orElseThrow(() -> new RuntimeException("Certificación no existe"));

                ProveedorCertificacion pc = new ProveedorCertificacion();
                pc.setProveedor(prov);
                pc.setCertificacion(cert);
                pc.setFechaObtencion(c.getFechaObtencion());
                pc.setFechaExpiracion(c.getFechaExpiracion());

                proveedorCertificacionRepository.save(pc);
                
                logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "CERTIFICACION_REGISTRADA",
    "PROVEEDORES",
    "Certificación agregada: "
        + cert.getNombre(),
    request
);
            }
        }

        crearSuscripcionFreemium(user);

        emailService.enviarCorreoRegistroProveedor(
                user,
                prov.getRazonSocial(),
                prov.getRuc()
        );
        
        logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "EMAIL_REGISTRO",
    "EMAIL",
    "Correo registro proveedor enviado",
    request
);
    }

    private void crearSuscripcionFreemium(Usuario usuario) {
        LocalDateTime ahora = LocalDateTime.now();
        Plan plan = planRepository.findById(1).orElseGet(() -> {
            Plan nuevoPlan = new Plan();
            nuevoPlan.setIdPlan(1);
            nuevoPlan.setNombre("Freemium");
            nuevoPlan.setDescripcion("Plan inicial gratuito para nuevos proveedores");
            nuevoPlan.setActivo(true);
            nuevoPlan.setFechaCreacion(ahora);
            return planRepository.save(nuevoPlan);
        });

        PlanPrecio precio = planPrecioRepository.findById(1).orElseGet(() -> {
            PlanPrecio nuevoPrecio = new PlanPrecio();
            nuevoPrecio.setIdPrecio(1);
            nuevoPrecio.setPlan(plan);
            nuevoPrecio.setPeriodoMeses(1);
            nuevoPrecio.setPrecio(BigDecimal.ZERO);
            nuevoPrecio.setActivo(true);
            nuevoPrecio.setFechaCreacion(ahora);
            return planPrecioRepository.save(nuevoPrecio);
        });

        Suscripcion suscripcion = new Suscripcion();
        suscripcion.setUsuario(usuario);
        suscripcion.setPrecio(precio);
        suscripcion.setMontoPagado(BigDecimal.ZERO);
        suscripcion.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
        suscripcion.setFechaInicio(ahora);
        suscripcion.setFechaFin(ahora.plusDays(30));
        suscripcion.setFechaCreacion(ahora);
        suscripcion.setFechaActualizacion(ahora);
        suscripcionRepository.save(suscripcion);
    }
    
   @Transactional
   public void actualizarEstadoProveedor(Integer idProveedor, String estado) {
       Proveedor proveedor = proveedorRepository.findById(idProveedor)
               .orElseThrow(() -> new RuntimeException("Proveedor no existe"));

       String normalized = estado == null ? "ACTIVO" : estado.trim().toUpperCase();
       if (!List.of("ACTIVO", "INACTIVO", "SUSPENDIDO").contains(normalized)) {
           throw new RuntimeException("Estado inválido");
       }

       proveedor.setEstado(normalized);
       proveedorRepository.save(proveedor);
   }

   public List<AdminProviderResponse> listarProviders(Integer idUsuario,  HttpServletRequest request) {

       logsSistemaService.registrarLog(
    idUsuario,
    "LISTAR_PROVEEDORES",
    "ADMIN",
    "Consulta global proveedores",
    request
);
    List<Proveedor> providers =
            proveedorRepository.findAllForAdmin();

    List<AdminProviderResponse> response =
            new ArrayList<>();

    for (Proveedor p : providers) {

        AdminProviderResponse dto =
                new AdminProviderResponse();

        dto.setIdProveedor(
                p.getIdProveedor());

        dto.setRazonSocial(
                p.getRazonSocial());

        dto.setRuc(
                p.getRuc());

        dto.setApiUrl(
                p.getApiUrl());

        dto.setApiTipo(
                p.getApiTipo());

        dto.setEstado(
                p.getEstado());

        if (p.getUsuario() != null) {

            dto.setCorreo(
                    p.getUsuario()
                     .getCorreo());
        }

        dto.setEstadoApi(p.getEstadoApi());
        
        

        response.add(dto);
    }

    return response;
}
   
   
   public IndicadorProveedorResponse obtenerIndicadoresPorProveedor(Integer idProveedor) {

    Proveedor proveedor = proveedorRepository.findById(idProveedor)
            .orElseThrow(() -> new RuntimeException("Proveedor no existe"));

    int completadas = solicitudRepo
            .countByProveedor_IdProveedorAndEstado(idProveedor, EstadoSolicitud.ENTREGADA)+ solicitudRepo
            .countByProveedor_IdProveedorAndEstado(idProveedor, EstadoSolicitud.COMPLETADA);

    int total = solicitudRepo
            .countByProveedor_IdProveedor(idProveedor);
    double cumplimiento = completadas == 0
            ? 0
            : ((double) solicitudRepo.contarEntregasATiempo(idProveedor) / completadas) * 100;

    double scoreCalidad = scoringService.calcularScoreProveedorBasico(idProveedor);
    
    
    double satisfaccion  = solicitudRepo.calcularSatisfaccionProveedor(idProveedor);
    
    double tiempoEntregaPromedio = solicitudRepo.calcularTiempoEntregaPromedio(idProveedor);

        int likes = 0;
        int dislikes = 0;
        int totalResenas = 0;

        try {
                List<Comentario> comentarios = comentarioRepository.findByProveedor_IdProveedor(idProveedor);
                totalResenas = comentarios.size();
                likes = comentarios.stream()
                                .mapToInt(c -> c.getLikes() != null ? c.getLikes() : 0)
                                .sum();
                dislikes = comentarios.stream()
                                .mapToInt(c -> c.getDislikes() != null ? c.getDislikes() : 0)
                                .sum();
        } catch (Exception e) {
                likes = 0;
                dislikes = 0;
                totalResenas = 0;
        }

    IndicadorProveedorResponse dto = new IndicadorProveedorResponse();

    dto.setIdProveedor(idProveedor);
    dto.setRazonSocial(proveedor.getRazonSocial());

    dto.setPedidosCompletados(completadas);
    dto.setPedidosTotal(total);

    dto.setCumplimiento(cumplimiento);

   
    dto.setScoreGeneral(scoreCalidad);
    
    dto.setSatisfaccion(satisfaccion);
    
    dto.setDescripcion(proveedor.getDescripcion());
    
   
    dto.setTiempoEntregaPromedio(tiempoEntregaPromedio);
        dto.setLikes(likes);
        dto.setDislikes(dislikes);
        dto.setTotalResenas(totalResenas);
        dto.setEstado(proveedor.getEstado());
        dto.setVerificado("ACTIVO".equalsIgnoreCase(proveedor.getEstado()));
        dto.setCategoriaPrincipal("Proveedor B2B");
    
    dto.setFechaRegistro(proveedor.getFechaRegistro());

    return dto;
}
   
public List<IndicadorProveedorResponse> top10Proveedores() {

    List<Proveedor> proveedores = proveedorRepository.findAll();

    List<IndicadorProveedorResponse> lista = new ArrayList<>();

    for (Proveedor p : proveedores) {

        if (!esProveedorActivo(p)) {
            continue;
        }

        int completadas = solicitudRepo
                .countByProveedor_IdProveedorAndEstado(
                        p.getIdProveedor(),
                        EstadoSolicitud.ENTREGADA
                ) + solicitudRepo
                .countByProveedor_IdProveedorAndEstado(
                        p.getIdProveedor(),
                        EstadoSolicitud.COMPLETADA
                );

        int total = solicitudRepo
                .countByProveedor_IdProveedor(
                        p.getIdProveedor()
                );

        if (total == 0) {
            continue;
        }

        double cumplimiento = completadas == 0
                ? 0
                : ((double) solicitudRepo.contarEntregasATiempo(p.getIdProveedor()) / completadas) * 100.0;

        double score = scoringService
                .calcularScoreProveedorCompleto(
                        p.getIdProveedor()
                );

        int likes = 0;
        int dislikes = 0;
        int totalResenas = 0;

                Double tiempoEntregaPromedio = solicitudRepo.calcularTiempoEntregaPromedio(p.getIdProveedor());
                if (tiempoEntregaPromedio == null) {
                        tiempoEntregaPromedio = 0.0;
                }

        try {

            List<Comentario> comentarios =
                    comentarioRepository
                            .findByProveedor_IdProveedor(
                                    p.getIdProveedor()
                            );

            totalResenas = comentarios.size();

            likes = comentarios.stream()
                    .mapToInt(c ->
                            c.getLikes() != null
                                    ? c.getLikes()
                                    : 0
                    )
                    .sum();

            dislikes = comentarios.stream()
                    .mapToInt(c ->
                            c.getDislikes() != null
                                    ? c.getDislikes()
                                    : 0
                    )
                    .sum();

        } catch (Exception e) {

            likes = 0;
            dislikes = 0;
            totalResenas = 0;
        }

        int totalFeedback = likes + dislikes;

        int satisfaccion = totalFeedback == 0
                ? 0
                : (likes * 100) / totalFeedback;

        IndicadorProveedorResponse dto =
                new IndicadorProveedorResponse();

        dto.setIdProveedor(
                p.getIdProveedor()
        );
        dto.setDescripcion(p.getDescripcion());
        dto.setRazonSocial(
                p.getRazonSocial()
        );

        dto.setPedidosCompletados(
                completadas
        );

        dto.setPedidosTotal(
                total
        );

        dto.setCumplimiento(cumplimiento);

        dto.setScoreGeneral(
                Math.round(score * 1000.0) / 1000.0
        );

        dto.setLikes(
                likes
        );

        dto.setDislikes(
                dislikes
        );

        dto.setTotalResenas(
                totalResenas
        );

        dto.setSatisfaccion(
                satisfaccion
        );

        dto.setTiempoEntregaPromedio(tiempoEntregaPromedio);

        dto.setEstado(
                p.getEstado()
        );

        dto.setVerificado(
                "ACTIVO".equalsIgnoreCase(
                        p.getEstado()
                )
        );

        dto.setCategoriaPrincipal(
                "Proveedor B2B"
        );

        lista.add(dto);
    }

    return lista.stream()
            .sorted(
                    Comparator.comparingDouble(
                            IndicadorProveedorResponse::getScoreGeneral
                    ).reversed()
            )
            .limit(10)
            .toList();
}

private boolean esProveedorActivo(Proveedor proveedor) {
    if (proveedor == null) {
        return false;
    }

    boolean proveedorActivo = "ACTIVO".equalsIgnoreCase(proveedor.getEstado());
    boolean usuarioActivo = proveedor.getUsuario() != null
            && proveedor.getUsuario().getEstado() == EstadoUsuario.ACTIVO;

    return proveedorActivo && usuarioActivo;
}

private void validarRegistroProveedor(RegisterProviderRequest req) {
    validarTexto(req.getNombres(), "Nombres invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getApellidos(), "Apellidos invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getCorreo(), "Correo invalido", "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    validarTexto(req.getPassword(), "Contrasena invalida", "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$");
    validarTexto(soloDigitos(req.getTelefono()), "Telefono invalido", "^9\\d{8}$");
    validarTexto(soloDigitos(req.getWhatsapp()), "WhatsApp invalido", "^9\\d{8}$");
    validarTexto(req.getDireccion(), "Direccion invalida", "^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$");
    validarTexto(req.getRuc(), "RUC invalido", "^(10|20)\\d{9}$");
    validarTexto(req.getApiUrl(), "Endpoint API invalido", "^https?://\\S+\\.\\S+$");
    if (req.getApiToken() != null && !req.getApiToken().isBlank()) {
        validarTexto(req.getApiToken(), "API Token invalido", "^[A-Za-z0-9._~:/+=-]{8,}$");
    }

    String apiTipo = String.valueOf(req.getApiTipo() == null ? "" : req.getApiTipo()).trim().toUpperCase();
    if (!List.of("REST", "GRAPHQL", "WEBHOOK").contains(apiTipo)) {
        throw new RuntimeException("Tipo de API invalido");
    }

    if (req.getMetodosPago() == null || req.getMetodosPago().isEmpty()) {
        throw new RuntimeException("Debe registrar al menos un metodo de pago");
    }

    for (MetodoPagoRequest metodo : req.getMetodosPago()) {
        String cuenta = soloDigitos(metodo.getNumeroCuenta());
        String tipo = String.valueOf(metodo.getTipo() == null ? "" : metodo.getTipo()).trim().toUpperCase();
        if (List.of("YAPE", "PLIN").contains(tipo)) {
            validarTexto(cuenta, "Metodo de pago invalido", "^9\\d{8}$");
        } else {
            validarTexto(cuenta, "Metodo de pago invalido", "^\\d{6,30}$");
        }
    }
}


private String normalizarTokenOpcional(String token) {
    return token == null || token.isBlank() ? null : token.trim();
}

private String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }

    private void validarTexto(String valor, String mensaje, String regex) {
    if (valor == null || !valor.trim().matches(regex)) {
        throw new RuntimeException(mensaje);
    }
}

private String soloDigitos(String valor) {
    return String.valueOf(valor == null ? "" : valor).replaceAll("\\D", "");
}
}
