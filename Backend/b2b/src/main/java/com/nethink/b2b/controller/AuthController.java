package com.nethink.b2b.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.request.LoginRequest;
import com.nethink.b2b.dto.request.MfaChallengeRequest;
import com.nethink.b2b.dto.request.MfaVerifyRequest;
import com.nethink.b2b.dto.request.PasswordResetCompleteRequest;
import com.nethink.b2b.dto.request.RegisterClientRequest;
import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.response.MfaStartResponse;
import com.nethink.b2b.dto.response.MfaVerifyResponse;
import com.nethink.b2b.service.AuthService;
import com.nethink.b2b.service.MfaService;
import com.nethink.b2b.service.ProveedorService;
import com.nethink.b2b.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService service;

    @Autowired
    private MfaService mfaService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ProveedorService proveedorService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.nethink.b2b.service.SunatService sunatService;

    @GetMapping("/proveedor/ruc/{ruc}")
    public com.nethink.b2b.dto.response.SunatResponse consultarRucProveedor(@PathVariable String ruc) {
        return sunatService.consultarRucCompleto(ruc);
    }

    @PostMapping("/login")
    public MfaStartResponse login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return service.login(request.getCorreo(), request.getPassword(), httpRequest);
    }

    @PostMapping("/mfa/challenge")
    public MfaStartResponse challenge(@RequestBody MfaChallengeRequest request) {
        return mfaService.start(
                request.getEmail(),
                request.getPurpose(),
                request.getMethod(),
                null,
                false,
                null
        );
    }

    @PostMapping("/mfa/resend")
    public MfaStartResponse resend(@RequestBody MfaChallengeRequest request) {
        return mfaService.resend(request.getEmail(), request.getTempToken(), request.getMethod());
    }

    @PostMapping("/register-client/start")
    public MfaStartResponse startClientRegistration(@RequestBody RegisterClientRequest request) {
        return mfaService.start(
                request.getCorreo(),
                MfaService.PURPOSE_REGISTER_CLIENT,
                "email",
                "/login",
                true,
                request
        );
    }

    @PostMapping("/register-provider/start")
    public MfaStartResponse startProviderRegistration(@RequestBody RegisterProviderRequest request) {
        return mfaService.start(
                request.getCorreo(),
                MfaService.PURPOSE_REGISTER_PROVIDER,
                "email",
                "/login",
                true,
                request
        );
    }

    @PostMapping("/mfa/verify")
    public MfaVerifyResponse verify(@RequestBody MfaVerifyRequest request, HttpServletRequest httpRequest) {
        MfaService.Challenge challenge = mfaService.verifyChallenge(
                request.getEmail(),
                request.getTempToken(),
                request.getCode(),
                request.getPurpose()
        );

        MfaVerifyResponse response = new MfaVerifyResponse();
        response.setRedirectTo(challenge.redirectTo);
        response.setMessage("Verificacion MFA correcta");

        if (MfaService.PURPOSE_LOGIN.equals(challenge.purpose)) {
            response.setLogin(service.completeLogin(challenge.email, httpRequest));
            return response;
        }

        if (MfaService.PURPOSE_REGISTER_CLIENT.equals(challenge.purpose)) {
            usuarioService.registrarCliente(toPayload(challenge.payload, RegisterClientRequest.class), httpRequest);
            response.setLogin(service.completeLogin(challenge.email, httpRequest));
            response.setRedirectTo(response.getLogin().getRedirectTo());
            response.setMessage("Cliente registrado correctamente");
            return response;
        }

        if (MfaService.PURPOSE_REGISTER_PROVIDER.equals(challenge.purpose)) {
            proveedorService.registerProvider(toPayload(challenge.payload, RegisterProviderRequest.class), httpRequest);
            response.setLogin(service.completeLogin(challenge.email, httpRequest));
            response.setRedirectTo(response.getLogin().getRedirectTo());
            response.setMessage("Proveedor registrado correctamente");
            return response;
        }

        response.setMfaActionToken(mfaService.issueActionToken(challenge.email, challenge.purpose));
        return response;
    }

    @PostMapping("/forgot-password/start")
    public MfaStartResponse forgotPasswordStart(@RequestBody MfaChallengeRequest request) {
        return mfaService.start(
                request.getEmail(),
                MfaService.PURPOSE_PASSWORD_RESET,
                request.getMethod(),
                null,
                false,
                null
        );
    }

    @PostMapping("/forgot-password/complete")
    public MfaVerifyResponse forgotPasswordComplete(
            @RequestBody PasswordResetCompleteRequest request,
            HttpServletRequest httpRequest
    ) {
        mfaService.consumeActionToken(
                request.getMfaActionToken(),
                request.getEmail(),
                MfaService.PURPOSE_PASSWORD_RESET
        );
        usuarioService.completarResetPassword(request);

        MfaVerifyResponse response = new MfaVerifyResponse();
        response.setMessage("Contrasena actualizada correctamente");
        response.setLogin(service.completeLogin(request.getEmail(), httpRequest));
        return response;
    }

    private <T> T toPayload(Object payload, Class<T> targetClass) {
        if (payload == null) {
            throw new RuntimeException("No se encontro la informacion del registro. Inicia el registro nuevamente.");
        }

        return objectMapper.convertValue(payload, targetClass);
    }
}
