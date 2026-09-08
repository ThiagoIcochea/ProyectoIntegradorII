package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nethink.b2b.dto.request.ProfileUpdateRequest;
import com.nethink.b2b.dto.request.AdminUserUpdateRequest;
import com.nethink.b2b.dto.request.AdminCreateUserRequest;
import com.nethink.b2b.dto.request.PasswordResetCompleteRequest;
import com.nethink.b2b.dto.request.RegisterClientRequest;
import com.nethink.b2b.dto.response.ProfileResponse;
import com.nethink.b2b.entity.PreferenciaUsuario;
import com.nethink.b2b.entity.Rol;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.PreferenciaUsuarioRepository;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.repository.ReclamoRepository;
import com.nethink.b2b.repository.RolRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.nethink.b2b.dto.response.AdminUserResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.List;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepo;
    private final PreferenciaUsuarioRepository prefRepo;
    private final Cloudinary cloudinary;
    private final RolRepository rolRepository;
    private final EmailService emailService;
    private final LogsSistemaService logsSistemaService;
    private final ProveedorRepository proveedorRepository;
    private final ReclamoRepository reclamoRepository;
    private final PasswordEncoder passwordEncoder;
    @org.springframework.beans.factory.annotation.Autowired
    private SunatService sunatService;

    public UsuarioService(
            UsuarioRepository usuarioRepo,
            PreferenciaUsuarioRepository prefRepo,
            Cloudinary cloudinary,
            RolRepository rolRepository,
            EmailService emailService,
            LogsSistemaService logsSistemaService,
            ProveedorRepository proveedorRepository,
            ReclamoRepository reclamoRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepo = usuarioRepo;
        this.prefRepo = prefRepo;
        this.cloudinary = cloudinary;
        this.rolRepository = rolRepository;
        this.emailService=emailService;
        this.logsSistemaService = logsSistemaService;
        this.proveedorRepository = proveedorRepository;
        this.reclamoRepository = reclamoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void registrarCliente(RegisterClientRequest req,  HttpServletRequest request) {
        validarRegistroCliente(req);

        if (usuarioRepo.findByCorreo(req.getCorreo()).isPresent()) {
            throw new RuntimeException("Correo ya registrado");
        }

        Rol rol = rolRepository.findById(2)
                .orElseThrow(() -> new RuntimeException("Rol CLIENTE no encontrado"));

        Usuario usuario = new Usuario();

        usuario.setNombres(req.getNombres());
        usuario.setApellidos(req.getApellidos());
        usuario.setCorreo(req.getCorreo());
        usuario.setTelefono(req.getTelefono());
        usuario.setWhatsapp(req.getWhatsapp());
        usuario.setPassword(encodePassword(req.getPassword()));
        usuario.setDireccion(req.getDireccion());
        usuario.setFotoPerfil(req.getFotoPerfil());

        usuario.setRol(rol);

        usuario.setEstado(EstadoUsuario.ACTIVO);

        usuario.setFechaRegistro(LocalDateTime.now());
        

        usuario = usuarioRepo.save(usuario);
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "REGISTRO_USUARIO",
    "USUARIOS",
    "Nuevo cliente registrado: "
        + usuario.getCorreo(),
     request
);
        
        emailService.enviarCorreoRegistroCliente(usuario);
    }

    public ProfileResponse obtenerPerfil(String correo,  HttpServletRequest request) {

        Usuario usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow();
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "VER_PERFIL",
    "USUARIOS",
    "Consulta perfil usuario",
    request
);

        PreferenciaUsuario pref = prefRepo
                .findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElseGet(() -> {
                    PreferenciaUsuario nueva = new PreferenciaUsuario();
                    nueva.setUsuario(usuario);
                    nueva.setFechaActualizacion(LocalDateTime.now());
                    return prefRepo.save(nueva);
                });

        ProfileResponse r = new ProfileResponse();

        r.setIdUsuario(usuario.getIdUsuario());
        r.setNombres(usuario.getNombres());
        r.setApellidos(usuario.getApellidos());
        r.setCorreo(usuario.getCorreo());
        r.setTelefono(usuario.getTelefono());
        r.setWhatsapp(usuario.getWhatsapp());
        r.setDireccion(usuario.getDireccion());
        r.setFotoPerfil(usuario.getFotoPerfil());
        r.setRol(usuario.getRol().getNombre());

        proveedorRepository.findByUsuario_Correo(usuario.getCorreo()).ifPresent(proveedor -> {
            r.setRazonSocial(proveedor.getRazonSocial());
            r.setRuc(proveedor.getRuc());
            r.setDescripcion(proveedor.getDescripcion());
        });

        r.setNotificacionesRfq(pref.getNotificacionesRfq());
        r.setEntregaRapida(pref.getEntregaRapida());

        return r;
    }

    @org.springframework.transaction.annotation.Transactional
    public void actualizarPerfil(
            String correo,
            ProfileUpdateRequest req,
            MultipartFile foto,
            String fotoUrl,
             HttpServletRequest request
    ) {
        validarPerfil(req);

        Usuario usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow();

        var proveedorActual = proveedorRepository.findByUsuario_Correo(correo).orElse(null);
        com.nethink.b2b.dto.response.SunatResponse datosEmpresa = null;
        if (proveedorActual != null) {
            var duplicado = proveedorRepository.findByRuc(req.getRuc());
            if (duplicado.isPresent() && !duplicado.get().getIdProveedor().equals(proveedorActual.getIdProveedor())) {
                throw new IllegalArgumentException("El RUC ya pertenece a otro proveedor.");
            }
            datosEmpresa = sunatService.consultarRucCompleto(req.getRuc());
        }

        usuario.setNombres(req.getNombres());
        usuario.setApellidos(req.getApellidos());
        usuario.setTelefono(req.getTelefono());
        usuario.setWhatsapp(req.getWhatsapp());
        usuario.setDireccion(req.getDireccion());
        if (!usuario.getCorreo().equals(req.getCorreo())) {

    boolean existe = usuarioRepo.findByCorreo(req.getCorreo()).isPresent();

    if (existe) {
        
        logsSistemaService.registrarLog(
    null,
    "CORREO_DUPLICADO",
    "USUARIOS",
    "Intento registro con correo existente: "
        + req.getCorreo(),
  request
);
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "ERROR_CORREO_DUPLICADO",
    "USUARIOS",
    "Intento actualizar a correo existente: "
        + req.getCorreo(),
    request
);
        throw new RuntimeException("El correo ya está registrado por otro usuario");
    }

    usuario.setCorreo(req.getCorreo());
    logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "CAMBIO_CORREO",
    "USUARIOS",
    "Correo actualizado a: "
        + req.getCorreo(),
    request
);
    }

        if (foto != null && !foto.isEmpty()) {
            try {
                usuario.setFotoPerfil(subirACloudinary(usuario.getIdUsuario(),foto,request));
            } catch (IOException e) {
                logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "CLOUDINARY_ERROR",
    "USUARIOS",
    e.getMessage(),
    request
);
                throw new RuntimeException("Error subiendo archivo a Cloudinary", e);
            }
        } else if (fotoUrl != null && !fotoUrl.isEmpty()) {
            usuario.setFotoPerfil(fotoUrl);
        }

        usuarioRepo.save(usuario);

        if (proveedorActual != null) {
            proveedorActual.setRazonSocial(datosEmpresa.getRazonSocial());
            if (!datosEmpresa.getDescripcion().isBlank()
                    || !java.util.Objects.equals(proveedorActual.getRuc(), datosEmpresa.getRuc())) {
                proveedorActual.setDescripcion(datosEmpresa.getDescripcion());
            }
            proveedorActual.setRuc(datosEmpresa.getRuc());
            proveedorRepository.save(proveedorActual);
        }
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "ACTUALIZAR_PERFIL",
    "USUARIOS",
    "Perfil actualizado",
    request
);

        emailService.enviarCorreoActualizacionUsuario(
                usuario,
                "Perfil actualizado",
                "Tus datos de perfil fueron actualizados correctamente.",
                "Perfil actualizado - NETHINK B2B"
        );

        PreferenciaUsuario pref = prefRepo
                .findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElse(new PreferenciaUsuario());

        pref.setUsuario(usuario);
        pref.setNotificacionesRfq(req.isNotificaciones());
        pref.setEntregaRapida(req.isEntregaRapida());
        pref.setFechaActualizacion(LocalDateTime.now());

        prefRepo.save(pref);
    }

    private String subirACloudinary( Integer idUsuario,MultipartFile archivo,  HttpServletRequest request) throws IOException {

        Map uploadResult = cloudinary.uploader().upload(
                archivo.getBytes(),
                ObjectUtils.asMap(
                        "folder", "b2b/perfil"
                )
        );
        
        logsSistemaService.registrarLog(
    idUsuario,
    "UPLOAD_FOTO",
    "CLOUDINARY",
    "Foto perfil subida correctamente",
    request
);

        return uploadResult.get("secure_url").toString();
    }
    
    public List<AdminUserResponse> listarUsuarios(Integer idUsuario, HttpServletRequest request) {
    logsSistemaService.registrarLog(
    idUsuario,
    "LISTAR_USUARIOS",
    "ADMIN",
    "Consulta global usuarios",
    request
);
    List<Usuario> usuarios =
            usuarioRepo.findAllForAdmin();

    List<AdminUserResponse> response =
            new ArrayList<>();

    for (Usuario u : usuarios) {

        AdminUserResponse dto =
                new AdminUserResponse();

        dto.setIdUsuario(
                u.getIdUsuario()
        );

        dto.setNombreCompleto(
                u.getNombres()
                + " "
                + u.getApellidos()
        );
        dto.setNombres(u.getNombres());
        dto.setApellidos(u.getApellidos());

        dto.setCorreo(
                u.getCorreo()
        );

        dto.setRol(
                u.getRol().getNombre()
        );

        dto.setEstado(
                u.getEstado().name()
        );

        dto.setFechaRegistro(
                u.getFechaRegistro()
        );

        dto.setFotoPerfil(
                u.getFotoPerfil()
        );
        dto.setTelefono(u.getTelefono());
        dto.setWhatsapp(u.getWhatsapp());
        dto.setDireccion(u.getDireccion());

        response.add(dto);
    }

    return response;
}

public AdminUserResponse crearUsuarioAdmin(AdminCreateUserRequest req, HttpServletRequest request) {
    validarAdminUsuarioCreacion(req);

    if (usuarioRepo.findByCorreo(req.getCorreo()).isPresent()) {
        throw new RuntimeException("El correo ya está registrado por otro usuario");
    }

    String rolNombre = req.getRol() != null
            ? req.getRol().trim().toUpperCase().replaceFirst("^ROLE_", "")
            : "CLIENTE";

    Rol rol = rolRepository.findByNombreIgnoreCase(rolNombre)
            .orElseThrow(() -> new RuntimeException("Rol " + rolNombre + " no encontrado"));

    Usuario usuario = new Usuario();
    usuario.setNombres(req.getNombres());
    usuario.setApellidos(req.getApellidos());
    usuario.setCorreo(req.getCorreo());
    usuario.setTelefono(req.getTelefono());
    usuario.setWhatsapp(req.getWhatsapp());
    usuario.setDireccion(req.getDireccion());
    usuario.setPassword(encodePassword(req.getPassword()));
    usuario.setRol(rol);

    if (req.getEstado() != null && !req.getEstado().isBlank()) {
        usuario.setEstado(EstadoUsuario.valueOf(req.getEstado().trim().toUpperCase()));
    } else {
        usuario.setEstado(EstadoUsuario.ACTIVO);
    }

    usuario.setFechaRegistro(LocalDateTime.now());

    usuario = usuarioRepo.save(usuario);

    logsSistemaService.registrarLog(
            usuario.getIdUsuario(),
            "ADMIN_USUARIO_CREADO",
            "ADMIN",
            "Usuario creado por administrador",
            request
    );

    return toAdminUserResponse(usuario);
}

public AdminUserResponse actualizarUsuarioAdmin(Integer idUsuario, AdminUserUpdateRequest req, HttpServletRequest request) {
    validarAdminUsuario(req);

    Usuario usuario = usuarioRepo.findById(idUsuario)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    if (req.getCorreo() != null && !req.getCorreo().isBlank() && !req.getCorreo().equalsIgnoreCase(usuario.getCorreo())) {
        String correo = req.getCorreo().trim();
        Usuario existente = usuarioRepo.findByCorreo(correo).orElse(null);

        if (existente != null && !existente.getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new RuntimeException("El correo ya esta registrado por otro usuario");
        }

        usuario.setCorreo(correo);
    }

    if (req.getNombres() != null) usuario.setNombres(req.getNombres().trim());
    if (req.getApellidos() != null) usuario.setApellidos(req.getApellidos().trim());
    if (req.getTelefono() != null) usuario.setTelefono(req.getTelefono().trim());
    if (req.getWhatsapp() != null) usuario.setWhatsapp(req.getWhatsapp().trim());
    if (req.getDireccion() != null) usuario.setDireccion(req.getDireccion().trim());
    if (req.getPassword() != null && !req.getPassword().isBlank()) usuario.setPassword(encodePassword(req.getPassword()));
    // El rol queda fijo para evitar cambios no autorizados desde la gestión administrativa.

    EstadoUsuario estadoAnterior = usuario.getEstado();
    if (req.getEstado() != null && !req.getEstado().isBlank()) {
        usuario.setEstado(EstadoUsuario.valueOf(req.getEstado().trim().toUpperCase()));
    }

    usuario = usuarioRepo.save(usuario);

    if (estadoAnterior != EstadoUsuario.ACTIVO && usuario.getEstado() == EstadoUsuario.ACTIVO) {
        reactivarProveedorSiCorresponde(usuario);
    }

    logsSistemaService.registrarLog(
            usuario.getIdUsuario(),
            "ADMIN_USUARIO_ACTUALIZADO",
            "ADMIN",
            "Usuario gestionado por administrador",
            request
    );

    emailService.enviarCorreoActualizacionUsuario(
            usuario,
            "Datos actualizados",
            "Un administrador actualizo los datos de tu cuenta.",
            "Datos de cuenta actualizados - NETHINK B2B"
    );

    return toAdminUserResponse(usuario);
}

public void completarResetPassword(PasswordResetCompleteRequest req) {
    Usuario usuario = usuarioRepo.findByCorreo(req.getEmail())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    if (req.getNewPassword() == null || req.getNewPassword().trim().length() < 6) {
        throw new RuntimeException("La nueva contrasena debe tener al menos 6 caracteres");
    }

    usuario.setPassword(encodePassword(req.getNewPassword()));
    usuarioRepo.save(usuario);
}

private String encodePassword(String password) {
    return passwordEncoder.encode(password);
}

private void reactivarProveedorSiCorresponde(Usuario usuario) {
    proveedorRepository.findByUsuario_Correo(usuario.getCorreo()).ifPresent(proveedor -> {
        proveedor.setEstado("ACTIVO");
        proveedorRepository.save(proveedor);

        reclamoRepository.findByIdProveedor(proveedor.getIdProveedor()).forEach(reclamo -> {
            reclamo.setEstado("RESUELTO");
            reclamo.setResolucion("Penalizacion reiniciada por reactivacion administrativa.");
            if (reclamo.getFechaResolucion() == null) {
                reclamo.setFechaResolucion(LocalDateTime.now());
            }
            reclamoRepository.save(reclamo);
        });
    });
}

private AdminUserResponse toAdminUserResponse(Usuario u) {
    AdminUserResponse dto = new AdminUserResponse();
    dto.setIdUsuario(u.getIdUsuario());
    dto.setNombreCompleto((u.getNombres() + " " + u.getApellidos()).trim());
    dto.setNombres(u.getNombres());
    dto.setApellidos(u.getApellidos());
    dto.setCorreo(u.getCorreo());
    dto.setRol(u.getRol().getNombre());
    dto.setEstado(u.getEstado().name());
    dto.setFechaRegistro(u.getFechaRegistro());
    dto.setFotoPerfil(u.getFotoPerfil());
    dto.setTelefono(u.getTelefono());
    dto.setWhatsapp(u.getWhatsapp());
    dto.setDireccion(u.getDireccion());
    return dto;
}

private void validarRegistroCliente(RegisterClientRequest req) {
    validarTexto(req.getNombres(), "Nombres invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getApellidos(), "Apellidos invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getCorreo(), "Correo invalido", "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    validarTexto(soloDigitos(req.getTelefono()), "Telefono invalido", "^9\\d{8}$");
    validarTexto(soloDigitos(req.getWhatsapp()), "WhatsApp invalido", "^9\\d{8}$");
    validarTexto(req.getPassword(), "Contrasena invalida", "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$");
    validarTexto(req.getDireccion(), "Direccion invalida", "^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$");
}

private void validarPerfil(ProfileUpdateRequest req) {
    validarTexto(req.getNombres(), "Nombres invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getApellidos(), "Apellidos invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getCorreo(), "Correo invalido", "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    validarTexto(soloDigitos(req.getTelefono()), "Telefono invalido", "^9\\d{8}$");
    validarTexto(soloDigitos(req.getWhatsapp()), "WhatsApp invalido", "^9\\d{8}$");
    validarTexto(req.getDireccion(), "Direccion invalida", "^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$");

    if (req.getRuc() != null && !req.getRuc().isBlank()) {
        validarTexto(req.getRuc(), "RUC invalido", "^(10|20)\\d{9}$");
    }


}

public List<String> listarRoles() {
        return rolRepository.findAll().stream()
                .map(Rol::getNombre)
                .toList();
    }

    private void validarAdminUsuarioCreacion(AdminCreateUserRequest req) {
    validarTexto(req.getNombres(), "Nombres invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getApellidos(), "Apellidos invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    validarTexto(req.getCorreo(), "Correo invalido", "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    validarTexto(req.getPassword(), "Contrasena invalida", "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$");
    if (req.getTelefono() != null && !req.getTelefono().isBlank()) {
        validarTexto(soloDigitos(req.getTelefono()), "Telefono invalido", "^9\\d{8}$");
    }
    if (req.getWhatsapp() != null && !req.getWhatsapp().isBlank()) {
        validarTexto(soloDigitos(req.getWhatsapp()), "WhatsApp invalido", "^9\\d{8}$");
    }
    if (req.getDireccion() != null && !req.getDireccion().isBlank()) {
        validarTexto(req.getDireccion(), "Direccion invalida", "^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$");
    }
}

private void validarAdminUsuario(AdminUserUpdateRequest req) {
    if (req.getNombres() != null && !req.getNombres().isBlank()) {
        validarTexto(req.getNombres(), "Nombres invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    }
    if (req.getApellidos() != null && !req.getApellidos().isBlank()) {
        validarTexto(req.getApellidos(), "Apellidos invalidos", "^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$");
    }
    if (req.getCorreo() != null && !req.getCorreo().isBlank()) {
        validarTexto(req.getCorreo(), "Correo invalido", "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    }
    if (req.getTelefono() != null && !req.getTelefono().isBlank()) {
        validarTexto(soloDigitos(req.getTelefono()), "Telefono invalido", "^9\\d{8}$");
    }
    if (req.getWhatsapp() != null && !req.getWhatsapp().isBlank()) {
        validarTexto(soloDigitos(req.getWhatsapp()), "WhatsApp invalido", "^9\\d{8}$");
    }
    if (req.getDireccion() != null && !req.getDireccion().isBlank()) {
        validarTexto(req.getDireccion(), "Direccion invalida", "^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$");
    }
}

private Integer resolveRolId(String rol) {
    if (rol == null || rol.isBlank()) {
        return 2;
    }
    String normalized = rol.trim().toUpperCase();
    return switch (normalized) {
        case "ADMIN" -> 1;
        case "PROVEEDOR" -> 3;
        default -> 2;
    };
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
