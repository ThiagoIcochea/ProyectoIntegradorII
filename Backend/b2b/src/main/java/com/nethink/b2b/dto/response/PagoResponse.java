/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;




/**
 *
 * @author USUARIO
 */
public class PagoResponse {

    
    
  

    private Integer idPago;

    private Integer idSolicitud;

    private String nombreClienteEmpresa;
    private String correoCliente;

    private String nombreEmpresa; // razon social
    private String rucEmpresa; 
    
    
    private LocalDateTime fechaSolicitud; 
    private BigDecimal totalSolicitud;

    //private BigDecimal monto;

    private String metodo;

    private String entidad;

    private String codigoOperacion;

    private String estado;

    private LocalDateTime fechaPago;
    
    private LocalDateTime fechaValidacion; 

    private String comprobanteUrl;

    // GETTERS Y SETTERS

    
    public Integer getIdPago() {
    return idPago;
}

public void setIdPago(Integer idPago) {
    this.idPago = idPago;
}

public Integer getIdSolicitud() {
    return idSolicitud;
}

public void setIdSolicitud(Integer idSolicitud) {
    this.idSolicitud = idSolicitud;
}


public String getNombreClienteEmpresa() {
        return nombreClienteEmpresa;
    }

public void setNombreClienteEmpresa(String nombreClienteEmpresa) {
        this.nombreClienteEmpresa = nombreClienteEmpresa;
    }





public String getNombreEmpresa() {
    return nombreEmpresa;
}

public void setNombreEmpresa(String nombreEmpresa) {
    this.nombreEmpresa = nombreEmpresa;
}


public String getRucEmpresa() {
        return rucEmpresa;
    }

    public void setRucEmpresa(String rucEmpresa) {
        this.rucEmpresa = rucEmpresa;
    }







public String getCorreoCliente() {
    return correoCliente;
}

public void setCorreoCliente(String correoCliente) {
    this.correoCliente = correoCliente;
}


public  LocalDateTime getFechaSolicitud(){
    return fechaSolicitud; 
} 


public void  setFechaSolicitud(LocalDateTime fechaSolicitud   ){
    
    this.fechaSolicitud=fechaSolicitud    ; 
} 




public BigDecimal getTotalSolicitud() {
    return totalSolicitud     ;
}

public void setTotalSolicitud(BigDecimal totalSolicitud) {
      this.totalSolicitud = totalSolicitud    ;
}




//public BigDecimal getMonto() {
 //   return monto;
//}

//public void setMonto(BigDecimal monto) {
//    this.monto = monto;
//}

public String getMetodo() {
    return metodo   ;
}

public void setMetodo(String metodo) {
    this.metodo = metodo  ;
}

public String getEntidad() {
    return entidad   ;
}

public void setEntidad(String entidad) {
    this.entidad = entidad;
}

public String getCodigoOperacion() {
    return codigoOperacion;
}

public void setCodigoOperacion(String codigoOperacion) {
    this.codigoOperacion = codigoOperacion;
}

public String getEstado() {
    return estado;
}

public void setEstado(String estado) {
    this.estado = estado;
}

public LocalDateTime getFechaPago() {
    return fechaPago;
}

public void setFechaPago(LocalDateTime fechaPago) {
    this.fechaPago = fechaPago;
}


public LocalDateTime getFechaValidacion(){
    return fechaValidacion; 
}


public void setFechaValidacion(LocalDateTime fechaValidacion){
    this.fechaValidacion=fechaValidacion; 
}    




public String getComprobanteUrl() {
    return comprobanteUrl;
}

public void setComprobanteUrl(String comprobanteUrl) {
    this.comprobanteUrl = comprobanteUrl;
}
    
    
    
    
    
    
    
    
    
    
}
