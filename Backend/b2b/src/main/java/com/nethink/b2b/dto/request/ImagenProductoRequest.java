package com.nethink.b2b.dto.request;

import org.springframework.web.multipart.MultipartFile;

public class ImagenProductoRequest {

    private MultipartFile archivo;
    
    private String url;

    private Boolean principal;

    public MultipartFile getArchivo() {
        return archivo;
    }

    public void setArchivo(MultipartFile archivo) {
        this.archivo = archivo;
    }

    public Boolean getPrincipal() {
        return principal;
    }

    public void setPrincipal(Boolean principal) {
        this.principal = principal;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
    
    
    

}