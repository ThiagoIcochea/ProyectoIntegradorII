package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Integer idPago;

    //@Column(name = "id_solicitud")
    //private Integer idSolicitud;
    
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud")
    private Solicitud solicitud; 
    
    

    private String metodo;
    private String entidad;
    
    @Column(name = "fecha_validacion")
    private LocalDateTime fechaValidacion; 

    @Column(name = "codigo_operacion")
    private String codigoOperacion;

    private BigDecimal monto;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @Enumerated(EnumType.STRING)
    private EstadoPago estado;

    private Boolean validado = false;
    
    @Column(name="validado_por")
    private Integer validadoPor; // idusuario que actualiza estado de pago

    @Column(name = "comprobante_url")
    private String comprobanteUrl;

    public enum EstadoPago {
        PENDIENTE, VALIDANDO, APROBADO, RECHAZADO
    }

    public Pago() {}

    // Getters y Setters
    public Integer getIdPago() { return idPago; }
    public void setIdPago(Integer idPago) { this.idPago = idPago; }
    //public Integer getIdSolicitud() { return idSolicitud; }
    //public void setIdSolicitud(Integer idSolicitud) { this.idSolicitud = idSolicitud; }
    
    public Solicitud getSolicitud() { return solicitud; }
    public void setSolicitud(Solicitud solicitud) { this.solicitud = solicitud; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public String getEntidad() { return entidad; }
    public void setEntidad(String entidad) { this.entidad = entidad; }
    public String getCodigoOperacion() { return codigoOperacion; }
    public void setCodigoOperacion(String codigoOperacion) { this.codigoOperacion = codigoOperacion; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago   ; }
    public EstadoPago getEstado() { return estado; }
    public void setEstado(EstadoPago estado) { this.estado = estado; }
    public Boolean getValidado() { return validado; }
    public void setValidado(Boolean validado) { this.validado = validado; }
    public LocalDateTime getFechaValidacion(){  return fechaValidacion;  } 
    public void setFechaValidacion(LocalDateTime  fechaValidacion){this.fechaValidacion=fechaValidacion; }
    public Integer getValidadoPor(){return validadoPor; }
    public void setValidadoPor(Integer validadoPor){this.validadoPor=validadoPor; }
    public String getComprobanteUrl() { return comprobanteUrl; }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }
}
