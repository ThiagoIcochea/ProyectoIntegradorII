package com.nethink.b2b.dto.response;

import java.util.List;

public class CatalogoRecordResponse {

    private List<CatalogoResponse> catalogo;

    public List<CatalogoResponse> getCatalogo() {
        return catalogo;
    }

    public void setCatalogo(List<CatalogoResponse> catalogo) {
        this.catalogo = catalogo;
    }
}