package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "proveedores")
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor")
    private Integer idProveedor;

    @Column(name = "razon_social")
    private String razonSocial;

    @Column(name = "ruc")
    private String ruc;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "api_url")
    private String apiUrl;

    @Column(name = "api_tipo")
    private String apiTipo;

    @Column(name = "api_token")
    private String apiToken;
    
    @Column(name = "estado_api")
private String estadoApi;

    @Column(name = "estado")
    private String estado;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;


@OneToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "id_usuario")
private Usuario usuario;

    public Proveedor() {
    }

    public Integer getIdProveedor() {
        return idProveedor;
    }

    public void setIdProveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getApiTipo() {
        return apiTipo;
    }

    public void setApiTipo(String apiTipo) {
        this.apiTipo = apiTipo;
    }

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }
    
    public String getEstadoApi(){
        return estadoApi;
    }
    public void setEstadoApi(String estadoApi){
        this.estadoApi = estadoApi;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

 
    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}