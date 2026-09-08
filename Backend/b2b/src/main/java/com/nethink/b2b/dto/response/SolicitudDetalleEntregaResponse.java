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


    
public class SolicitudDetalleEntregaResponse {

    // =========================
    // SOLICITUD
    // =========================

    private Integer idSolicitud;

    private String estado;

    private LocalDateTime fechaCreacion;

    // =========================
    // PRODUCTO
    // =========================

    private String nombreProducto;

    private Integer cantidad;
    
    private String skuGlobal;

    // =========================
    // CONSTRUCTOR
    // =========================

    public SolicitudDetalleEntregaResponse(

            Integer idSolicitud,

            String nombreProducto,

            Integer cantidad,
            
            String skuGlobal,

            String estado,

            LocalDateTime fechaCreacion

    ) {

        this.idSolicitud = idSolicitud;

        this.nombreProducto = nombreProducto;

        this.cantidad = cantidad;
        this.skuGlobal=skuGlobal;

        this.estado = estado;

        this.fechaCreacion = fechaCreacion;
    }

    // =========================
    // GETTERS Y SETTERS
    // =========================

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(
            Integer idSolicitud
    ) {
        this.idSolicitud = idSolicitud;
    }

    public String getNombreProducto() {
        return nombreProducto  ;
    }

    public void setNombreProducto(
            String nombreProducto
    ) {
        this.nombreProducto = nombreProducto  ;
    }

    public Integer getCantidad() {
        return cantidad  ;
    }

    public void setCantidad(
            Integer cantidad
    ) {
        this.cantidad = cantidad;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(
            String estado
    ) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(
            LocalDateTime fechaCreacion
    ) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getSkuGlobal() {
        return skuGlobal;
    }

    public void setSkuGlobal(String skuGlobal) {
        this.skuGlobal = skuGlobal;
    }
    
    

}









