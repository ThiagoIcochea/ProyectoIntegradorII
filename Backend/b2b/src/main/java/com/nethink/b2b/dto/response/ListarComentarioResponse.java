/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.dto.response;

import java.time.LocalDateTime;

/**
 *
 * @author thico
 */
public class ListarComentarioResponse {
  

    private Integer idComentario;

  
    private Integer idProvProd;

  
    private Integer idUsuario;
    
    private String nombreUsuario;

    private String comentario;

    /*
      POSITIVO / NEGATIVO
      viene desde IA
    */
    private String tipo;

   
    private Integer likes = 0;

    private Integer dislikes = 0;

    private LocalDateTime fecha;

    public Integer getIdComentario() {
        return idComentario;
    }

    public void setIdComentario(Integer idComentario) {
        this.idComentario = idComentario;
    }

    public Integer getIdProvProd() {
        return idProvProd;
    }

    public void setIdProvProd(Integer idProvProd) {
        this.idProvProd = idProvProd;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getLikes() {
        return likes;
    }

    public void setLikes(Integer likes) {
        this.likes = likes;
    }

    public Integer getDislikes() {
        return dislikes;
    }

    public void setDislikes(Integer dislikes) {
        this.dislikes = dislikes;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
    
    public String getNombreUsuario() {
    return nombreUsuario;
}

public void setNombreUsuario(String nombreUsuario) {
    this.nombreUsuario = nombreUsuario;
}

}
