package com.nethink.b2b.dto.response;

import java.util.List;

public class RFQProveedorResponse {

    private Integer idProveedor;
    private String nombreProveedor;
    private String razonSocial;

    private Double totalCotizacion;
    private Integer tiempoEntregaPromedio;
    private Double scoreFinal;

    private List<ItemCotizadoResponse> items;

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

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public Double getTotalCotizacion() {
        return totalCotizacion;
    }

    public void setTotalCotizacion(Double totalCotizacion) {
        this.totalCotizacion = totalCotizacion;
    }

    public Integer getTiempoEntregaPromedio() {
        return tiempoEntregaPromedio;
    }

    public void setTiempoEntregaPromedio(Integer tiempoEntregaPromedio) {
        this.tiempoEntregaPromedio = tiempoEntregaPromedio;
    }

    public Double getScoreFinal() {
        return scoreFinal;
    }

    public void setScoreFinal(Double scoreFinal) {
        this.scoreFinal = scoreFinal;
    }

    public List<ItemCotizadoResponse> getItems() {
        return items;
    }

    public void setItems(List<ItemCotizadoResponse> items) {
        this.items = items;
    }
}