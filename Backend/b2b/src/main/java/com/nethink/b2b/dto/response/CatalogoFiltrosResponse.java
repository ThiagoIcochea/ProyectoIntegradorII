/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */


/**
 *
 * @author thico
 */
package com.nethink.b2b.dto.response;

import java.util.List;

public record CatalogoFiltrosResponse(
    List<FiltroItemDTO> categorias,
    List<FiltroItemDTO> marcas
) {}

