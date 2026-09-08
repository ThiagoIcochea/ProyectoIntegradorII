package com.nethink.b2b.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "producto_especificacion")
public class ProductoEspecificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_especificacion")
    private Integer idEspecificacion;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    private String nombre;
    private String valor;

    public ProductoEspecificacion() {}

    public Integer getIdEspecificacion() {
        return idEspecificacion;
    }

    public void setIdEspecificacion(Integer idEspecificacion) {
        this.idEspecificacion = idEspecificacion;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getValor() {
        return valor;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }
}