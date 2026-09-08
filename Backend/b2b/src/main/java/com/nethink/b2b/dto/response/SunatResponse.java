package com.nethink.b2b.dto.response;

public class SunatResponse {

    private String ruc;

    private String razonSocial;

    private String direccion;

    private String estado;

    private String condicion;

    private String actividadEconomica;

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCondicion() {
        return condicion;
    }

    public void setCondicion(String condicion) {
        this.condicion = condicion;
    }
    public String getActividadEconomica() {
        return actividadEconomica;
    }

    public void setActividadEconomica(String actividadEconomica) {
        this.actividadEconomica = actividadEconomica == null ? null : actividadEconomica.trim();
    }

    public String getDescripcion() {
        if (actividadEconomica == null || actividadEconomica.isBlank()) {
            return "";
        }
        return actividadEconomica.length() <= 250
                ? actividadEconomica : actividadEconomica.substring(0, 247) + "...";
    }
}
