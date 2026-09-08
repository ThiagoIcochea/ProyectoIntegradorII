package com.nethink.b2b.dto.response;

public class AdminProviderResponse {

    private Integer idProveedor;

    private String razonSocial;

    private String correo;

    private String ruc;

    private String apiUrl;

    private String apiTipo;

    private String estado;
    
     private String estadoApi;

private String codigoRespuesta;

private Integer tiempoRespuestaMs;

    public String getEstadoApi() {
        return estadoApi;
    }

    public void setEstadoApi(String estadoApi) {
        this.estadoApi = estadoApi;
    }

    public String getCodigoRespuesta() {
        return codigoRespuesta;
    }

    public void setCodigoRespuesta(String codigoRespuesta) {
        this.codigoRespuesta = codigoRespuesta;
    }

    public Integer getTiempoRespuestaMs() {
        return tiempoRespuestaMs;
    }

    public void setTiempoRespuestaMs(Integer tiempoRespuestaMs) {
        this.tiempoRespuestaMs = tiempoRespuestaMs;
    }
    
   

    public Integer getIdProveedor() {
        return idProveedor;
    }

    public void setIdProveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getApiTipo() {
        return apiTipo;
    }

    public void setApiTipo(String apiTipo) {
        this.apiTipo = apiTipo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}