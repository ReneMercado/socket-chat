const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios')
const usuarios = new Usuarios();

const { crearMensaje } = require('../utils/utils');
io.on('connection', (client) => {

    console.log('Usuario conectado');
    client.on('entrarChat', (data, callback) => {
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/la sala es necesario'
            });
        }

        //unirlo a una sala
        client.join(data.sala);

        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala);


        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));

        callback(usuarios.getPersonasPorSala(data.sala));
    });


    client.on('crearMensaje', (data) => {

        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

    });

    io.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));

    });

    client.on('mensajePrivado', (data) => {
        let persona = usuarios.getPersona(client.id);

        //FALTA VALIDAR QUE SIEMPRE VENGA DATA
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    })
});

