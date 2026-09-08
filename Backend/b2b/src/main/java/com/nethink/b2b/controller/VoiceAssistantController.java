package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.VoiceAssistantRequest;
import com.nethink.b2b.dto.response.VoiceAssistantResponse;
import com.nethink.b2b.service.VoiceAssistantService;
import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
public class VoiceAssistantController {

    private final VoiceAssistantService service;

    public VoiceAssistantController(VoiceAssistantService service) {
        this.service = service;
    }

    @PostMapping("/voice")
    public VoiceAssistantResponse voice(@RequestBody VoiceAssistantRequest request, Principal principal) {
        return service.respond(principal.getName(), request.getText(), request.getCurrentPath());
    }

    @PostMapping("/provider-insights")
    public Map<String, String> providerInsights(@RequestBody Map<String, Object> stats, Principal principal) {
        return service.providerInsights(principal.getName(), stats);
    }
}
