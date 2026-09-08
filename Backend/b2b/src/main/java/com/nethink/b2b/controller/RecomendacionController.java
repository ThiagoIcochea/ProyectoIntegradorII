package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.ProductoRecomendadoDTO;
import com.nethink.b2b.service.RecomendacionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recomendados")
public class RecomendacionController {

    private final RecomendacionService service;

    public RecomendacionController(RecomendacionService service) {
        this.service = service;
    }

    @GetMapping("/productos")
    public List<ProductoRecomendadoDTO> listarRecomendados() {
        return service.listar();
    }
}