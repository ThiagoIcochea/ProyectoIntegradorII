package com.nethink.b2b.dto.request;

public class ApiConfiguracionRequest {

    private String apiUrl;
    private String apiTipo;
    private String apiToken;

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

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }
}