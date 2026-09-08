package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.FiltroRFQRequest;
import com.nethink.b2b.dto.request.ItemRFQRequest;
import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.enums.PrioridadRFQ;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.PreferenciaUsuarioRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RFQServiceTest {

    @Mock
    private ProveedorProductoRepository provProdRepo;

    @Mock
    private ScoringService scoringService;

    @Mock
    private InventarioReservaService inventarioReSer;

    @Mock
    private DescuentoVolumenRepository descuentoVolumenRepo;

    @Mock
    private PreferenciaUsuarioRepository preferenciaRepo;

    @Mock
    private LogsSistemaService logsSistemaService;

    @InjectMocks
    private RFQService rfqService;

    @Test
    void shouldKeepProviderWhenItMatchesOnlyOneRequestedItem() {
        RFQRequest request = new RFQRequest();
        request.setItems(List.of(
                item(1, 2),
                item(2, 1)
        ));
        FiltroRFQRequest filtro = new FiltroRFQRequest();
        request.setFiltro(filtro);
        request.setPrioridad(PrioridadRFQ.BALANCEADO);

        when(provProdRepo.findProveedoresConTodosLosProductos(anyList(), eq(2)))
                .thenReturn(List.of());
        when(provProdRepo.findProveedoresConAlgunProducto(anyList()))
                .thenReturn(List.of(10));

        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(10);
        proveedor.setRazonSocial("Proveedor Demo");

        Producto producto = new Producto();
        producto.setIdProducto(1);
        producto.setNombre("Producto A");

        ProveedorProducto pp = new ProveedorProducto();
        pp.setIdProvProd(100);
        pp.setProveedor(proveedor);
        pp.setProducto(producto);
        pp.setPrecio(new BigDecimal("100.00"));
        pp.setStock(10);
        pp.setTiempoEntregaDias(3);
        pp.setPorcentajeDescuento(0.0);

        when(provProdRepo.findDetallesParaScoring(List.of(10), List.of(1, 2)))
                .thenReturn(List.of(pp));
        when(inventarioReSer.calcularStockDisponible(pp)).thenReturn(10);
        when(descuentoVolumenRepo.findByProveedorProducto_IdProvProd(100))
                .thenReturn(List.of());

        List<RFQProveedorResponse> resultados = rfqService.buscarYCalificarProveedores(request, 99, null);

        assertFalse(resultados.isEmpty(), "Se esperaba al menos un proveedor parcial");
        assertEquals(10, resultados.get(0).getIdProveedor());
        assertEquals(1, resultados.get(0).getItems().size());
        assertEquals(1, resultados.get(0).getItems().get(0).getIdProducto());
        verify(scoringService).calcularScore(anyList(), eq(PrioridadRFQ.BALANCEADO));
    }

    @Test
    void shouldReturnProviderWithPartialCoverageWhenOneItemIsMissing() {
        RFQRequest request = new RFQRequest();
        request.setItems(List.of(
                item(1, 2),
                item(2, 1)
        ));
        FiltroRFQRequest filtro = new FiltroRFQRequest();
        request.setFiltro(filtro);
        request.setPrioridad(PrioridadRFQ.BALANCEADO);

        when(provProdRepo.findProveedoresConTodosLosProductos(anyList(), eq(2)))
                .thenReturn(List.of());
        when(provProdRepo.findProveedoresConAlgunProducto(anyList()))
                .thenReturn(List.of(10));

        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(10);
        proveedor.setRazonSocial("Proveedor Demo");

        Producto producto = new Producto();
        producto.setIdProducto(1);
        producto.setNombre("Producto A");

        ProveedorProducto pp = new ProveedorProducto();
        pp.setIdProvProd(100);
        pp.setProveedor(proveedor);
        pp.setProducto(producto);
        pp.setPrecio(new BigDecimal("100.00"));
        pp.setStock(2);
        pp.setTiempoEntregaDias(3);
        pp.setPorcentajeDescuento(0.0);

        when(provProdRepo.findDetallesParaScoring(List.of(10), List.of(1, 2)))
                .thenReturn(List.of(pp));
        when(inventarioReSer.calcularStockDisponible(pp)).thenReturn(2);
        when(descuentoVolumenRepo.findByProveedorProducto_IdProvProd(100))
                .thenReturn(List.of());

        List<RFQProveedorResponse> resultados = rfqService.buscarYCalificarProveedores(request, 99, null);

        assertFalse(resultados.isEmpty(), "Se esperaba que el proveedor parcial apareciera en los resultados");
        assertEquals(1, resultados.size());
        assertEquals(10, resultados.get(0).getIdProveedor());
        assertEquals(1, resultados.get(0).getItems().size());
    }

    @Test
    void shouldExcludeProviderWhenMatchingProductHasNoAvailableStock() {
        RFQRequest request = new RFQRequest();
        request.setItems(List.of(item(1, 1)));
        FiltroRFQRequest filtro = new FiltroRFQRequest();
        request.setFiltro(filtro);
        request.setPrioridad(PrioridadRFQ.BALANCEADO);

        when(provProdRepo.findProveedoresConTodosLosProductos(anyList(), eq(1)))
                .thenReturn(List.of());
        when(provProdRepo.findProveedoresConAlgunProducto(anyList()))
                .thenReturn(List.of(10));

        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(10);
        proveedor.setRazonSocial("Proveedor Demo");

        Producto producto = new Producto();
        producto.setIdProducto(1);
        producto.setNombre("Producto A");

        ProveedorProducto pp = new ProveedorProducto();
        pp.setIdProvProd(100);
        pp.setProveedor(proveedor);
        pp.setProducto(producto);
        pp.setPrecio(new BigDecimal("100.00"));
        pp.setStock(0);
        pp.setTiempoEntregaDias(3);
        pp.setPorcentajeDescuento(0.0);

        when(provProdRepo.findDetallesParaScoring(List.of(10), List.of(1)))
                .thenReturn(List.of(pp));
        when(inventarioReSer.calcularStockDisponible(pp)).thenReturn(0);

        List<RFQProveedorResponse> resultados = rfqService.buscarYCalificarProveedores(request, 99, null);

        assertTrue(resultados.isEmpty(), "Se esperaba excluir al proveedor sin stock disponible");
    }

    private ItemRFQRequest item(Integer idProducto, Integer cantidad) {
        ItemRFQRequest item = new ItemRFQRequest();
        item.setIdProducto(idProducto);
        item.setCantidad(cantidad);
        return item;
    }
}
