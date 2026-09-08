package com.nethink.b2b.dto.request;

import java.util.List;

public class ActualizarProductoRequest {

    private Integer idProducto;

    private String nombre;

    private String marca;

    private String categoria;

    private String estado;

    private List<ImagenProductoRequest> imagenes;

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

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado=estado;
    }

    public List<ImagenProductoRequest> getImagenes() {
        return imagenes;
    }

    public void setImagenes(List<ImagenProductoRequest> imagenes) {
        this.imagenes = imagenes;
    }
}