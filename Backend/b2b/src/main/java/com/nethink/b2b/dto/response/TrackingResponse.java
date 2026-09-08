package com.nethink.b2b.dto.response;

import com.nethink.b2b.entity.EmpresaCompradora;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class TrackingResponse {

    private Integer idSolicitud;
    private String proveedor;
    private String estado;
    private BigDecimal total;
    private String direccion;
    private String codigoRecepcion;
    private LocalDateTime fechaEntrega;
    private LocalDateTime fechaLimiteEntrega;

    private List<TrackingStepResponse> timeline;
    
    private Integer idProveedor;
    
    private EmpresaCompradora empresaCompradora;

    public EmpresaCompradora getEmpresaCompradora() {
        return empresaCompradora;
    }

    public void setEmpresaCompradora(EmpresaCompradora empresaCompradora) {
        this.empresaCompradora = empresaCompradora;
    }
    
 

public Integer getIdProveedor() {
    return idProveedor;
}

public void setIdProveedor(Integer idProveedor) {
    this.idProveedor = idProveedor;
}

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public String getProveedor() {
        return proveedor;
    }

    public void setProveedor(String proveedor) {
        this.proveedor = proveedor;
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

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getCodigoRecepcion() {
        return codigoRecepcion;
    }

    public void setCodigoRecepcion(String codigoRecepcion) {
        this.codigoRecepcion = codigoRecepcion;
    }

    public LocalDateTime getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(LocalDateTime fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public List<TrackingStepResponse> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<TrackingStepResponse> timeline) {
        this.timeline = timeline;
    }

    public LocalDateTime getFechaLimiteEntrega() {
        return fechaLimiteEntrega;
    }

    public void setFechaLimiteEntrega(LocalDateTime fechaLimiteEntrega) {
        this.fechaLimiteEntrega = fechaLimiteEntrega;
    }
    
}