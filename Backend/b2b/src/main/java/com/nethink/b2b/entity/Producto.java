package com.nethink.b2b.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer idProducto;

    @Column(name = "sku_global")
    private String skuGlobal;

    private String nombre;

    @ManyToOne
    @JoinColumn(name = "id_marca")
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler"
    })
    private Marca marca;

    @ManyToOne
    @JoinColumn(name = "id_categoria")
    @JsonIgnoreProperties({
            "hibernateLazyInitializer",
            "handler"
    })
    private Categoria categoria;

    private String descripcion;

    private String estado;

    private String fuente;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "api_origen")
    private String apiOrigen;

    public Producto() {}

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getSkuGlobal() {
        return skuGlobal;
    }

    public void setSkuGlobal(String skuGlobal) {
        this.skuGlobal = skuGlobal;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Marca getMarca() {
        return marca;
    }

    public void setMarca(Marca marca) {
        this.marca = marca;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFuente() {
        return fuente;
    }

    public void setFuente(String fuente) {
        this.fuente = fuente;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(
            LocalDateTime fechaActualizacion
    ) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public String getApiOrigen() {
        return apiOrigen;
    }

    public void setApiOrigen(String apiOrigen) {
        this.apiOrigen = apiOrigen;
    }
}