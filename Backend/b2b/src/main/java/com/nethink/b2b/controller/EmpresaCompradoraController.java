package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.SunatResponse;
import com.nethink.b2b.entity.EmpresaCompradora;
import com.nethink.b2b.service.EmpresaCompradoraService;
import com.nethink.b2b.service.SunatService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/empresas")
public class EmpresaCompradoraController {

    private final SunatService sunatService;

    private final EmpresaCompradoraService empresaService;

    public EmpresaCompradoraController(
            SunatService sunatService,
            EmpresaCompradoraService empresaService
    ) {
        this.sunatService = sunatService;
        this.empresaService = empresaService;
    }

    @GetMapping("/ruc/{ruc}")
    public ResponseEntity<SunatResponse> consultarRuc(
            @PathVariable String ruc
    ) {

        return ResponseEntity.ok(
                sunatService.consultarRuc(ruc)
        );
    }

    @PostMapping
    public ResponseEntity<?> registrarEmpresa(
            @RequestBody EmpresaCompradora empresa
    ) {

        return ResponseEntity.ok(
                empresaService.registrar(empresa)
        );
    }
}