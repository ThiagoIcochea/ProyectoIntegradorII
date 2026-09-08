package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatchingService {

    private final ProveedorProductoRepository repo;

    public MatchingService(ProveedorProductoRepository repo) {
        this.repo = repo;
    }

    public List<Integer> encontrarProveedores(RFQRequest request) {

        List<Integer> productos = request.getItems()
                .stream()
                .map(Item -> Item.getIdProducto())
                .toList();

        return repo.findProveedoresConTodosLosProductos(
                productos,
                productos.size()
        );
    }
}