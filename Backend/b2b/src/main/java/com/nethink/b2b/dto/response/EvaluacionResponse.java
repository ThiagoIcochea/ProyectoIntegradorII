package com.nethink.b2b.dto.response;

import java.time.LocalDateTime;

public class EvaluacionResponse {

    private Integer idEvaluacion;

    private Integer idSolicitud;

    private Integer estrellasServicio;

    private Integer estrellasCalidad;

    private Integer estrellasTiempo;

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