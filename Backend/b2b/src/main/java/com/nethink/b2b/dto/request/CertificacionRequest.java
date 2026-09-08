package com.nethink.b2b.dto.request;

import java.time.LocalDate;

public class CertificacionRequest {

    private Long idCertificacion;
    private LocalDate fechaObtencion;
    private LocalDate fechaExpiracion;

    public Long getIdCertificacion() {
        return idCertificacion;
    }

    public void setIdCertificacion(Long idCertificacion) {
        this.idCertificacion = idCertificacion;
    }

    public LocalDate getFechaObtencion() {
        return fechaObtencion;
    }

    public void setFechaObtencion(LocalDate fechaObtencion) {
        this.fechaObtencion = fechaObtencion;
    }

    public LocalDate getFechaExpiracion() {
        return fechaExpiracion;
    }

    public void setFechaExpiracion(LocalDate fechaExpiracion) {
        this.fechaExpiracion = fechaExpiracion;
    }
}