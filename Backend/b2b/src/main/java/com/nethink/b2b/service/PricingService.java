package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PricingService {

    public List<RFQProveedorResponse> calcularCotizaciones(
            RFQRequest request,
            List<Integer> proveedores
    ) {

       
        return proveedores.stream().map(id -> {

            RFQProveedorResponse r = new RFQProveedorResponse();

            r.setIdProveedor(id);
            r.setTotalCotizacion(1000.0); // placeholder
            r.setTiempoEntregaPromedio(5);

            return r;

        }).toList();
    }
}