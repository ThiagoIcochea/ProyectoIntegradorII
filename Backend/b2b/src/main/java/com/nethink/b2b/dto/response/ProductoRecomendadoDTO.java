package com.nethink.b2b.dto.response;

import java.util.List;

public class ProductoRecomendadoDTO {

    private Integer idProducto;
    private String producto;
    private String marca;
    private String categoria;
    private String descripcion;

    private Integer vecesPedido;

    private List<EspecificacionResponse> especificaciones;
    private List<ImagenResponse> imagenes;

    public ProductoRecomendadoDTO() {}

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

    public Integer getVecesPedido() {
        return vecesPedido;
    }

    public void setVecesPedido(Integer vecesPedido) {
        this.vecesPedido = vecesPedido;
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
}