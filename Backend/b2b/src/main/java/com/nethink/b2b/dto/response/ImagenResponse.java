package com.nethink.b2b.dto.response;

public class ImagenResponse {

    private String url;
    private Boolean principal;
    private Integer orden;

    public ImagenResponse() {}
    
     public ImagenResponse(String url, boolean principal) {
        this.url = url;
        this.principal = principal;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Boolean getPrincipal() {
        return principal;
    }

    public void setPrincipal(Boolean principal) {
        this.principal = principal;
    }
    
      public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }
    
}