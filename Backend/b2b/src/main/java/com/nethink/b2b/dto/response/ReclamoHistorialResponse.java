package com.nethink.b2b.dto.response;

import java.time.LocalDateTime;

public class ReclamoHistorialResponse {

    private String estado;
    private String descripcion;
    private LocalDateTime fecha;

    public ReclamoHistorialResponse() {
    }

    public ReclamoHistorialResponse(String estado, String descripcion, LocalDateTime fecha) {
        this.estado = estado;
        this.descripcion = descripcion;
        this.fecha = fecha;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
