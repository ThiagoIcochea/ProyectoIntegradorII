package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import com.nethink.b2b.entity.enums.PrioridadRFQ;
import com.nethink.b2b.repository.ComentarioRepository;
import com.nethink.b2b.repository.EvaluacionRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.ReclamoRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScoringService {

    private final EvaluacionRepository evaluacionRepo;
    private final ReclamoRepository reclamoRepo;
    private final ComentarioRepository comentarioRepo;
    private final ProveedorProductoRepository proveedorProductoRepo;
    private final SolicitudRepository solicitudRepo;

    public ScoringService(
            EvaluacionRepository evaluacionRepo,
            ReclamoRepository reclamoRepo,
            ComentarioRepository comentarioRepo,
            ProveedorProductoRepository proveedorProductoRepo,
            SolicitudRepository solicitudRepo
    ) {

        this.evaluacionRepo = evaluacionRepo;
        this.reclamoRepo = reclamoRepo;
        this.comentarioRepo = comentarioRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.solicitudRepo = solicitudRepo;
    }

    /*
        ===================================================
        SCORE PARA RFQ DINAMICO
        ===================================================
    */

    public void calcularScore(
            List<RFQProveedorResponse> proveedores,
            PrioridadRFQ prioridad
    ) {

        if (proveedores == null || proveedores.isEmpty()) {
            return;
        }

        double wPrecio = 0.4;
        double wTiempo = 0.3;
        double wCalidad = 0.3;

        if (prioridad == null) {
            prioridad = PrioridadRFQ.BALANCEADO;
        }

        if (prioridad == PrioridadRFQ.PRECIO) {

            wPrecio = 0.6;
            wTiempo = 0.2;
            wCalidad = 0.2;
        }

        if (prioridad == PrioridadRFQ.TIEMPO) {

            wPrecio = 0.2;
            wTiempo = 0.6;
            wCalidad = 0.2;
        }

        if (prioridad == PrioridadRFQ.CALIDAD) {

            wPrecio = 0.2;
            wTiempo = 0.2;
            wCalidad = 0.6;
        }

        double mejorPrecio = proveedores.stream()
                .mapToDouble(
                        p -> p.getTotalCotizacion() != null
                                ? p.getTotalCotizacion()
                                : Double.MAX_VALUE
                )
                .min()
                .orElse(1);

        double mejorTiempo = proveedores.stream()
                .mapToInt(
                        p -> p.getTiempoEntregaPromedio() != null
                                ? p.getTiempoEntregaPromedio()
                                : Integer.MAX_VALUE
                )
                .min()
                .orElse(1);

        for (RFQProveedorResponse p : proveedores) {

            double precio =
                    p.getTotalCotizacion() != null
                            ? p.getTotalCotizacion()
                            : Double.MAX_VALUE;

            double tiempo =
                    p.getTiempoEntregaPromedio() != null
                            ? p.getTiempoEntregaPromedio()
                            : Integer.MAX_VALUE;

            double scorePrecio = mejorPrecio / precio;
            double scoreTiempo = mejorTiempo / tiempo;

            double calidad =
                    calcularScoreProveedorCompleto(
                            p.getIdProveedor()
                    );

            double scoreFinal =
                    (wPrecio * scorePrecio) +
                    (wTiempo * scoreTiempo) +
                    (wCalidad * calidad);

            if (p.getItems() != null && !p.getItems().isEmpty()) {
                scoreFinal = Math.max(0.20, scoreFinal);
            } else {
                scoreFinal = Math.max(0.10, scoreFinal);
            }

            if (scoreFinal < 0) {
                scoreFinal = 0;
            }

            if (scoreFinal > 1) {
                scoreFinal = 1;
            }

            p.setScoreFinal(scoreFinal);
        }
    }

    /*
        ===================================================
        CALIDAD BASE
        ===================================================
    */

    private double calcularCalidad(Integer idProveedor) {

        if (idProveedor == null) {
            return 3.5;
        }

        Double evaluacion =
                evaluacionRepo.promedioCalidad(idProveedor);

        Integer positivos =
                comentarioRepo.contarComentariosPositivos(idProveedor);

        Integer negativos =
                comentarioRepo.contarComentariosNegativos(idProveedor);

        Integer reclamos =
                reclamoRepo.contarReclamosPenalizables(idProveedor);

        int pos = positivos != null ? positivos : 0;
        int neg = negativos != null ? negativos : 0;
        int rec = reclamos != null ? reclamos : 0;

        double base =
                evaluacion != null
                        ? evaluacion
                        : 3.5;

        double impactoComentarios =
                (pos * 0.08) -
                (neg * 0.12);

        double impactoReclamos =
                rec * 0.15;

        double calidadFinal =
                base +
                impactoComentarios -
                impactoReclamos;

        if (calidadFinal < 1) {
            calidadFinal = 1;
        }

        if (calidadFinal > 5) {
            calidadFinal = 5;
        }

        return calidadFinal;
    }

    /*
        ===================================================
        SCORE COMPLETO DEL PROVEEDOR
        ===================================================
    */

    public double calcularScoreProveedorCompleto(Integer idProveedor) {

        if (idProveedor == null) {
            return 0;
        }

        Double promedioPrecio =
                proveedorProductoRepo
                        .promedioPrecioProveedor(idProveedor);

        Double promedioTiempo =
                proveedorProductoRepo
                        .promedioTiempoEntregaProveedor(idProveedor);

        double calidad =
                calcularCalidad(idProveedor);

        Integer positivos =
                comentarioRepo
                        .contarComentariosPositivos(idProveedor);

        Integer negativos =
                comentarioRepo
                        .contarComentariosNegativos(idProveedor);

        Integer reclamos =
                reclamoRepo
                        .contarReclamosPenalizables(idProveedor);

        int pos = positivos != null ? positivos : 0;
        int neg = negativos != null ? negativos : 0;
        int rec = reclamos != null ? reclamos : 0;

        /*
            ==========================================
            SCORE PRECIO
            ==========================================
        */

        double scorePrecio;

        if (promedioPrecio == null || promedioPrecio <= 0) {

            scorePrecio = 0.30;

        } else if (promedioPrecio <= 100) {

            scorePrecio = 1.0;

        } else if (promedioPrecio <= 300) {

            scorePrecio = 0.9;

        } else if (promedioPrecio <= 700) {

            scorePrecio = 0.8;

        } else if (promedioPrecio <= 1500) {

            scorePrecio = 0.7;

        } else if (promedioPrecio <= 3000) {

            scorePrecio = 0.6;

        } else {

            scorePrecio = 0.4;
        }

        /*
            ==========================================
            SCORE TIEMPO
            ==========================================
        */

        double scoreTiempo;

        if (promedioTiempo == null || promedioTiempo <= 0) {

            scoreTiempo = 0.30;

        } else if (promedioTiempo <= 1) {

            scoreTiempo = 1.0;

        } else if (promedioTiempo <= 3) {

            scoreTiempo = 0.9;

        } else if (promedioTiempo <= 5) {

            scoreTiempo = 0.8;

        } else if (promedioTiempo <= 7) {

            scoreTiempo = 0.7;

        } else if (promedioTiempo <= 15) {

            scoreTiempo = 0.5;

        } else {

            scoreTiempo = 0.3;
        }

        /*
            ==========================================
            SCORE CALIDAD
            ==========================================
        */

        double scoreCalidad = calidad / 5.0;

        /*
            ==========================================
            CUMPLIMIENTO
            ==========================================
        */

        Integer completadas =
                solicitudRepo
                        .countByProveedor_IdProveedorAndEstado(
                                idProveedor,
                                EstadoSolicitud.COMPLETADA
                        );

        Integer totalSolicitudes =
                solicitudRepo
                        .countByProveedor_IdProveedor(
                                idProveedor
                        );

        int total =
                totalSolicitudes != null
                        ? totalSolicitudes
                        : 0;

        int totalCompletadas =
                completadas != null
                        ? completadas
                        : 0;

        double cumplimiento;

        if (total == 0) {

            cumplimiento = 0.40;

        } else {

            cumplimiento =
                    (double) totalCompletadas / total;
        }

        /*
            ==========================================
            EXPERIENCIA
            ==========================================
        */

        double scoreExperiencia;

        if (total >= 100) {

            scoreExperiencia = 1.0;

        } else if (total >= 50) {

            scoreExperiencia = 0.9;

        } else if (total >= 20) {

            scoreExperiencia = 0.7;

        } else if (total >= 5) {

            scoreExperiencia = 0.5;

        } else {

            scoreExperiencia = 0.3;
        }

        /*
            ==========================================
            PESOS
            ==========================================
        */

        double wCalidad = 0.35;
        double wPrecio = 0.20;
        double wTiempo = 0.15;
        double wCumplimiento = 0.20;
        double wExperiencia = 0.10;

        double scoreFinal =
                (scoreCalidad * wCalidad) +
                (scorePrecio * wPrecio) +
                (scoreTiempo * wTiempo) +
                (cumplimiento * wCumplimiento) +
                (scoreExperiencia * wExperiencia);

        /*
            ==========================================
            PENALIZACIONES
            ==========================================
        */

        scoreFinal -= Math.min(0.45, rec * 0.08);

        if (neg > pos && neg >= 5) {
            scoreFinal -= 0.10;
        }

        /*
            ==========================================
            SIN ACTIVIDAD
            ==========================================
        */

        boolean sinProductos =
                promedioPrecio == null &&
                promedioTiempo == null;

        boolean sinHistorial =
                total == 0 &&
                pos == 0 &&
                neg == 0;

        if (sinProductos && sinHistorial) {

            scoreFinal *= 0.5;
        }

        /*
            ==========================================
            LIMITES
            ==========================================
        */

        if (scoreFinal < 0) {
            scoreFinal = 0;
        }

        if (scoreFinal > 1) {
            scoreFinal = 1;
        }

        return scoreFinal;
    }

    /*
        ===================================================
        COMPATIBILIDAD CON CLASES ANTIGUAS
        ===================================================
    */

    public double calcularScoreProveedorBasico(Integer idProveedor) {

        return calcularScoreProveedorCompleto(idProveedor);
    }
}
