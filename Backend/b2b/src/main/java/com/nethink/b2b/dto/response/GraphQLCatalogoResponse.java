package com.nethink.b2b.dto.response;

import java.util.List;

public class GraphQLCatalogoResponse {

    private Data data;

    public GraphQLCatalogoResponse() {
    }

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public static class Data {

        private List<CatalogoResponse> catalogo;

        public Data() {
        }

        public List<CatalogoResponse> getCatalogo() {
            return catalogo;
        }

        public void setCatalogo(List<CatalogoResponse> catalogo) {
            this.catalogo = catalogo;
        }
    }
}