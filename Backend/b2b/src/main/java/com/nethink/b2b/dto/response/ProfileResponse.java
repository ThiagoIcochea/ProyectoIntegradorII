package com.nethink.b2b.dto.response;

public class ProfileResponse {

    private Integer idUsuario;
    private String nombres;
    private String apellidos;
    private String correo;
    private String telefono;
    private String whatsapp;
    private String direccion;
    private String rol;
    private String fotoPerfil;
    private String razonSocial;
    private String ruc;
    private String descripcion;

    private Boolean notificacionesRfq;
    private Boolean entregaRapida;

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

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

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
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

    public Boolean getNotificacionesRfq() {
        return notificacionesRfq;
    }

    public void setNotificacionesRfq(Boolean notificacionesRfq) {
        this.notificacionesRfq = notificacionesRfq;
    }

  
    public Boolean getEntregaRapida() {
        return entregaRapida;
    }

    public void setEntregaRapida(Boolean entregaRapida) {
        this.entregaRapida = entregaRapida;
    }
}
