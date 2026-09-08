package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.PublicidadResponse;
import com.nethink.b2b.service.PublicidadService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publicidad")
@CrossOrigin(origins = "*")
public class PublicidadController {

    private final PublicidadService service;

    public PublicidadController(PublicidadService service) {
        this.service = service;
    }

    @GetMapping("/activas")
    public List<PublicidadResponse> listarActivas() {
        return service.listarActivas();
    }
}