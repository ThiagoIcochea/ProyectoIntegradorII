package com.nethink.b2b.dto.request;

import java.util.List;

public class FiltroRFQRequest {

    private Double precioMin;
    private Double precioMax;
    private List<Integer> categorias;
    private List<Integer> marcas;
    private List<String> especificaciones;

    public FiltroRFQRequest() {
    }

    public Double getPrecioMin() {
        return precioMin;
    }

    public void setPrecioMin(Double precioMin) {
        this.precioMin = precioMin;
    }

    public Double getPrecioMax() {
        return precioMax;
    }

    public void setPrecioMax(Double precioMax) {
        this.precioMax = precioMax;
    }

    public List<Integer> getCategorias() {
        return categorias;
    }

    public void setCategorias(List<Integer> categorias) {
        this.categorias = categorias;
    }

    public List<Integer> getMarcas() {
        return marcas;
    }

    public void setMarcas(List<Integer> marcas) {
        this.marcas = marcas;
    }

    public List<String> getEspecificaciones() {
        return especificaciones;
    }

    public void setEspecificaciones(List<String> especificaciones) {
        this.especificaciones = especificaciones;
    }
}
