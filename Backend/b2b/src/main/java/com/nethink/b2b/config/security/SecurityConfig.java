package com.nethink.b2b.config.security;

import com.nethink.b2b.util.AppConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/auth/**",
                                "/files/**",
                                "/files",
                                "/api/certificaciones",
                                "/api/usuarios/register",
                                "/api/provider/register",
                                "/api/solicitudes/proveedor/*/metodos-pago",
                                "/api/suscripciones/**"
                                
                        ).permitAll()
                        .requestMatchers("/api/evaluaciones/")
                        .hasRole(AppConstants.ROLE_CLIENTE)
                        .requestMatchers("/api/config/**")
                        .hasRole(AppConstants.ROLE_ADMIN)
                        .requestMatchers("/api/logs/admin")
                        .hasRole(AppConstants.ROLE_ADMIN)
                        .requestMatchers("/api/seguridad/admin/**")
                        .hasRole(AppConstants.ROLE_ADMIN)
                        .requestMatchers(
                                "/api/usuarios/admin/**",
                                "/api/provider/admin/**",
                                "/api/productos/admin/**",
                                "/api/solicitudes/admin/**"
                        )
                        .hasRole(AppConstants.ROLE_ADMIN)
                        .requestMatchers("/api/solicitudes/proveedor/**")
                        .hasRole(AppConstants.ROLE_PROVEEDOR)


                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:4200","https://proyectoinnovacion-1.onrender.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
