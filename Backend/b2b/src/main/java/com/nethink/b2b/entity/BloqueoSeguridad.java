package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bloqueos_seguridad", uniqueConstraints = @UniqueConstraint(columnNames = {"tipo", "identificador"}))
public class BloqueoSeguridad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_bloqueo")
    private Long idBloqueo;

    @Column(nullable = false, length = 10)
    private String tipo;

    @Column(nullable = false, length = 255)
    private String identificador;

    @Column(nullable = false)
    private boolean bloqueado;

    @Column(name = "intentos_fallidos", nullable = false)
    private int intentosFallidos;

    private String motivo;

    @Column(name = "fecha_bloqueo")
    private LocalDateTime fechaBloqueo;

    @Column(name = "ultimo_intento")
    private LocalDateTime ultimoIntento;

    public Long getIdBloqueo() { return idBloqueo; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getIdentificador() { return identificador; }
    public void setIdentificador(String identificador) { this.identificador = identificador; }
    public boolean isBloqueado() { return bloqueado; }
    public void setBloqueado(boolean bloqueado) { this.bloqueado = bloqueado; }
    public int getIntentosFallidos() { return intentosFallidos; }
    public void setIntentosFallidos(int intentosFallidos) { this.intentosFallidos = intentosFallidos; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public LocalDateTime getFechaBloqueo() { return fechaBloqueo; }
    public void setFechaBloqueo(LocalDateTime fechaBloqueo) { this.fechaBloqueo = fechaBloqueo; }
    public LocalDateTime getUltimoIntento() { return ultimoIntento; }
    public void setUltimoIntento(LocalDateTime ultimoIntento) { this.ultimoIntento = ultimoIntento; }
}
