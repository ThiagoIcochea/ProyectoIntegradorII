package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.SuscripcionRequest;
import com.nethink.b2b.dto.response.PayPalOrderResponse;
import com.nethink.b2b.dto.response.SuscripcionStatusResponse;
import com.nethink.b2b.service.SuscripcionService;
import com.nethink.b2b.repository.PlanRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/suscripciones")
@CrossOrigin(origins = "*")
public class SuscripcionController {

    @Autowired
    private SuscripcionService suscripcionService;

    @Autowired
    private PlanRepository planRepository;

    /** Public plan catalogue used by web and mobile checkout. Prices are never duplicated in clients. */
    @GetMapping("/planes")
    public ResponseEntity<List<Map<String, Object>>> listarPlanes() {
        List<Map<String, Object>> planes = planRepository.findAll().stream()
                .filter(plan -> Boolean.TRUE.equals(plan.getActivo()))
                .map(plan -> Map.<String, Object>of(
                        "idPlan", plan.getIdPlan(),
                        "nombre", plan.getNombre(),
                        "descripcion", plan.getDescripcion() == null ? "" : plan.getDescripcion(),
                        "precios", plan.getPrecios().stream()
                                .filter(precio -> Boolean.TRUE.equals(precio.getActivo()))
                                .map(precio -> Map.of(
                                        "idPrecio", precio.getIdPrecio(),
                                        "periodoMeses", precio.getPeriodoMeses(),
                                        "precio", precio.getPrecio(),
                                        "descuento", precio.getDescuento(),
                                        "moneda", precio.getMoneda()))
                                .toList()))
                .toList();
        return ResponseEntity.ok(planes);
    }

    // 1. Crear orden de pago (redirige a PayPal)
    @PostMapping("/crear-orden")
    public ResponseEntity<PayPalOrderResponse> crearOrden(
            @RequestBody SuscripcionRequest req) {

        PayPalOrderResponse response =
                suscripcionService.crearOrden(req);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/success")
    public void success(
            @RequestParam(required = false) String token,
            @RequestParam(required = false) Integer subscriptionId,
            HttpServletResponse response) throws IOException {
        if (subscriptionId != null) {
            suscripcionService.capturarPagoPorSuscripcion(subscriptionId, token);
        } else if (token != null && !token.isBlank()) {
            suscripcionService.capturarPago(token);
        }

        response.sendRedirect("https://proyectoinnovacion-1.onrender.com/app/provider/dashboard?payment=success");
    }

    @GetMapping("/cancel")
    public void cancel(
            @RequestParam(required = false) Integer subscriptionId,
            HttpServletResponse response) throws IOException {
        if (subscriptionId != null) {
            suscripcionService.cancelarSuscripcionPendiente(subscriptionId, null, "Cancelado por el usuario");
        }

        response.sendRedirect("https://proyectoinnovacion-1.onrender.com/app/provider/dashboard?payment=cancel");
    }

    // Endpoint manual opcional para pruebas/dev.
    @PostMapping("/capturar/{orderId}")
    public ResponseEntity<?> capturarPago(
            @PathVariable String orderId,
            @RequestParam(required = false) Integer meses) {

        suscripcionService.capturarPago(orderId, meses);

        return ResponseEntity.ok(
                Map.of(
                        "status", "ACTIVA",
                        "message", "Pago confirmado correctamente"
                )
        );
    }

    @GetMapping("/estado/{idUsuario}")
    public ResponseEntity<SuscripcionStatusResponse> obtenerEstado(
            @PathVariable Integer idUsuario) {
        return ResponseEntity.ok(suscripcionService.obtenerEstadoSuscripcion(idUsuario));
    }
}
