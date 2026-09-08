package com.nethink.b2b.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "descuentos_volumen")
public class DescuentoVolumen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_descuento")
    private Integer idDescuento;

    @ManyToOne
    @JoinColumn(name = "id_prov_prod")
    private ProveedorProducto proveedorProducto;

    @Column(name = "cantidad_min")
    private Integer cantidadMin;

    @Column(name = "precio_unitario")
    private Double precioUnitario;

    public DescuentoVolumen() {}

    public Integer getIdDescuento() { return idDescuento; }
    public void setIdDescuento(Integer idDescuento) { this.idDescuento = idDescuento; }

    public ProveedorProducto getProveedorProducto() { return proveedorProducto; }
    public void setProveedorProducto(ProveedorProducto proveedorProducto) { this.proveedorProducto = proveedorProducto; }

    public Integer getCantidadMin() { return cantidadMin; }
    public void setCantidadMin(Integer cantidadMin) { this.cantidadMin = cantidadMin; }

    public Double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(Double precioUnitario) { this.precioUnitario = precioUnitario; }
}