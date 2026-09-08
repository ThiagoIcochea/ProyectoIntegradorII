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
public class SolicitudEntregaResponse {

    
   

    private Integer idSolicitud;

    private String estado;

    private BigDecimal total;

    private LocalDateTime fechaCreacion;
    
    

    // =========================
    // EMPRESA
    // =========================

    private String nombreEmpresa;

    // =========================
    // CLIENTE
    // =========================

    private String nombreCliente;

    // =========================
    // PRODUCTOS
    // =========================

    private Integer cantidadProductos;
    
    private String telefono;
    
    private String whatsapp; 
    
    private String direccionEnvio;  

    // =========================
    // CONSTRUCTOR QUERY JPQL
    // =========================

    public SolicitudEntregaResponse(
            Integer idSolicitud,
            Enum estado,
            BigDecimal total,
            LocalDateTime fechaCreacion,
            
            String nombreEmpresa,
            String nombres,
            String apellidos,
            String telefono,
            String whatsapp,
            
            Long cantidadProductos,
            String direccionEnvio
    ) {

        this.idSolicitud = idSolicitud;

        this.estado = estado.toString();

        this.total = total;

        this.fechaCreacion = fechaCreacion;
        

        this.nombreEmpresa = nombreEmpresa;

        this.nombreCliente =
                nombres + " " + apellidos;
        
        this.telefono= telefono;
        
        this.whatsapp= whatsapp;
        

        this.cantidadProductos =
                cantidadProductos.intValue();
        
         
        this.direccionEnvio = direccionEnvio;
        
    }

    // =========================
    // GETTERS Y SETTERS
    // =========================

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(
            LocalDateTime fechaCreacion
    ) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getNombreEmpresa() {
        return nombreEmpresa;
    }

    public void setNombreEmpresa(
            String nombreEmpresa
    ) {
        this.nombreEmpresa = nombreEmpresa;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(
            String nombreCliente
    ) {
        this.nombreCliente = nombreCliente;
    }

    
    public String getTelefono(){
        return telefono; 
    }
    
    
   public void setTelefono(String telefono){
       this.telefono=telefono; 
   } 
    
    
   public String getWhatsapp(){
       return whatsapp; 
   } 
    
    
   public void setWhatsapp(String whatsapp){
       this.whatsapp=whatsapp; 
   }
   
   
    
    public Integer getCantidadProductos() {
        return cantidadProductos;
    }

    public void setCantidadProductos(
            Integer cantidadProductos
    ) {
        this.cantidadProductos = cantidadProductos;
    }
    
    public String getDireccionEnvio(){
        return direccionEnvio; 
    }
    
    public void setDireccionEnvio(String direccionEnvio){
        this.direccionEnvio=direccionEnvio; 
    }
    
    
    
    
}
    
    
    
    
    
    
    
    

