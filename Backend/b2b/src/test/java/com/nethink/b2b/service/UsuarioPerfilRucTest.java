package com.nethink.b2b.service;

import com.nethink.b2b.repository.*;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.dto.request.ProfileUpdateRequest;
import com.nethink.b2b.dto.response.SunatResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class UsuarioPerfilRucTest {
    @Test
    void guardaDatosDeSunatEnLugarDeLosEnviadosPorElFormulario() {
        var usuarios = mock(UsuarioRepository.class);
        var proveedores = mock(ProveedorRepository.class);
        var preferencias = mock(PreferenciaUsuarioRepository.class);
        var sunat = mock(SunatService.class);
        var service = new UsuarioService(usuarios, preferencias, mock(com.cloudinary.Cloudinary.class),
                mock(RolRepository.class), mock(EmailService.class), mock(LogsSistemaService.class),
                proveedores, mock(ReclamoRepository.class), mock(org.springframework.security.crypto.password.PasswordEncoder.class));
        ReflectionTestUtils.setField(service, "sunatService", sunat);
        var usuario = new Usuario();
        usuario.setIdUsuario(1);
        usuario.setCorreo("juan@empresa.com");
        var proveedor = new Proveedor();
        proveedor.setIdProveedor(1);
        proveedor.setUsuario(usuario);
        when(usuarios.findByCorreo(usuario.getCorreo())).thenReturn(Optional.of(usuario));
        when(proveedores.findByUsuario_Correo(usuario.getCorreo())).thenReturn(Optional.of(proveedor));
        var datos = new SunatResponse();
        datos.setRuc("20123456789");
        datos.setRazonSocial("EMPRESA OFICIAL S.A.C.");
        datos.setEstado("ACTIVO");
        datos.setActividadEconomica("VENTA AL POR MAYOR DE EQUIPO INFORMATICO");
        when(sunat.consultarRucCompleto(datos.getRuc())).thenReturn(datos);
        var request = new ProfileUpdateRequest();
        request.setNombres("Juan");
        request.setApellidos("Perez");
        request.setCorreo(usuario.getCorreo());
        request.setTelefono("987654321");
        request.setWhatsapp("987654321");
        request.setDireccion("Av. Lima 123");
        request.setRuc(datos.getRuc());
        request.setRazonSocial("Valor manual");
        request.setDescripcion("Valor manual");
        service.actualizarPerfil(usuario.getCorreo(), request, null, null, null);
        assertEquals(datos.getRazonSocial(), proveedor.getRazonSocial());
        assertEquals(datos.getDescripcion(), proveedor.getDescripcion());
        assertEquals(datos.getRuc(), proveedor.getRuc());
        verify(proveedores).save(proveedor);
    }
}
