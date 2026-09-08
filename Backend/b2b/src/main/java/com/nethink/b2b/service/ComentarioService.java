package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.CrearComentarioRequest;
import com.nethink.b2b.dto.request.ReaccionComentarioRequest;
import com.nethink.b2b.dto.response.IAComentarioResponse;
import com.nethink.b2b.dto.response.ListarComentarioResponse;
import com.nethink.b2b.entity.Comentario;
import com.nethink.b2b.entity.ComentarioLike;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ComentarioLikeRepository;
import com.nethink.b2b.repository.ComentarioRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final ComentarioLikeRepository likeRepository;
     private final UsuarioRepository usuarioRepo;
    private final ModeracionService moderacionService;
    
         @Autowired
     
     private ProveedorProductoRepository proveedorProductoRepo;

    public ComentarioService(
            ComentarioRepository comentarioRepository,
            ComentarioLikeRepository likeRepository,
            UsuarioRepository usuarioRepo,
            ModeracionService moderacionService
    ) {
        this.comentarioRepository = comentarioRepository;
        this.likeRepository = likeRepository;
        this.moderacionService = moderacionService;
        this.usuarioRepo= usuarioRepo;
    }

    public Comentario crearComentario(
            CrearComentarioRequest request,
            Integer idUsuario
    ) {

         ProveedorProducto provProd = proveedorProductoRepo.findByProveedor_IdProveedorAndProducto_IdProducto(request.getIdProv(), request.getIdProd()).orElseThrow( () -> new RuntimeException("Proveedor producto no encontrado"));
        IAComentarioResponse ia =
                moderacionService.moderar(
                        request.getComentario()
                );

        if (!"OK".equalsIgnoreCase(
                ia.getEstado()
        )) {

            throw new RuntimeException(
                    "Comentario inapropiado"
            );
        }

        Comentario comentario =
                new Comentario();

        comentario.setIdProvProd(
              provProd.getIdProvProd()
        );

        comentario.setIdUsuario(idUsuario
               
        );

        comentario.setComentario(
                request.getComentario()
        );

        comentario.setFecha(
                LocalDateTime.now()
        );

        /*
          SENTIMIENTO:
          POSITIVO
          NEGATIVO
          NEUTRO
        */
        comentario.setTipo(
                ia.getSentimiento()
        );

        /*
          CACHE INICIAL
        */
        comentario.setLikes(0);
        comentario.setDislikes(0);

        return comentarioRepository.save(
                comentario
        );
    }

   public List<ListarComentarioResponse> listar(Integer idProvProd) {

    List<Comentario> comentarios = comentarioRepository
            .findByIdProvProdOrderByFechaDesc(idProvProd);

    return comentarios.stream().map(comentario -> {

        ListarComentarioResponse response = new ListarComentarioResponse();

        response.setIdComentario(comentario.getIdComentario());
        response.setIdProvProd(comentario.getIdProvProd());
        response.setIdUsuario(comentario.getIdUsuario());
         Optional<Usuario> user = usuarioRepo.findById(comentario.getIdUsuario());

    if (user.isPresent()) {

        response.setNombreUsuario(
            user.get().getNombres() + " " + user.get().getApellidos()
        );

    } else {

        response.setNombreUsuario("Usuario");

    }
        response.setComentario(comentario.getComentario());
        response.setTipo(comentario.getTipo());
        
        response.setLikes(comentario.getLikes());
        response.setDislikes(comentario.getDislikes());

        response.setFecha(comentario.getFecha());

        return response;

    }).toList();
}

    public void reaccionar(
            ReaccionComentarioRequest request,
            Integer idUsuario
    ) {

        Comentario comentario =
                comentarioRepository
                        .findById(
                                request.getIdComentario()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Comentario no encontrado"
                                )
                        );

        /*
          VALIDAR SOLO:
          LIKE / DISLIKE
        */
        if (
                !"LIKE".equalsIgnoreCase(
                        request.getTipo()
                )
                &&
                !"DISLIKE".equalsIgnoreCase(
                        request.getTipo()
                )
        ) {

            throw new RuntimeException(
                    "Tipo de reaccion invalido"
            );
        }

        ComentarioLike reaccionExistente =
                likeRepository
                        .findByIdComentarioAndIdUsuario(
                                request.getIdComentario(),
                                idUsuario
                        )
                        .orElse(null);

        /*
          UPDATE
        */
        if (reaccionExistente != null) {

            reaccionExistente.setTipo(
                    request.getTipo()
                            .toUpperCase()
            );

            likeRepository.save(
                    reaccionExistente
            );

        } else {

            /*
              INSERT
            */
            ComentarioLike like =
                    new ComentarioLike();

            like.setIdComentario(
                    request.getIdComentario()
            );

            like.setIdUsuario(idUsuario
                    
            );

            like.setTipo(
                    request.getTipo()
                            .toUpperCase()
            );

            likeRepository.save(
                    like
            );
        }

        /*
          RECALCULAR CACHE
        */
        int likes =
                likeRepository
                        .countByIdComentarioAndTipo(
                                comentario.getIdComentario(),
                                "LIKE"
                        );

        int dislikes =
                likeRepository
                        .countByIdComentarioAndTipo(
                                comentario.getIdComentario(),
                                "DISLIKE"
                        );

        comentario.setLikes(
                likes
        );

        comentario.setDislikes(
                dislikes
        );

        comentarioRepository.save(
                comentario
        );
    }
}