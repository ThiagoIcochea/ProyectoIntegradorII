package com.nethink.b2b.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import com.nethink.b2b.service.LoginSecurityService;
import io.jsonwebtoken.Claims;






@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginSecurityService loginSecurityService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

    
    //System.out.println("=== ENTRA JWT FILTER ===");
//System.out.println("URI: " + request.getRequestURI());
    
    String path = request.getRequestURI();

    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
        filterChain.doFilter(request, response);
        return;
    }

    try {
        loginSecurityService.validarIp(loginSecurityService.obtenerIp(request));
    } catch (ResponseStatusException ex) {
        response.setStatus(ex.getStatusCode().value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("X-Blocked-By", "security");
        response.getWriter().write(String.format("{\"status\":%d,\"message\":\"%s\"}", ex.getStatusCode().value(), ex.getReason()));
        return;
    }

    if (path.startsWith("/files/")) {
        filterChain.doFilter(request, response);
        return;
    }

    // Mantener la validacion de IP, pero no exigir ni validar JWT en esta consulta publica.
    if ("GET".equals(request.getMethod()) && path.matches("/api/auth/proveedor/ruc/[0-9]{11}")) {
        filterChain.doFilter(request, response);
        return;
    }

    String authHeader = request.getHeader("Authorization");

    if (authHeader != null && authHeader.startsWith("Bearer ")) {

        String token = authHeader.substring(7);

        try {
            if (!jwtUtil.isTokenValid(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            //var claims = jwtUtil.parseToken(token);

//String correo = claims.getSubject();
//String rol = claims.get("rol", String.class);
 
//System.out.println("=== JWT DEBUG ===");
//System.out.println("CORREO: " + correo);
//System.out.println("ROL: " + rol);



            String correo = jwtUtil.extractCorreo(token);
            String rol = jwtUtil.extractRol(token);
            String rolNormalizado = String.valueOf(rol == null ? "" : rol)
                    .trim()
                    .toUpperCase()
                    .replaceFirst("^ROLE_", "");

            List<GrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority("ROLE_" + rolNormalizado));
            
            
            System.out.println("AUTHORITIES: " + authorities);
            
            

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(correo, null, authorities);
            
            
System.out.println("AUTH SETEADO CORRECTAMENTE");
System.out.println("IS AUTHENTICATED: " + auth.isAuthenticated());
            

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception e) {
            
            System.out.println("❌ ERROR JWT: " + e.getMessage());
            
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
    }

    filterChain.doFilter(request, response);
}
}
