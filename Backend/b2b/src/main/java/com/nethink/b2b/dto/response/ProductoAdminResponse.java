package com.nethink.b2b.dto.response;

import java.util.List;

public class ProductoAdminResponse {

    private Integer idProducto;
    private String name;
    private String skuGlobal;
    private String brand;
    private String category;

    private Integer providersCount;
    private Integer totalStock;

    private String status;
    
    private List<ImagenResponse> images;
    
    private List<CategoriaResponse> categorias;
    
    private List<MarcaResponse> marcas;

    public ProductoAdminResponse() {
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSkuGlobal() {
        return skuGlobal;
    }

    public void setSkuGlobal(String skuGlobal) {
        this.skuGlobal = skuGlobal;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getProvidersCount() {
        return providersCount;
    }

    public void setProvidersCount(Integer providersCount) {
        this.providersCount = providersCount;
    }

    public Integer getTotalStock() {
        return totalStock;
    }

    public void setTotalStock(Integer totalStock) {
        this.totalStock = totalStock;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<ImagenResponse> getImages() {
        return images;
    }

    public void setImages(List<ImagenResponse> images) {
        this.images = images;
    }

    public List<CategoriaResponse> getCategorias() {
        return categorias;
    }

    public void setCategorias(List<CategoriaResponse> categorias) {
        this.categorias = categorias;
    }

    public List<MarcaResponse> getMarcas() {
        return marcas;
    }

    public void setMarcas(List<MarcaResponse> marcas) {
        this.marcas = marcas;
    }
    
    
}