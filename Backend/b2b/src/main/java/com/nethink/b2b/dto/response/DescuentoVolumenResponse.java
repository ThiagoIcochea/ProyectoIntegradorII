package com.nethink.b2b.dto.response;

public class DescuentoVolumenResponse {

    private Integer cantidadMin;
    private Double precioUnitario;

    public DescuentoVolumenResponse() {}

    public Integer getCantidadMin() { return cantidadMin; }
    public void setCantidadMin(Integer cantidadMin) { this.cantidadMin = cantidadMin; }

    public Double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(Double precioUnitario) { this.precioUnitario = precioUnitario; }
}