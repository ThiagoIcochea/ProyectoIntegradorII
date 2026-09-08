package com.nethink.b2b.dto.response;

import java.util.List;

public class ProveedorProductoResponse {

    private Integer idProvProd;
    private Double precio;
    private Integer stock;
    private Integer garantiaMeses;
    private Integer tiempoEntregaDias;
    private Boolean enOferta;
    private Double porcentajeDescuento;
    private String estado;

    private Integer idProducto;
    private String nombre;
    private String descripcion;
    private String skuGlobal;
    private String fuente;
    private String apiOrigen;
    private String estadoProducto;

    private Integer idMarca;
    private String marca;

    private Integer idCategoria;
    private String categoria;

    private List<EspecificacionResponse> especificaciones;
    private List<ImagenResponse> imagenes;
    private List<DescuentoVolumenResponse> descuentosVolumen;

    private Integer stockDisponible;

    public Integer getIdProvProd() {
        return idProvProd;
    }

    public void setIdProvProd(Integer idProvProd) {
        this.idProvProd = idProvProd;
    }

    public Double getPrecio() {
        return precio;
    }

    public void setPrecio(Double precio) {
        this.precio = precio;
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

    public void setGarantiaMeses(Integer garantiaMeses) {
        this.garantiaMeses = garantiaMeses;
    }

    public Integer getTiempoEntregaDias() {
        return tiempoEntregaDias;
    }

    public void setTiempoEntregaDias(Integer tiempoEntregaDias) {
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

    public void setPorcentajeDescuento(Double porcentajeDescuento) {
        this.porcentajeDescuento = porcentajeDescuento;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getSkuGlobal() {
        return skuGlobal;
    }

    public void setSkuGlobal(String skuGlobal) {
        this.skuGlobal = skuGlobal;
    }

    public String getFuente() {
        return fuente;
    }

    public void setFuente(String fuente) {
        this.fuente = fuente;
    }

    public String getApiOrigen() {
        return apiOrigen;
    }

    public void setApiOrigen(String apiOrigen) {
        this.apiOrigen = apiOrigen;
    }

    public String getEstadoProducto() {
        return estadoProducto;
    }

    public void setEstadoProducto(String estadoProducto) {
        this.estadoProducto = estadoProducto;
    }

    public Integer getIdMarca() {
        return idMarca;
    }

    public void setIdMarca(Integer idMarca) {
        this.idMarca = idMarca;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public Integer getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(Integer idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public List<EspecificacionResponse> getEspecificaciones() {
        return especificaciones;
    }

    public void setEspecificaciones(List<EspecificacionResponse> especificaciones) {
        this.especificaciones = especificaciones;
    }

    public List<ImagenResponse> getImagenes() {
        return imagenes;
    }

    public void setImagenes(List<ImagenResponse> imagenes) {
        this.imagenes = imagenes;
    }

    public List<DescuentoVolumenResponse> getDescuentosVolumen() {
        return descuentosVolumen;
    }

    public void setDescuentosVolumen(List<DescuentoVolumenResponse> descuentosVolumen) {
        this.descuentosVolumen = descuentosVolumen;
    }

    public Integer getStockDisponible() {
        return stockDisponible;
    }

    public void setStockDisponible(Integer stockDisponible) {
        this.stockDisponible = stockDisponible;
    }
}