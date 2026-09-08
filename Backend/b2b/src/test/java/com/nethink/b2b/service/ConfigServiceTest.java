package com.nethink.b2b.service;

import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.repository.ConfiguracionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfigServiceTest {

    @Mock
    private ConfiguracionRepository repo;

    @InjectMocks
    private ConfigService service;

    @Test
    void actualizarDatosDeberiaPersistirClaveTipoYEstado() {
        Configuracion config = new Configuracion();
        config.setId(1);
        config.setClave("ANTERIOR");
        config.setValor("valor-viejo");
        config.setTipo("CONFIG");
        config.setEstado("INACTIVO");

        when(repo.findById(1)).thenReturn(Optional.of(config));

        service.actualizarDatos(1, "NUEVA_CLAVE", "valor-nuevo", "API", "ACTIVO");

        assertEquals("NUEVA_CLAVE", config.getClave());
        assertEquals("valor-nuevo", config.getValor());
        assertEquals("API", config.getTipo());
        assertEquals("ACTIVO", config.getEstado());
        verify(repo).save(config);
    }

    @Test
    void actualizarDatosDeberiaNormalizarClavesCategoriaYTiposCompatibles() {
        Configuracion config = new Configuracion();
        config.setId(2);
        config.setClave("ANTERIOR");
        config.setValor("valor-viejo");
        config.setTipo("CONFIG");
        config.setEstado("INACTIVO");

        when(repo.findById(2)).thenReturn(Optional.of(config));

        service.actualizarDatos(2, "cloudinary", "valor-nuevo", "api", "activo");

        assertEquals("CLOUDINARY", config.getClave());
        assertEquals("valor-nuevo", config.getValor());
        assertEquals("API", config.getTipo());
        assertEquals("ACTIVO", config.getEstado());
        verify(repo).save(config);
    }
}
