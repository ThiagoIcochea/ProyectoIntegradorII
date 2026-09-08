package com.nethink.b2b.repository;

import com.nethink.b2b.entity.EmpresaCompradora;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmpresaCompradoraRepository
        extends JpaRepository<EmpresaCompradora, Integer> {

    Optional<EmpresaCompradora> findByRuc(String ruc);

}