package com.nethink.b2b.controller;

import com.nethink.b2b.entity.Certificacion;
import com.nethink.b2b.repository.CertificacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificaciones")
public class CertificacionController {

    @Autowired
    private CertificacionRepository certificacionRepository;

    @GetMapping
    public List<Certificacion> listar() {
        return certificacionRepository.findAll();
    }
}