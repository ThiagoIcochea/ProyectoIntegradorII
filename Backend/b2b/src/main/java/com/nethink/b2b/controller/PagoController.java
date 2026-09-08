/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.controller;

import java.util.List; 

import java.util.Map; 

import java.security.Principal;



import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;


import com.nethink.b2b.dto.response.PagoResponse;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.service.PagoService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

import com.nethink.b2b.entity.Usuario; 
import com.nethink.b2b.repository.UsuarioRepository; 






/**
 *
 * @author USUARIO
 */

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

     
    
    
    private final PagoService pagoService; 
    private final ProveedorRepository proveedorRepo; 
    private final UsuarioRepository usuarioRepo; 
    
    
    public PagoController(PagoService pagoService, ProveedorRepository proveedorRepo, UsuarioRepository usuarioRepo){
    
    this.pagoService= pagoService; 
    this.proveedorRepo=proveedorRepo;
    this.usuarioRepo=usuarioRepo;  
    
    
    }
    
    
    
    
    
    
    @GetMapping("/proveedor/mis-pagos")
public ResponseEntity<List<PagoResponse>>
listarMisPagos(Principal principal,HttpServletRequest httpRequest) {

    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(
                    principal.getName())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Proveedor no encontrado"));

    return ResponseEntity.ok(
            pagoService.listarPagosProveedor(
                    proveedor.getIdProveedor(), httpRequest)
    );
}
    
    
    
@PutMapping("/{idPago}/aprobar")
public ResponseEntity<?> aprobarPago(
        @PathVariable Integer idPago, Principal principal, HttpServletRequest httpRequest
) {

    
    
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() ->
                    new RuntimeException("Usuario no encontrado"));

    pagoService.aprobarPago(idPago, usuario.getIdUsuario(), httpRequest);
    
    

    return ResponseEntity.ok(
          Map.of("mensaje","Pago aprobado" )
    );
}   
    

@PutMapping("/{idPago}/rechazar")
public ResponseEntity<?> rechazarPago(
        @PathVariable Integer idPago,
        Principal principal,
        HttpServletRequest httpRequest
) {

    
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() ->
                    new RuntimeException("Usuario no encontrado"));

    pagoService.rechazarPago(idPago, usuario.getIdUsuario(), httpRequest);
    
    

    return ResponseEntity.ok(
          Map.of("mensaje","Pago rechazado" )
    );
}
    
    
    
    
    
    
    
    
    
    
}
