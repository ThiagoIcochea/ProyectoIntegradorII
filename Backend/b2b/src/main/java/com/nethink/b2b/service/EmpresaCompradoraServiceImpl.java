package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.SunatResponse;
import com.nethink.b2b.entity.EmpresaCompradora;
import com.nethink.b2b.repository.EmpresaCompradoraRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class EmpresaCompradoraServiceImpl implements EmpresaCompradoraService {

    private final EmpresaCompradoraRepository empresaRepo;
    private final SunatService sunatService;

    public EmpresaCompradoraServiceImpl(
            EmpresaCompradoraRepository empresaRepo,
            SunatService sunatService
    ) {
        this.empresaRepo = empresaRepo;
        this.sunatService = sunatService;
    }

    @Override
    public EmpresaCompradora registrar(EmpresaCompradora empresa) {

        if (empresa.getRuc() == null || empresa.getRuc().isBlank()) {
            throw new RuntimeException("El RUC es obligatorio");
        }

        Optional<EmpresaCompradora> existente =
                empresaRepo.findByRuc(empresa.getRuc());

        if (existente.isPresent()) {
            return existente.get();
        }

        SunatResponse sunat = sunatService.consultarRuc(empresa.getRuc());

        if (sunat == null) {
            throw new RuntimeException("No se pudo consultar SUNAT");
        }

        empresa.setRuc(sunat.getRuc());
        empresa.setRazonSocial(sunat.getRazonSocial());
        empresa.setDireccion(sunat.getDireccion());
        empresa.setEstado(sunat.getEstado());
        empresa.setCondicion(sunat.getCondicion());
        empresa.setFechaRegistro(LocalDateTime.now());

        return empresaRepo.save(empresa);
    }
}