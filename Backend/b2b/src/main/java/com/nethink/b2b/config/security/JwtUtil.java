package com.nethink.b2b.config.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import java.nio.charset.StandardCharsets;

import io.jsonwebtoken.Claims;


@Component
public class JwtUtil {

@Value("${jwt.secret}")
private String SECRET;

@Value("${jwt.expiration}")
private long EXPIRATION;
  
private SecretKey key;
@PostConstruct
public void init() {
    key = Keys.hmacShaKeyFor(SECRET.getBytes());
}
public String generateToken(String correo, String rol) {
    return Jwts.builder()
            .subject(correo)
            .claim("rol", rol)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(key)
            .compact();
}


//public Claims parseToken(String token) {
 //   return Jwts.parser()
 //           .verifyWith(key)
 //           .build()
 //           .parseSignedClaims(token)
 //           .getPayload();
//}







public String extractCorreo(String token) {
    try {
       return Jwts.parser()
               .verifyWith(key)
                .build()
               .parseSignedClaims(token)
               .getPayload()
               .getSubject();
    } catch (Exception e) {
        throw new RuntimeException("Token inválido");
    }
}

public String extractRol(String token) {
    return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .get("rol", String.class);
}

public boolean isTokenValid(String token) {
   try {
        Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
        return true;
    } catch (ExpiredJwtException e) {
        throw new RuntimeException("Token expirado");
    } catch (JwtException e) {
        throw new RuntimeException("Token inválido");
    }
}









}