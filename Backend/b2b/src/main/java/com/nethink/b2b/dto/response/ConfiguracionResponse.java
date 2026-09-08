package com.nethink.b2b.dto.response;

public class ConfiguracionResponse {

    private Integer id;
    private String clave;
    private String valor;
    private String tipo;

    private boolean testeable;

    private String estado;

    public ConfiguracionResponse() {
    }

    public ConfiguracionResponse(
            Integer id,
            String clave,
            String valor,
            boolean testeable,
            String estado,
            String tipo
    ) {
        this.id = id;
        this.clave = clave;
        this.valor = valor;
        this.testeable = testeable;
        this.estado = estado;
        this.tipo = tipo;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getClave() {
        return clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }

    public String getValor() {
        return valor;
    }
    
    public String getTipo(){
        return tipo;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }
    
    public void setTipo(String tipo){
        this.tipo = tipo;
    }

    public boolean isTesteable() {
        return testeable;
    }

    public void setTesteable(boolean testeable) {
        this.testeable = testeable;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}