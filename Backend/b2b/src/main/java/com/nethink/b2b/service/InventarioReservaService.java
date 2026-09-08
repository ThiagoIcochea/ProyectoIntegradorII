package com.nethink.b2b.service;

import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.InventarioReservaRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class InventarioReservaService {

    private final InventarioReservaRepository reservaRepo;
    private final ProveedorProductoRepository proveedorProductoRepo;
    private final RestTemplate restTemplate;

    public InventarioReservaService(
            InventarioReservaRepository reservaRepo,
            ProveedorProductoRepository proveedorProductoRepo,
            RestTemplate restTemplate
    ) {
        this.reservaRepo = reservaRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.restTemplate = restTemplate;
    }

    public InventarioReserva crearReserva(
            Solicitud solicitud,
            ProveedorProducto pp,
            Integer cantidad
    ) {
        InventarioReserva r = new InventarioReserva();

        r.setSolicitud(solicitud);
        r.setProveedorProducto(pp);
        r.setCantidad(cantidad);
        r.setEstado("RESERVADO");
        r.setFechaCreacion(LocalDateTime.now());

        return reservaRepo.save(r);
    }

    @Transactional
    public void confirmarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);
        List<ProveedorProducto> productosActualizados = new ArrayList<>();

        for (InventarioReserva r : reservas) {
            if (!esReservaActiva(r)) {
                continue;
            }
            r.setEstado("CONFIRMADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);

            if (r.getProveedorProducto() != null) {
                productosActualizados.add(r.getProveedorProducto());
            }
        }

        // La reserva confirmada ya reduce el stock disponible para el proveedor.
        sincronizarInventarioProveedor(productosActualizados);
    }

    @Transactional
    public void liberarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);
        List<ProveedorProducto> productosActualizados = new ArrayList<>();

        for (InventarioReserva r : reservas) {
            if (!esReservaActiva(r)) {
                continue;
            }
            r.setEstado("LIBERADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);

            ProveedorProducto pp = r.getProveedorProducto();
            if (pp != null) {
                pp.setUltimaActualizacionStock(LocalDateTime.now());
                proveedorProductoRepo.save(pp);
                productosActualizados.add(pp);
            }
        }

        sincronizarInventarioProveedor(productosActualizados);
    }

    @Transactional
    public void entregarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);
        List<ProveedorProducto> productosActualizados = new ArrayList<>();

        for (InventarioReserva r : reservas) {
            if (!esReservaActiva(r)) {
                continue;
            }

            ProveedorProducto pp = r.getProveedorProducto();
            int stockActual = pp.getStock() != null ? pp.getStock() : 0;
            int cantidad = r.getCantidad() != null ? r.getCantidad() : 0;

            pp.setStock(Math.max(0, stockActual - cantidad));
            pp.setUltimaActualizacionStock(LocalDateTime.now());
            proveedorProductoRepo.save(pp);
            productosActualizados.add(pp);

            r.setEstado("ENTREGADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }

        sincronizarInventarioProveedor(productosActualizados);
    }

    @Transactional
    public void devolverStock(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);
        List<ProveedorProducto> productosActualizados = new ArrayList<>();

        for (InventarioReserva r : reservas) {
            if (r == null || r.getProveedorProducto() == null) {
                continue;
            }

            ProveedorProducto pp = r.getProveedorProducto();
            int stockActual = pp.getStock() != null ? pp.getStock() : 0;
            int cantidad = r.getCantidad() != null ? r.getCantidad() : 0;

            pp.setStock(stockActual + cantidad);
            pp.setUltimaActualizacionStock(LocalDateTime.now());
            proveedorProductoRepo.save(pp);
            productosActualizados.add(pp);

            if ("CANCELADO".equals(r.getEstado()) || "LIBERADO".equals(r.getEstado())) {
                continue;
            }

            r.setEstado("LIBERADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }

        sincronizarInventarioProveedor(productosActualizados);
    }

    @Transactional
    public void cancelarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);
        List<ProveedorProducto> productosActualizados = new ArrayList<>();

        for (InventarioReserva r : reservas) {
            if (r == null || r.getProveedorProducto() == null) {
                continue;
            }
            if ("CANCELADO".equals(r.getEstado()) || "LIBERADO".equals(r.getEstado())) {
                continue;
            }

            ProveedorProducto pp = r.getProveedorProducto();
            int stockActual = pp.getStock() != null ? pp.getStock() : 0;
            int cantidad = r.getCantidad() != null ? r.getCantidad() : 0;

            pp.setStock(stockActual + cantidad);
            pp.setUltimaActualizacionStock(LocalDateTime.now());
            proveedorProductoRepo.save(pp);
            productosActualizados.add(pp);

            r.setEstado("CANCELADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }

        sincronizarInventarioProveedor(productosActualizados);
    }
    
    public Integer calcularStockDisponible(ProveedorProducto pp) {
        if (pp == null) {
            return 0;
        }

        int stockBase = pp.getStock() != null ? pp.getStock() : 0;
        int reservado = reservaRepo.sumarReservasActivas(pp.getIdProvProd());
        return Math.max(0, stockBase - reservado);
    }

private boolean esReservaActiva(InventarioReserva reserva) {
    if (reserva == null || reserva.getEstado() == null) {
        return false;
    }

    return "RESERVADO".equals(reserva.getEstado())
            || "CONFIRMADO".equals(reserva.getEstado());
}

private boolean esReservaBloqueante(InventarioReserva reserva) {
    if (reserva == null || reserva.getEstado() == null) {
        return false;
    }

    return "RESERVADO".equals(reserva.getEstado())
            || "CONFIRMADO".equals(reserva.getEstado())
            || "PENDIENTE".equals(reserva.getEstado());
}

private void sincronizarInventarioProveedor(List<ProveedorProducto> productosActualizados) {
    if (productosActualizados == null || productosActualizados.isEmpty()) {
        return;
    }

    Map<Integer, Proveedor> proveedores = productosActualizados.stream()
            .filter(Objects::nonNull)
            .map(ProveedorProducto::getProveedor)
            .filter(Objects::nonNull)
            .collect(java.util.stream.Collectors.toMap(
                    Proveedor::getIdProveedor,
                    proveedor -> proveedor,
                    (existing, replacement) -> existing,
                    java.util.LinkedHashMap::new
            ));

    for (Proveedor proveedor : proveedores.values()) {
        if (proveedor.getApiUrl() == null || proveedor.getApiUrl().isBlank()) {
            continue;
        }

        // Se manda todo el catálogo del proveedor: un API que reemplaza la colección
        // no pierde productos que no participaron en este consumo de stock.
        List<ProveedorProducto> catalogoCompleto = proveedorProductoRepo
                .findProductosCompletosPorProveedor(proveedor.getIdProveedor());

        enviarCatalogoConFallback(proveedor, catalogoCompleto);
    }
}

/** Publica o actualiza el catálogo del proveedor respetando sus variantes REST.
 * PATCH es la opción preferida para conservar registros no afectados; PUT y POST
 * quedan como alternativas de compatibilidad. */
public void publicarNuevoProducto(ProveedorProducto producto) {
    if (producto == null || producto.getProveedor() == null) {
        return;
    }

    Proveedor proveedor = producto.getProveedor();
    if (proveedor.getApiUrl() == null || proveedor.getApiUrl().isBlank()) {
        return;
    }

    // Incluye los productos existentes y el nuevo en un único contrato homogéneo.
    // Así un proveedor que interpreta PUT como reemplazo no elimina su catálogo previo.
    List<ProveedorProducto> catalogo = proveedorProductoRepo
            .findProductosCompletosPorProveedor(proveedor.getIdProveedor());
    enviarCatalogoConFallback(proveedor, catalogo);
}

private void enviarCatalogoConFallback(Proveedor proveedor, List<ProveedorProducto> catalogo) {
    HttpMethod[] metodos = { HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.POST };
    RuntimeException ultimoError = null;
    List<String> intentos = new ArrayList<>();

    for (HttpMethod metodo : metodos) {
        try {
            enviarInventario(proveedor, metodo, catalogo);
            return;
        } catch (HttpStatusCodeException error) {
            ultimoError = error;
            int status = error.getStatusCode().value();
            intentos.add(metodo.name() + " HTTP " + status);
            // Cambiar el metodo puede resolver incompatibilidades incluso si el
            // proveedor las reporta como 500. No insistir ante permisos o limites.
            if (status == 401 || status == 403 || status == 429) {
                throw new IllegalStateException(
                        "No se pudo sincronizar el inventario: " + String.join(", ", intentos)
                                + ". Revisa los permisos de la API o su limite de solicitudes.", error);
            }
        }
    }

    throw new IllegalStateException(
            "No se pudo sincronizar el inventario. Intentos: " + String.join(", ", intentos)
                    + ". La API del proveedor rechazo todas las opciones de actualizacion.", ultimoError);
}

private void enviarInventario(
        Proveedor proveedor,
        HttpMethod metodo,
        List<ProveedorProducto> productos
) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    if (proveedor.getApiToken() != null && !proveedor.getApiToken().isBlank()) {
        headers.setBearerAuth(proveedor.getApiToken());
    }

    List<Map<String, Object>> productosPayload = productos == null ? List.of() : productos.stream()
            .filter(Objects::nonNull)
            .map(this::mapProductoInventario)
            .toList();

    Map<String, Object> body = new HashMap<>();
    body.put("catalogo", productosPayload);

    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
    ResponseEntity<String> response = restTemplate.exchange(
            proveedor.getApiUrl(),
            metodo,
            entity,
            String.class
    );

    if (!response.getStatusCode().is2xxSuccessful()) {
        throw new RuntimeException("API proveedor respondio " + response.getStatusCode().value());
    }
}

private Map<String, Object> mapProductoInventario(ProveedorProducto pp) {
    Producto producto = pp.getProducto();

    Map<String, Object> item = new HashMap<>();
    item.put("idProvProd", pp.getIdProvProd());
    item.put("idProducto", producto != null ? producto.getIdProducto() : null);
    item.put("sku", producto != null ? producto.getSkuGlobal() : null);
    item.put("producto", producto != null ? producto.getNombre() : null);
    item.put("marca", producto != null && producto.getMarca() != null ? producto.getMarca().getNombre() : null);
    item.put("categoria", producto != null && producto.getCategoria() != null ? producto.getCategoria().getNombre() : null);
    item.put("descripcion", producto != null ? producto.getDescripcion() : null);
    item.put("precioUnitario", pp.getPrecio());
    // Se publica el stock realmente disponible: stock físico menos reservas activas.
    item.put("stock", calcularStockDisponible(pp));
    item.put("garantiaMeses", pp.getGarantiaMeses());
    item.put("tiempoEntregaDias", pp.getTiempoEntregaDias());
    item.put("enOferta", pp.getEnOferta());
    item.put("porcentajeDescuento", pp.getPorcentajeDescuento());
    item.put("estado", pp.getEstado());
    item.put("imagenes", List.of());
    item.put("especificaciones", List.of());
    item.put("descuentosVolumen", List.of());
    item.put("ultimaActualizacionStock", pp.getUltimaActualizacionStock() != null ? pp.getUltimaActualizacionStock().toString() : null);
    return item;
}
}
