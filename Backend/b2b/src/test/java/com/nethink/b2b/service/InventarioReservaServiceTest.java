package com.nethink.b2b.service;

import com.nethink.b2b.entity.InventarioReserva;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.repository.InventarioReservaRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class InventarioReservaServiceTest {

    @Test
    void publicaCatalogoConPatchSinToken() throws Exception {
        service = new InventarioReservaService(reservaRepo, proveedorProductoRepo, new com.nethink.b2b.config.AppConfig().restTemplate());
        var server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1", 0), 0);
        var method = new java.util.concurrent.atomic.AtomicReference<String>();
        var authorization = new java.util.concurrent.atomic.AtomicReference<String>();
        server.createContext("/catalogo", exchange -> {
            method.set(exchange.getRequestMethod());
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            exchange.getRequestBody().readAllBytes();
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        server.start();
        try {
            var proveedor = new com.nethink.b2b.entity.Proveedor();
            proveedor.setIdProveedor(1);
            proveedor.setApiUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/catalogo");
            var producto = new ProveedorProducto();
            producto.setProveedor(proveedor);
            when(proveedorProductoRepo.findProductosCompletosPorProveedor(1)).thenReturn(List.of());
            service.publicarNuevoProducto(producto);
            assertEquals("PATCH", method.get());
            org.junit.jupiter.api.Assertions.assertNull(authorization.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void intentaPutYPostCuandoPatchDevuelve500() {
        probarAlternativas(new int[] {500, 405, 200}, null);
    }

    @Test
    void terminaCuandoPutFunciona() {
        probarAlternativas(new int[] {500, 200}, null);
    }

    @Test
    void resumeTodosLosFallosSinExponerHtml() {
        probarAlternativas(new int[] {500, 502, 503}, "PATCH HTTP 500, PUT HTTP 502, POST HTTP 503");
    }

    @Test
    void noInsisteAnteCredencialesInvalidas() {
        probarAlternativas(new int[] {401}, "PATCH HTTP 401");
    }

    @Test
    void noInsisteAnteLimiteDeSolicitudes() {
        probarAlternativas(new int[] {429}, "PATCH HTTP 429");
    }

    private void probarAlternativas(int[] statuses, String errorEsperado) {
        var rest = new RestTemplate();
        var server = org.springframework.test.web.client.MockRestServiceServer.bindTo(rest).build();
        service = new InventarioReservaService(reservaRepo, proveedorProductoRepo, rest);
        var proveedor = new com.nethink.b2b.entity.Proveedor();
        proveedor.setIdProveedor(1);
        proveedor.setApiUrl("https://proveedor.test/catalogo");
        var producto = new ProveedorProducto();
        producto.setProveedor(proveedor);
        when(proveedorProductoRepo.findProductosCompletosPorProveedor(1)).thenReturn(List.of());
        var metodos = new org.springframework.http.HttpMethod[] {
                org.springframework.http.HttpMethod.PATCH,
                org.springframework.http.HttpMethod.PUT,
                org.springframework.http.HttpMethod.POST
        };
        for (int i = 0; i < statuses.length; i++) {
            server.expect(org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo(proveedor.getApiUrl()))
                    .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.method(metodos[i]))
                    .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.content().json("{\"catalogo\":[]}"))
                    .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                            .withStatus(org.springframework.http.HttpStatus.valueOf(statuses[i]))
                            .body("<html>Error del proveedor</html>"));
        }
        if (errorEsperado == null) {
            org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> service.publicarNuevoProducto(producto));
        } else {
            var error = org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                    () -> service.publicarNuevoProducto(producto));
            org.junit.jupiter.api.Assertions.assertTrue(error.getMessage().contains(errorEsperado));
            org.junit.jupiter.api.Assertions.assertFalse(error.getMessage().contains("<html>"));
        }
        server.verify();
    }

    private InventarioReservaRepository reservaRepo;
    private ProveedorProductoRepository proveedorProductoRepo;
    private InventarioReservaService service;

    @BeforeEach
    void setUp() {
        reservaRepo = Mockito.mock(InventarioReservaRepository.class);
        proveedorProductoRepo = Mockito.mock(ProveedorProductoRepository.class);
        service = new InventarioReservaService(
                reservaRepo,
                proveedorProductoRepo,
                Mockito.mock(RestTemplate.class)
        );
    }

    @Test
    void cancelarReservaDevuelveStockYMarcaReservaComoCancelada() {
        ProveedorProducto pp = new ProveedorProducto();
        pp.setIdProvProd(11);
        pp.setStock(10);

        Solicitud solicitud = new Solicitud();
        solicitud.setIdSolicitud(77);

        InventarioReserva reserva = new InventarioReserva();
        reserva.setSolicitud(solicitud);
        reserva.setProveedorProducto(pp);
        reserva.setCantidad(4);
        reserva.setEstado("RESERVADO");

        when(reservaRepo.findBySolicitud_IdSolicitud(77)).thenReturn(List.of(reserva));
        when(proveedorProductoRepo.save(any(ProveedorProducto.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservaRepo.save(any(InventarioReserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancelarReserva(77);

        assertEquals(14, pp.getStock());
        assertEquals("CANCELADO", reserva.getEstado());
    }
}
