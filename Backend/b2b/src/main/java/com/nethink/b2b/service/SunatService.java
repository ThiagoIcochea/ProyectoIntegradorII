package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.SunatResponse;

public interface SunatService {

    SunatResponse consultarRuc(String ruc);

    SunatResponse consultarRucCompleto(String ruc);
}