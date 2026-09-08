package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RegistrarEvaluacionRequest;
import com.nethink.b2b.dto.response.EvaluacionResponse;
import com.nethink.b2b.service.EvaluacionService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluaciones")
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    public EvaluacionController(
            EvaluacionService evaluacionService) {

        this.evaluacionService = evaluacionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluacionResponse registrar(

            @Valid
            @RequestBody
            RegistrarEvaluacionRequest request, Principal principal){

        return evaluacionService
                .registrarEvaluacion(request, principal.getName());
    }

}