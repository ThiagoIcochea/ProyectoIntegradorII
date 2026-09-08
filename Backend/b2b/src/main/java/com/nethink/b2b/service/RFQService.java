package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.ItemRFQRequest;
import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.ItemCotizadoResponse;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.DescuentoVolumen;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.enums.PrioridadRFQ;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.PreferenciaUsuarioRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RFQService {

    private final ProveedorProductoRepository provProdRepo;
    private final ScoringService scoringService;
    private final InventarioReservaService inventarioReSer;
    private final DescuentoVolumenRepository descuentoVolumenRepo;
    private final PreferenciaUsuarioRepository preferenciaRepo;
    private final LogsSistemaService logsSistemaService;

    public RFQService(ProveedorProductoRepository provProdRepo, ScoringService scoringService, InventarioReservaService inventarioReSer, DescuentoVolumenRepository descuentoVolumenRepo, PreferenciaUsuarioRepository preferenciaRepo, LogsSistemaService logsSistemaService) {
        this.provProdRepo = provProdRepo;
        this.scoringService = scoringService;
        this.inventarioReSer=  inventarioReSer;
        this.descuentoVolumenRepo= descuentoVolumenRepo;
        this.preferenciaRepo = preferenciaRepo;
        this.logsSistemaService = logsSistemaService;
    }

    public List<RFQProveedorResponse> buscarYCalificarProveedores(RFQRequest request,Integer idUsuario, HttpServletRequest req) {
        logsSistemaService.registrarLog(
    idUsuario,
    "RFQ_BUSQUEDA",
    "RFQ",
    "Nueva búsqueda RFQ con "
        + request.getItems().size()
        + " productos",
    req
);
        List<Integer> idsProductos = request.getItems().stream()
                .map(ItemRFQRequest::getIdProducto)
                .toList();

        List<Integer> proveedoresIds = provProdRepo.findProveedoresConTodosLosProductos(
                idsProductos,
                idsProductos.size()
        );

        if (proveedoresIds.isEmpty() && idsProductos != null && !idsProductos.isEmpty()) {
            proveedoresIds = provProdRepo.findProveedoresConAlgunProducto(idsProductos);
        }

        if (proveedoresIds.isEmpty()) {
            logsSistemaService.registrarLog(
                    idUsuario,
                    "RFQ_SIN_RESULTADOS",
                    "RFQ",
                    "No se encontraron proveedores para RFQ",
                    req
            );
            return new ArrayList<>();
        }

        boolean entregaRapida = preferenciaRepo.findByUsuario_IdUsuario(idUsuario)
                .map(pref -> Boolean.TRUE.equals(pref.getEntregaRapida()))
                .orElse(false);

        PrioridadRFQ prioridadEscolhida = request.getPrioridad();
        if (prioridadEscolhida == null || prioridadEscolhida == PrioridadRFQ.BALANCEADO) {
            prioridadEscolhida = entregaRapida ? PrioridadRFQ.TIEMPO : PrioridadRFQ.BALANCEADO;
        }

        List<ProveedorProducto> detalles = provProdRepo.findDetallesParaScoring(proveedoresIds, idsProductos);
        Map<Integer, List<ProveedorProducto>> porProveedor = detalles.stream()
                .collect(Collectors.groupingBy(pp -> pp.getProveedor().getIdProveedor()));

        List<RFQProveedorResponse> candidatos = new ArrayList<>();

        for (Map.Entry<Integer, List<ProveedorProducto>> entry : porProveedor.entrySet()) {
            List<ProveedorProducto> stockProv = entry.getValue();
            double totalCotizacion = 0;
            int tiempoMaximo = 0;
            boolean tieneCoincidencia = false;
            
            List<ItemCotizadoResponse> itemsDetalle = new ArrayList<>();

            logsSistemaService.registrarLog(
                    idUsuario,
                    "RFQ_PROVEEDOR_CANDIDATO",
                    "RFQ",
                    "Revisando proveedor id=" + entry.getKey() + " con " + stockProv.size() + " registros",
                    req
            );

            boolean proveedorAceptable = true;
            for (ItemRFQRequest itemReq : request.getItems()) {
                ProveedorProducto pp = stockProv.stream()
                        .filter(p -> p.getProducto().getIdProducto().equals(itemReq.getIdProducto()))
                        .findFirst().orElse(null);

                if (pp == null) {
                    continue;
                }

                tieneCoincidencia = true;

                int stockDisponible = inventarioReSer.calcularStockDisponible(pp);
                boolean stockSuficiente = stockDisponible >= itemReq.getCantidad();
                if (!stockSuficiente) {
                    proveedorAceptable = false;
                    logsSistemaService.registrarLog(
                        idUsuario,
                        "RFQ_STOCK_INSUFICIENTE",
                        "RFQ",
                        "Proveedor "
                            + pp.getProveedor().getRazonSocial()
                            + " sin stock suficiente para producto "
                            + pp.getProducto().getNombre()
                            + " (requerido=" + itemReq.getCantidad() + ", disponible=" + stockDisponible + ")",
                        req
                    );
                    break;
                }

                double precioBase = pp.getPrecio().doubleValue();
double precioFinal = precioBase;

/* =========================
   1. DESCUENTO VOLUMEN (PRIORIDAD 1)
   ========================= */
List<DescuentoVolumen> volumenes =
        descuentoVolumenRepo.findByProveedorProducto_IdProvProd(pp.getIdProvProd());

DescuentoVolumen mejor = volumenes.stream()
        .filter(v -> itemReq.getCantidad() >= v.getCantidadMin())
        .max(Comparator.comparingInt(DescuentoVolumen::getCantidadMin))
        .orElse(null);

if (mejor != null) {

    logsSistemaService.registrarLog(
    idUsuario,
    "DESCUENTO_VOLUMEN",
    "RFQ",
    "Descuento volumen aplicado proveedor: "
        + pp.getProveedor().getRazonSocial()
        + " | Producto: "
        + pp.getProducto().getNombre(),
    req
);
    precioFinal = mejor.getPrecioUnitario().doubleValue();

} else {

    /* =========================
       2. DESCUENTO PRODUCTO
       ========================= */
    if (pp.getPorcentajeDescuento() != null && pp.getPorcentajeDescuento() > 0) {
        precioFinal -= precioBase * pp.getPorcentajeDescuento() / 100;
    }
}

/* =========================
   3. SUBTOTAL
   ========================= */
double subtotal = precioFinal * itemReq.getCantidad();
totalCotizacion += subtotal;
                    
                    if (pp.getTiempoEntregaDias() > tiempoMaximo) tiempoMaximo = pp.getTiempoEntregaDias();

                    ItemCotizadoResponse itemDetalle = new ItemCotizadoResponse();
                    itemDetalle.setIdProducto(pp.getProducto().getIdProducto());
itemDetalle.setProducto(pp.getProducto().getNombre());
itemDetalle.setNombreProducto(pp.getProducto().getNombre());
itemDetalle.setCantidad(itemReq.getCantidad());

// 🔵 precios base y final
itemDetalle.setPrecioBase(precioBase);
itemDetalle.setPrecioUnitario(precioFinal);
itemDetalle.setSubtotal(subtotal);



// 🔥 DETALLE DE DESCUENTO
if (mejor != null) {

    itemDetalle.setTipoDescuento("VOLUMEN");
    itemDetalle.setValorDescuento(
        mejor.getPrecioUnitario().doubleValue()
    );

} else if (pp.getPorcentajeDescuento() != null && pp.getPorcentajeDescuento() > 0) {

    itemDetalle.setTipoDescuento("PRODUCTO");
    itemDetalle.setValorDescuento(pp.getPorcentajeDescuento());

} else {

    itemDetalle.setTipoDescuento("NINGUNO");
    itemDetalle.setValorDescuento(0.0);
}
itemsDetalle.add(itemDetalle);
                }

            if (proveedorAceptable && tieneCoincidencia && !itemsDetalle.isEmpty()) {
                if (request.getFiltro() != null) {
                    if (request.getFiltro().getPrecioMin() != null && totalCotizacion < request.getFiltro().getPrecioMin()) continue;
                    if (request.getFiltro().getPrecioMax() != null && totalCotizacion > request.getFiltro().getPrecioMax()) continue;
                }

                logsSistemaService.registrarLog(
                        idUsuario,
                        "RFQ_PROVEEDOR_OK",
                        "RFQ",
                        "Proveedor id=" + entry.getKey() + " agregado con " + itemsDetalle.size() + " items",
                        req
                );

                RFQProveedorResponse resp = new RFQProveedorResponse();
                resp.setIdProveedor(entry.getKey());
                resp.setNombreProveedor(stockProv.get(0).getProveedor().getRazonSocial());
                resp.setRazonSocial(stockProv.get(0).getProveedor().getRazonSocial());
                resp.setTotalCotizacion(totalCotizacion);
                resp.setTiempoEntregaPromedio(tiempoMaximo);
                resp.setItems(itemsDetalle); 
                candidatos.add(resp);
            }
        }

        scoringService.calcularScore(candidatos, prioridadEscolhida);
        logsSistemaService.registrarLog(
    idUsuario,
    "RFQ_SCORING",
    "RFQ",
    "Scoring calculado para "
        + candidatos.size()
        + " proveedores con prioridad "
        + prioridadEscolhida,
    req
);
        
        
        logsSistemaService.registrarLog(
    idUsuario,
    "RFQ_FINALIZADO",
    "RFQ",
    "RFQ completado correctamente",
    req
);
        return candidatos.stream()
                .sorted(Comparator.comparingDouble(RFQProveedorResponse::getScoreFinal).reversed())
                .limit(20)
                .toList();
    }
}
