package com.nethink.b2b.controller;

import com.nethink.b2b.entity.LogsSistema;
import com.nethink.b2b.repository.LogsSistemaRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
public class LogsSistemaController {

    @Autowired
    private LogsSistemaRepository logsRepository;

    @GetMapping("/admin")
    public List<LogsSistema> listarLogs() {

        return logsRepository.findAllByOrderByFechaDesc();
    }
}