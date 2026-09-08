package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.CategoriaResponse;
import com.nethink.b2b.dto.response.MarcaResponse;
import com.nethink.b2b.repository.CategoriaRepository;
import com.nethink.b2b.repository.MarcaRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
public class FiltroCatalogoController {

    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;

    public FiltroCatalogoController(CategoriaRepository categoriaRepository, MarcaRepository marcaRepository) {
        this.categoriaRepository = categoriaRepository;
        this.marcaRepository = marcaRepository;
    }

    @GetMapping("/categorias")
    public List<CategoriaResponse> listarCategorias() {
        return categoriaRepository.findAll().stream()
                .map(c -> new CategoriaResponse(c.getIdCategoria(), c.getNombre()))
                .toList();
    }

    @GetMapping("/marcas")
    public List<MarcaResponse> listarMarcas() {
        return marcaRepository.findAll().stream()
                .map(m -> new MarcaResponse(m.getIdMarca(), m.getNombre()))
                .toList();
    }
}
