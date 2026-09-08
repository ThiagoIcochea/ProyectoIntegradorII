/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.dto.response;

/**
 *
 * @author thico
 */
public class MarcaResponse {
    private Integer idMarca;

    private String nombre;

    public MarcaResponse(Integer idMarca, String nombre) {
        this.idMarca = idMarca;
        this.nombre = nombre;
    }
    
    

    public Integer getIdMarca() {
        return idMarca;
    }

    public void setIdMarca(Integer idMarca) {
        this.idMarca = idMarca;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
    
    
}
