package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reclamos")
public class Reclamo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idReclamo;

    @Column(name = "id_solicitud")
    private Integer idSolicitud;

    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "id_proveedor")
    private Integer idProveedor;
    
    @Column(name = "evidencia_url")
private String evidenciaUrl;

    // La base de datos anterior tenia un tipo demasiado corto/enum y rechazaba
    // reclamos de cancelacion. Se almacenan codigos breves (DEM, CAN, ENT).
    @Column(name = "tipo", length = 16)
    private String tipo;

    private String descripcion;

    private String estado;

    private String resolucion;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaResolucion;
    
    

    public Integer getIdReclamo() {
        return idReclamo;
    }

    public void setIdReclamo(Integer idReclamo) {
        this.idReclamo = idReclamo;
    }

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdProveedor() {
        return idProveedor;
    }

    public void setIdProveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
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
    
    public String getEvidenciaUrl() {
    return evidenciaUrl;
}

public void setEvidenciaUrl(String evidenciaUrl) {
    this.evidenciaUrl = evidenciaUrl;
}

    public String getResolucion() {
        return resolucion;
    }

    public void setResolucion(String resolucion) {
        this.resolucion = resolucion;
    }

    public LocalDateTime getFechaResolucion() {
        return fechaResolucion;
    }

    public void setFechaResolucion(LocalDateTime fechaResolucion) {
        this.fechaResolucion = fechaResolucion;
    }
}

