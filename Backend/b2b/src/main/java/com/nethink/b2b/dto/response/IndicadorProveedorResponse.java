package com.nethink.b2b.dto.response;

import java.time.LocalDateTime;

public class IndicadorProveedorResponse {
    
    private String descripcion;

    private Integer idProveedor;

    private String razonSocial;

    private int pedidosCompletados;

    private int pedidosTotal;

    private double cumplimiento;

    private double scoreGeneral;

    private String categoriaPrincipal;

    private int totalResenas;
   

    private int likes;

    private int dislikes;

    private double satisfaccion;

    private double tiempoEntregaPromedio;

    private boolean verificado;
    
    private LocalDateTime fechaRegistro;

    private String estado;

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

    public int getPedidosCompletados() {
        return pedidosCompletados;
    }

    public void setPedidosCompletados(int pedidosCompletados) {
        this.pedidosCompletados = pedidosCompletados;
    }

    public int getPedidosTotal() {
        return pedidosTotal;
    }

    public void setPedidosTotal(int pedidosTotal) {
        this.pedidosTotal = pedidosTotal;
    }

    public double getCumplimiento() {
        return cumplimiento;
    }

    public void setCumplimiento(double cumplimiento) {
        this.cumplimiento = cumplimiento;
    }

    public double getScoreGeneral() {
        return scoreGeneral;
    }

    public void setScoreGeneral(double scoreGeneral) {
        this.scoreGeneral = scoreGeneral;
    }

    public String getCategoriaPrincipal() {
        return categoriaPrincipal;
    }

    public void setCategoriaPrincipal(String categoriaPrincipal) {
        this.categoriaPrincipal = categoriaPrincipal;
    }

    public int getTotalResenas() {
        return totalResenas;
    }

    public void setTotalResenas(int totalResenas) {
        this.totalResenas = totalResenas;
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public int getDislikes() {
        return dislikes;
    }

    public void setDislikes(int dislikes) {
        this.dislikes = dislikes;
    }

    public double getSatisfaccion() {
        return satisfaccion;
    }

    public void setSatisfaccion(double satisfaccion) {
        this.satisfaccion = satisfaccion;
    }

    public double getTiempoEntregaPromedio() {
        return tiempoEntregaPromedio;
    }

    public void setTiempoEntregaPromedio(double tiempoEntregaPromedio) {
        this.tiempoEntregaPromedio = tiempoEntregaPromedio;
    }

    public boolean isVerificado() {
        return verificado;
    }

    public void setVerificado(boolean verificado) {
        this.verificado = verificado;
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

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    
    
}