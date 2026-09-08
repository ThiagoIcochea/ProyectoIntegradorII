/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 *
 * @author thico
 */
@Entity
@Table(name = "configuracion_sistema")
public class Configuracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String clave;

    private String valor;
    
    

    
    private String tipo;
    
    private String estado;
    
   

    public Integer getId() {
        return id;
    }

    public String getClave() {
        return clave;
    }

    public String getValor() {
        return valor;
    }

   public String getTipo(){
       return tipo;
   }
   
   public String getEstado(){
       return estado;
   }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }
    
    public void setTipo(String  tipo){
        this.tipo = tipo;
    }
    
    public void setEstado(String estado){
        this.estado = estado;
    }
}
