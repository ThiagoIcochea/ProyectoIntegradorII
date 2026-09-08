package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluaciones")
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idEvaluacion;

    @Column(name = "id_solicitud")
    private Integer idSolicitud;

    @Column(name = "estrellas_servicio")
    private Integer estrellasServicio;

    @Column(name = "estrellas_calidad")
    private Integer estrellasCalidad;

    @Column(name = "estrellas_tiempo")
    private Integer estrellasTiempo;

    @Column(name = "estrellas_comunicacion")
    private Integer estrellasComunicacion;

    private String comentario;

    private LocalDateTime fecha;

    public Integer getIdEvaluacion() {
        return idEvaluacion;
    }

    public void setIdEvaluacion(Integer idEvaluacion) {
        this.idEvaluacion = idEvaluacion;
    }

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public Integer getEstrellasServicio() {
        return estrellasServicio;
    }

    public void setEstrellasServicio(Integer estrellasServicio) {
        this.estrellasServicio = estrellasServicio;
    }

    public Integer getEstrellasCalidad() {
        return estrellasCalidad;
    }

    public void setEstrellasCalidad(Integer estrellasCalidad) {
        this.estrellasCalidad = estrellasCalidad;
    }

    public Integer getEstrellasTiempo() {
        return estrellasTiempo;
    }

    public void setEstrellasTiempo(Integer estrellasTiempo) {
        this.estrellasTiempo = estrellasTiempo;
    }

    public Integer getEstrellasComunicacion() {
        return estrellasComunicacion;
    }

    public void setEstrellasComunicacion(Integer estrellasComunicacion) {
        this.estrellasComunicacion = estrellasComunicacion;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}