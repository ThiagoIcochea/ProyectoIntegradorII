package com.nethink.b2b.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List  ; 

public class SolicitudResponse {

    private Integer idSolicitud;

    private Integer idProveedor;

    private String nombreProveedor;

    private Integer idEmpresa;

    private String nombreEmpresa;

    private String rucEmpresa;

    private BigDecimal total;

    private String estado;
    
    
    
    //se agregó tres atributos para mostrarle al proveedor estos datos
    private String nombreCliente;
    private String correoCliente;
    private List<DetalleSolicitudResponse> detalles;
    
    private String telefonoCliente;
    
    private String direccionEnvio;
    
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaEntrega;
    private LocalDateTime fechaLimiteEntrega;

    public String getDireccionEnvio() {
        return direccionEnvio;
    }

    public void setDireccionEnvio(String direccionEnvio) {
        this.direccionEnvio = direccionEnvio;
    }
    
    

    

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public Integer getIdProveedor() {
        return idProveedor;
    }

    public void setIdProveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }

    public String getNombreProveedor() {
        return nombreProveedor;
    }

    public void setNombreProveedor(String nombreProveedor) {
        this.nombreProveedor = nombreProveedor;
    }

    public Integer getIdEmpresa() {
        return idEmpresa;
    }

    public void setIdEmpresa(Integer idEmpresa) {
        this.idEmpresa = idEmpresa;
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

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaEntrega() { return fechaEntrega; }
    public void setFechaEntrega(LocalDateTime fechaEntrega) { this.fechaEntrega = fechaEntrega; }
    public LocalDateTime getFechaLimiteEntrega() { return fechaLimiteEntrega; }
    public void setFechaLimiteEntrega(LocalDateTime fechaLimiteEntrega) { this.fechaLimiteEntrega = fechaLimiteEntrega; }
    
    // se añadio get y set de atributos nombrecliente, correodecliente y detalles de solicitud response  val
    public String getNombreCliente(){
      return nombreCliente; 
    
    }
    
    
    public void setNombreCliente(String nombreCliente){
    
       this.nombreCliente=nombreCliente; 
    
    
    }
    
    
    public String getCorreoCliente(){
    
    return correoCliente; 
    
    } 
    
    
    public void setCorreoCliente(String correoCliente){
    
    this.correoCliente=correoCliente; 
    
    
    
    }
    
    
    public List <DetalleSolicitudResponse>  getDetalles(){
    
      return detalles; 
    
    
    }
    
    
    public void setDetalles(List<DetalleSolicitudResponse> detalles){
      this.detalles=detalles; 
    }
    
    
    
   public String getTelefonoCliente() {
    return telefonoCliente;
}

public void setTelefonoCliente(String telefonoCliente) {
    this.telefonoCliente = telefonoCliente;
} 
    
    
    
    
    
    
}
