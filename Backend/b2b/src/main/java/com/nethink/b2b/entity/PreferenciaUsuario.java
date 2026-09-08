package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "preferencias_usuario")
public class PreferenciaUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPreferencia;

    @OneToOne
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    private Boolean notificacionesRfq = true;
    
    private Boolean entregaRapida = false;

    private LocalDateTime fechaActualizacion;

    public Integer getIdPreferencia() {
        return idPreferencia;
    }

    public void setIdPreferencia(Integer idPreferencia) {
        this.idPreferencia = idPreferencia;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Boolean getNotificacionesRfq() {
        return notificacionesRfq;
    }

    public void setNotificacionesRfq(Boolean notificacionesRfq) {
        this.notificacionesRfq = notificacionesRfq;
    }

   
    public Boolean getEntregaRapida() {
        return entregaRapida;
    }

    public void setEntregaRapida(Boolean entregaRapida) {
        this.entregaRapida = entregaRapida;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
}