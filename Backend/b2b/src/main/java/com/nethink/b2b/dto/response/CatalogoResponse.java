package com.nethink.b2b.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class CatalogoResponse {

    private Integer idProducto;

    private String producto;

    private String sku;

    private String marca;

    private String categoria;

    private String descripcion;

    private BigDecimal precioUnitario;

    private Integer stock;

    private Integer garantiaMeses;

    private Integer tiempoEntregaDias;

    private Boolean enOferta;

    private Double porcentajeDescuento;

    private String estado;

    private List<EspecificacionResponse> especificaciones;

    private List<ImagenResponse> imagenes;

    private List<DescuentoVolumenResponse> descuentosVolumen;

    public CatalogoResponse() {}

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getProducto() {
        return producto;
    }

    public void setProducto(String producto) {
        this.producto = producto;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(
            BigDecimal precioUnitario
    ) {
        this.precioUnitario = precioUnitario;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getGarantiaMeses() {
        return garantiaMeses;
    }

    public void setGarantiaMeses(
            Integer garantiaMeses
    ) {
        this.garantiaMeses = garantiaMeses;
    }

    public Integer getTiempoEntregaDias() {
        return tiempoEntregaDias;
    }

    public void setTiempoEntregaDias(
            Integer tiempoEntregaDias
    ) {
        this.tiempoEntregaDias = tiempoEntregaDias;
    }

    public Boolean getEnOferta() {
        return enOferta;
    }

    public void setEnOferta(Boolean enOferta) {
        this.enOferta = enOferta;
    }

    public Double getPorcentajeDescuento() {
        return porcentajeDescuento;
    }

    public void setPorcentajeDescuento(
            Double porcentajeDescuento
    ) {
        this.porcentajeDescuento =
                porcentajeDescuento;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public List<EspecificacionResponse>
    getEspecificaciones() {
        return especificaciones;
    }

    public void setEspecificaciones(
            List<EspecificacionResponse>
                    especificaciones
    ) {
        this.especificaciones =
                especificaciones;
    }

    public List<ImagenResponse> getImagenes() {
        return imagenes;
    }

    public void setImagenes(
            List<ImagenResponse> imagenes
    ) {
        this.imagenes = imagenes;
    }

    public List<DescuentoVolumenResponse>
    getDescuentosVolumen() {
        return descuentosVolumen;
    }

    public void setDescuentosVolumen(
            List<DescuentoVolumenResponse>
                    descuentosVolumen
    ) {
        this.descuentosVolumen =
                descuentosVolumen;
    }
}