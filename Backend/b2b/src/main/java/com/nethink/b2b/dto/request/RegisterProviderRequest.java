package com.nethink.b2b.dto.request;

import java.util.List;

public class RegisterProviderRequest {

    private String nombres;
    private String apellidos;
    private String correo;
    private String telefono;
    private String whatsapp;
    private String password;
    private String direccion;

    private String estadoUsuario;

    private String razonSocial;
    private String ruc;
    private String descripcion;

    private String apiUrl;
    private String apiTipo;
    private String apiToken;

    private String estadoProveedor;

    private List<CertificacionRequest> certificaciones;

    private List<MetodoPagoRequest> metodosPago;

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getEstadoUsuario() {
        return estadoUsuario;
    }

    public void setEstadoUsuario(String estadoUsuario) {
        this.estadoUsuario = estadoUsuario;
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

    public String getEstadoProveedor() {
        return estadoProveedor;
    }

    public void setEstadoProveedor(String estadoProveedor) {
        this.estadoProveedor = estadoProveedor;
    }

    public List<CertificacionRequest> getCertificaciones() {
        return certificaciones;
    }

    public void setCertificaciones(List<CertificacionRequest> certificaciones) {
        this.certificaciones = certificaciones;
    }

    public List<MetodoPagoRequest> getMetodosPago() {
        return metodosPago;
    }

    public void setMetodosPago(List<MetodoPagoRequest> metodosPago) {
        this.metodosPago = metodosPago;
    }
}