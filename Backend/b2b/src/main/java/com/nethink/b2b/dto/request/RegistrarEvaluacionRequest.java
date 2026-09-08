package com.nethink.b2b.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RegistrarEvaluacionRequest {

    @NotNull
    private Integer idSolicitud;

    @Min(1)
    @Max(5)
    private Integer estrellasServicio;

    @Min(1)
    @Max(5)
    private Integer estrellasCalidad;

    @Min(1)
    @Max(5)
    private Integer estrellasTiempo;

    @Min(1)
    @Max(5)
    private Integer estrellasComunicacion;

    private String comentario;

   

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
}