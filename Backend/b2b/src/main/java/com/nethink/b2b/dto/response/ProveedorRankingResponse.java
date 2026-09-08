package com.nethink.b2b.dto.response;

public class ProveedorRankingResponse {

    private Integer idProveedor;
    private String razonSocial;

    private Double scoreTotal;
    private Double scoreCalidad;
    private Double scorePrecio;
    private Double scoreTiempo;

    private Integer reclamosActivos;
    private Integer pedidosCancelados;

   

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

    public Double getScoreTotal() {
        return scoreTotal;
    }

    public void setScoreTotal(Double scoreTotal) {
        this.scoreTotal = scoreTotal;
    }

    public Double getScoreCalidad() {
        return scoreCalidad;
    }

    public void setScoreCalidad(Double scoreCalidad) {
        this.scoreCalidad = scoreCalidad;
    }

    public Double getScorePrecio() {
        return scorePrecio;
    }

    public void setScorePrecio(Double scorePrecio) {
        this.scorePrecio = scorePrecio;
    }

    public Double getScoreTiempo() {
        return scoreTiempo;
    }

    public void setScoreTiempo(Double scoreTiempo) {
        this.scoreTiempo = scoreTiempo;
    }

    public Integer getReclamosActivos() {
        return reclamosActivos;
    }

    public void setReclamosActivos(Integer reclamosActivos) {
        this.reclamosActivos = reclamosActivos;
    }

    public Integer getPedidosCancelados() {
        return pedidosCancelados;
    }

    public void setPedidosCancelados(Integer pedidosCancelados) {
        this.pedidosCancelados = pedidosCancelados;
    }
}