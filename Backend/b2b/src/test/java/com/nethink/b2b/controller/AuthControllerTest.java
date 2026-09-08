package com.nethink.b2b.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.request.MfaVerifyRequest;
import com.nethink.b2b.dto.request.RegisterClientRequest;
import com.nethink.b2b.dto.response.LoginResponse;
import com.nethink.b2b.service.AuthService;
import com.nethink.b2b.service.MfaService;
import com.nethink.b2b.service.ProveedorService;
import com.nethink.b2b.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthService authService;
    @Mock private MfaService mfaService;
    @Mock private UsuarioService usuarioService;
    @Mock private ProveedorService proveedorService;
    @Mock private ObjectMapper objectMapper;
    @Mock private HttpServletRequest httpRequest;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController();
        ReflectionTestUtils.setField(controller, "service", authService);
        ReflectionTestUtils.setField(controller, "mfaService", mfaService);
        ReflectionTestUtils.setField(controller, "usuarioService", usuarioService);
        ReflectionTestUtils.setField(controller, "proveedorService", proveedorService);
        ReflectionTestUtils.setField(controller, "objectMapper", objectMapper);
    }

    @Test
    void clientRegistrationVerificationReturnsSessionAndAccountRedirect() {
        RegisterClientRequest payload = new RegisterClientRequest();
        MfaService.Challenge challenge = new MfaService.Challenge();
        challenge.email = "cliente@test.com";
        challenge.purpose = MfaService.PURPOSE_REGISTER_CLIENT;
        challenge.payload = payload;
        challenge.redirectTo = "/login";

        MfaVerifyRequest request = new MfaVerifyRequest();
        request.setEmail(challenge.email);
        request.setTempToken("temp-token");
        request.setCode("123456");
        request.setPurpose(challenge.purpose);

        LoginResponse login = new LoginResponse("jwt", challenge.email, 5, "CLIENTE");
        login.setRedirectTo("/app/dashboard");

        when(mfaService.verifyChallenge(
                challenge.email,
                "temp-token",
                "123456",
                challenge.purpose
        )).thenReturn(challenge);
        when(objectMapper.convertValue(payload, RegisterClientRequest.class)).thenReturn(payload);
        when(authService.completeLogin(challenge.email, httpRequest)).thenReturn(login);

        var response = controller.verify(request, httpRequest);

        verify(usuarioService).registrarCliente(payload, httpRequest);
        assertSame(login, response.getLogin());
        assertEquals("/app/dashboard", response.getRedirectTo());
    }
}
