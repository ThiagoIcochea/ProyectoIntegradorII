/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;
import java.time.LocalDateTime;

/**
 *
 * @author USUARIO
 */
public class TrackingStepEntregaResponse {

    
    
    
    
    
    
    
    private Integer idSolicitud; 
    private String estado;
    private String descripcion;
    private LocalDateTime fecha;
    
    
    public TrackingStepEntregaResponse(
            Integer idSolicitud,
            String estado,
            String descripcion,
            LocalDateTime fecha
    ) {
        this.idSolicitud = idSolicitud;
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
