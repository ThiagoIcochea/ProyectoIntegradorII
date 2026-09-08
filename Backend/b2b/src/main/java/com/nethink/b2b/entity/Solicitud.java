package com.nethink.b2b.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List; 

@Entity
@Table(name = "solicitudes")
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud")
    private Integer idSolicitud;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empresa")
    private EmpresaCompradora empresaCompradora;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;
    
    @JsonIgnore
    @OneToMany(mappedBy = "solicitud", fetch = FetchType.LAZY)
    private List<DetalleSolicitud> detalles;

    @Column(name = "direccion_envio", columnDefinition = "TEXT")
    private String direccionEnvio;

    @Column(name = "codigo_usado")
    private Boolean codigoUsado = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoSolicitud estado;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "codigo_recepcion", unique = true)
    private String codigoRecepcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancelado_por")
    private CanceladoPor canceladoPor;

    @Column(name = "motivo_cancelacion", columnDefinition = "TEXT")
    private String motivoCancelacion;

    @Column(name = "fecha_cancelacion")
    private LocalDateTime fechaCancelacion;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_limite_entrega")
    private LocalDateTime fechaLimiteEntrega;

    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;

    @Version
    private Long version;

    public enum EstadoSolicitud {
        CREADA,
        COTIZADA,
        ACEPTADA,
        PEDIDO_APROBADO,
        PEDIDO_RECHAZADO,
        RECHAZADA,
        PAGO_PENDIENTE,
        PAGO_VALIDANDO,
        PAGADA,
        CONFIRMADA,
        ESPERANDO_ENVIO,
        EN_CAMINO,
        ENTREGADA,
        COMPLETADA,
        CANCELADA,
        NO_ENTREGADA,
        EN_RECLAMO,
        VENCIDA,
        EN_PREPARACION,
        RECLAMO_ABIERTO,
        RECLAMO_EN_REVISION,
        RECLAMO_RECHAZADO,
        RECLAMO_RESUELTO
         
    }

    public enum CanceladoPor {
        CLIENTE,
        PROVEEDOR,
        SISTEMA
    }

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public EmpresaCompradora getEmpresaCompradora() {
        return empresaCompradora;
    }

    public void setEmpresaCompradora(EmpresaCompradora empresaCompradora) {
        this.empresaCompradora = empresaCompradora;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public String getDireccionEnvio() {
        return direccionEnvio  ;
    }

    public void setDireccionEnvio(String direccionEnvio) {
        this.direccionEnvio = direccionEnvio;
    }

    public Boolean getCodigoUsado() {
        return codigoUsado;
    }

    public void setCodigoUsado(Boolean codigoUsado) {
        this.codigoUsado = codigoUsado;
    }

    public EstadoSolicitud getEstado() {
        return estado;
    }

    public void setEstado(EstadoSolicitud estado) {
        this.estado = estado;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getIgv() {
        return igv;
    }

    public void setIgv(BigDecimal igv) {
        this.igv = igv;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getCodigoRecepcion() {
        return codigoRecepcion;
    }

    public void setCodigoRecepcion(String codigoRecepcion) {
        this.codigoRecepcion = codigoRecepcion;
    }

    public CanceladoPor getCanceladoPor() {
        return canceladoPor;
    }

    public void setCanceladoPor(CanceladoPor canceladoPor) {
        this.canceladoPor = canceladoPor;
    }

    public String getMotivoCancelacion() {
        return motivoCancelacion;
    }

    public void setMotivoCancelacion(String motivoCancelacion) {
        this.motivoCancelacion = motivoCancelacion;
    }

    public LocalDateTime getFechaCancelacion() {
        return fechaCancelacion;
    }

    public void setFechaCancelacion(LocalDateTime fechaCancelacion) {
        this.fechaCancelacion = fechaCancelacion;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaLimiteEntrega() {
        return fechaLimiteEntrega;
    }

    public void setFechaLimiteEntrega(LocalDateTime fechaLimiteEntrega) {
        this.fechaLimiteEntrega = fechaLimiteEntrega;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public LocalDateTime getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(LocalDateTime fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public LocalDateTime getFechaConfirmacion() {
        return fechaConfirmacion;
    }

    public void setFechaConfirmacion(LocalDateTime fechaConfirmacion) {
        this.fechaConfirmacion = fechaConfirmacion;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
    
   @JsonIgnore
    public List<DetalleSolicitud> getDetalles() {
      return detalles;
   }

    public void setDetalles(List<DetalleSolicitud> detalles) {
      this.detalles = detalles;
   }  
    
    
    
}