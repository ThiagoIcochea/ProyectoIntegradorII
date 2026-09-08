package com.nethink.b2b.config.security;

import com.nethink.b2b.service.LoginSecurityService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import jakarta.servlet.FilterChain;
import static org.mockito.Mockito.*;

class JwtRucLookupTest {
    @Test
    void consultaPublicaNoDependeDelJwtPeroMantieneValidacionDeIp() throws Exception {
        var filter = new JwtFilter();
        var jwt = mock(JwtUtil.class);
        var security = mock(LoginSecurityService.class);
        ReflectionTestUtils.setField(filter, "jwtUtil", jwt);
        ReflectionTestUtils.setField(filter, "loginSecurityService", security);
        var request = new MockHttpServletRequest("GET", "/api/auth/proveedor/ruc/20291973851");
        request.addHeader("Authorization", "Bearer expired-token");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        when(security.obtenerIp(request)).thenReturn("127.0.0.1");
        filter.doFilter(request, response, chain);
        verify(security).validarIp("127.0.0.1");
        verifyNoInteractions(jwt);
        verify(chain).doFilter(request, response);
    }
}
