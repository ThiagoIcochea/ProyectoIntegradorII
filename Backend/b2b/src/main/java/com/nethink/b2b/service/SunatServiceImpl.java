package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.SunatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class SunatServiceImpl implements SunatService {

    private final RestTemplate restTemplate;
    @Autowired
    private  ConfigService configService;

  
    

    public SunatServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public SunatResponse consultarRuc(String ruc) {
        return consultar(ruc, false);
    }

    @Override
    public SunatResponse consultarRucCompleto(String ruc) {
        try {
            return consultar(ruc, true);
        } catch (org.springframework.web.client.HttpStatusCodeException error) {
            // Si la consulta ampliada no esta disponible, conservar la consulta
            // basica para identificar la empresa, sin inventar una actividad.
            return consultarRuc(ruc);
        }
    }

    private SunatResponse consultar(String ruc, boolean completo) {
        
        if (ruc == null || !ruc.matches("^(10|20)\\d{9}$")) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "El RUC debe tener 11 digitos y comenzar con 10 o 20.");
        }
        String apiKey = configService.getValor("DECOLECTA_API_TOKEN");

        String url = "https://api.decolecta.com/v1/sunat/ruc" + (completo ? "/full" : "") + "?numero=" + ruc;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
        );

        Map body = response.getBody();

        if (body == null || !(body.get("razon_social") instanceof String razon) || razon.isBlank()
                || !ruc.equals(body.get("numero_documento"))) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se encontraron datos validos para este RUC.");
        }
        SunatResponse dto = new SunatResponse();

        dto.setRuc((String) body.get("numero_documento"));
        dto.setRazonSocial((String) body.get("razon_social"));
        dto.setDireccion((String) body.get("direccion"));
        dto.setEstado((String) body.get("estado"));
        dto.setCondicion((String) body.get("condicion"));
        Object actividad = body.get("actividad_economica");
        dto.setActividadEconomica(actividad instanceof String texto ? texto : null);

        return dto;
    }
}