package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.nethink.b2b.dto.response.ProductoAdminResponse;
import com.nethink.b2b.entity.Categoria;
import com.nethink.b2b.entity.Marca;
import com.nethink.b2b.repository.CategoriaRepository;
import com.nethink.b2b.repository.MarcaRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;
import com.nethink.b2b.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock private ProductoRepository productoRepository;
    @Mock private ProductoImagenRepository productoImagenRepository;
    @Mock private CategoriaRepository categoriaRepository;
    @Mock private MarcaRepository marcaRepository;
    @Mock private ProductoEspecificacionRepository especificacionesRepository;
    @Mock private CatalogoService catalogoService;
    @Mock private Cloudinary cloudinary;

    @InjectMocks private ProductoService productoService;

    @Test
    void obtenerProductosAdminDebeMapearCamposCorrectamente() {
        Object[] row = new Object[] {1, "Laptop", "SKU-001", "Dell", "Tecnología", 3L, 15L, "ACTIVO"};
        when(productoRepository.obtenerProductosAdmin()).thenReturn(List.<Object[]>of(row));
        when(categoriaRepository.findAll()).thenReturn(List.of(new Categoria()));
        when(marcaRepository.findAll()).thenReturn(List.of(new Marca()));
        when(productoImagenRepository.findByProducto_IdProductoIn(anyList())).thenReturn(List.of());

        List<ProductoAdminResponse> result = productoService.obtenerProductosAdmin();

        assertEquals(1, result.size());
        ProductoAdminResponse dto = result.get(0);
        assertEquals("Laptop", dto.getName());
        assertEquals("SKU-001", dto.getSkuGlobal());
        assertEquals("Dell", dto.getBrand());
        assertEquals("Tecnología", dto.getCategory());
        assertEquals(3, dto.getProvidersCount());
        assertEquals(15, dto.getTotalStock());
        assertEquals("Activo", dto.getStatus());
    }
}
