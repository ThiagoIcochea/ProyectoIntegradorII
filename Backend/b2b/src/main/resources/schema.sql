-- Cambia el enum/longitud antigua que producia "Data truncated" al registrar cancelaciones.
ALTER TABLE reclamos MODIFY COLUMN tipo VARCHAR(16) NOT NULL;
ALTER TABLE productos MODIFY COLUMN fuente VARCHAR(32) NULL;

CREATE TABLE IF NOT EXISTS bloqueos_seguridad (
    id_bloqueo BIGINT NOT NULL AUTO_INCREMENT,
    tipo VARCHAR(10) NOT NULL,
    identificador VARCHAR(255) NOT NULL,
    bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
    intentos_fallidos INT NOT NULL DEFAULT 0,
    motivo VARCHAR(500) NULL,
    fecha_bloqueo DATETIME NULL,
    ultimo_intento DATETIME NULL,
    PRIMARY KEY (id_bloqueo),
    UNIQUE KEY uk_bloqueo_tipo_identificador (tipo, identificador)
);
