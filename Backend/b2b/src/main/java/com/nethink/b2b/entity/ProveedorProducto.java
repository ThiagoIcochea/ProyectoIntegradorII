package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "proveedor_producto")
public class ProveedorProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_prov_prod")
    private Integer idProvProd;
    

    @ManyToOne
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    private BigDecimal precio;
    private Integer stock;

    @Column(name = "tiempo_entrega_dias")
    private Integer tiempoEntregaDias;

    @Column(name = "garantia_meses")
    private Integer garantiaMeses;

    private Boolean enOferta;

    @Column(name = "porcentaje_descuento")
    private Double porcentajeDescuento;
    
    @Column(name = "estado")
    private String estado;

    @Column(name = "ultima_actualizacion_stock")
    private LocalDateTime ultimaActualizacionStock;

    public ProveedorProducto() {}

    public Integer getIdProvProd() {
        return idProvProd;
    }

    public void setIdProvProd(Integer idProvProd) {
        this.idProvProd = idProvProd;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public BigDecimal  getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getTiempoEntregaDias() {
        return tiempoEntregaDias;
    }

    public void setTiempoEntregaDias(Integer tiempoEntregaDias) {
        this.tiempoEntregaDias = tiempoEntregaDias;
    }

    public Integer getGarantiaMeses() {
        return garantiaMeses;
    }

    public void setGarantiaMeses(Integer garantiaMeses) {
        this.garantiaMeses = garantiaMeses;
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

    public LocalDateTime getUltimaActualizacionStock() {
        return ultimaActualizacionStock;
    }

    public void setUltimaActualizacionStock(LocalDateTime ultimaActualizacionStock) {
        this.ultimaActualizacionStock = ultimaActualizacionStock;
    }
    
    public String getEstado() {
    return estado;
}

public void setEstado(String estado) {
    this.estado = estado;
}
}