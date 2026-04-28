/* Importing the express module and creating an instance of it. */
const express = require('express')
const app = express.Router()
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const auth = require('../middlewares/authorization')
const db = require('../config/db')


//////////////////////////////////////////
//                fecha                 //
//////////////////////////////////////////

app.get('/obtener/:id', async (req, res) => {
    try {
        let fechaId = req.params.id;
        let query = `SELECT * FROM fecha WHERE id=${fechaId}`;
        let venta = await db.pool.query(query);

        res.status(200).json(venta[0]);

    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error obteniendo los datos', error: true, details: error })
    }
})

app.get('/obtenerbytour/:id', async (req, res) => {
    try {
        let tourId = req.params.id;
        let query = `SELECT * FROM fecha WHERE tour_id=${tourId}`;
        let venta = await db.pool.query(query);

        res.status(200).json(venta[0]);

    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error obteniendo los datos', error: true, details: error })
    }
})


app.post('/crear', async (req, res) => {
    try {
        const { dia, hora_salida, hora_regreso, tour_id, max_personas } = req.body
        let status = req.body.status;
        let apply_for_operator = req.body.apply_for_operator;

        let errors = Array();

        if (!dia) {
            errors.push({ msg: "El campo dia debe de contener un valor" });
        }
        if (!hora_salida) {
            errors.push({ msg: "El campo hora_salida debe de contener un valor" });
        }
        if (!hora_regreso) {
            errors.push({ msg: "El campo hora_regreso debe de contener un valor" });
        }
        if (!status) {
            status = 1;
        }
        if (!apply_for_operator) {
            apply_for_operator = 0;
        }

        if (!tour_id) {
            errors.push({ msg: "El campo tour_id debe de contener un valor" });
        }

        if (typeof max_personas !== 'undefined' && max_personas !== null && max_personas !== '') {
            const mp = parseInt(max_personas, 10);
            if (isNaN(mp) || mp < 0) {
                errors.push({ msg: "El campo max_personas debe ser un entero mayor o igual a 0 o vacío para heredar" });
            }
        }

        if (errors.length >= 1) {

            return res.status(400)
                .json({
                    msg: 'Errores en los parametros',
                    error: true,
                    details: errors
                });

        }

        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
        let fecha = date + ' ' + time;

        const maxPersonasSQL = (typeof max_personas === 'undefined' || max_personas === null || max_personas === '') ? 'NULL' : `${parseInt(max_personas, 10)}`;

        let query = `INSERT INTO fecha 
                (dia, hora_salida, hora_regreso, status, applyForOperator, created_at, updated_at, tour_id, max_personas) 
                VALUES 
                ('${dia}', '${hora_salida}', '${hora_regreso}', '${status}', '${apply_for_operator}', '${fecha}', '${fecha}', '${tour_id}', ${maxPersonasSQL})`;

        let result = await db.pool.query(query);
        result = result[0];

        const payload = {
            venta: {
                id: result.insertId,
            }
        }

        jwt.sign(payload, process.env.SECRET, { expiresIn: 36000 }, (error, token) => {
            if (error) throw error
            res.status(200).json({ error: false, token: token })
            //res.json(respuestaDB)
        })

    } catch (error) {
        res.status(400).json({ error: true, details: error })
    }
})

app.put('/set', async (req, res) => {
    try {
        const { id, dia, hora_salida, hora_regreso, max_personas } = req.body
        let status = req.body.status;
        let apply_for_operator = req.body.apply_for_operator;

        let errors = Array();

        // validar id como entero
        const idNum = parseInt(id, 10);
        if (isNaN(idNum)) {
            errors.push({ msg: "El campo id debe ser un entero válido" });
        }

        if (!dia) {
            errors.push({ msg: "El campo dia debe de contener un valor" });
        }
        if (!hora_salida) {
            errors.push({ msg: "El campo hora_salida debe de contener un valor" });
        }
        if (!hora_regreso) {
            errors.push({ msg: "El campo hora_regreso debe de contener un valor" });
        }
        if (!status) {
            status = 1;
        }
        if (!apply_for_operator) {
            apply_for_operator = 0;
        }

        if (typeof max_personas !== 'undefined' && max_personas !== null && max_personas !== '') {
            const mp = parseInt(max_personas, 10);
            if (isNaN(mp) || mp < 0) {
                errors.push({ msg: "El campo max_personas debe ser un entero mayor o igual a 0 o vacío para heredar" });
            }
        }

        if (errors.length >= 1) {

            return res.status(400)
                .json({
                    msg: 'Errores en los parametros',
                    error: true,
                    details: errors
                });

        }

        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
        let fecha = date + ' ' + time;

        const maxPersonasSQL = (typeof max_personas === 'undefined' || max_personas === null || max_personas === '') ? 'NULL' : `${parseInt(max_personas, 10)}`;

        let query = `UPDATE fecha SET
                dia              = '${dia}',
                hora_salida      = '${hora_salida}',
                hora_regreso     = '${hora_regreso}', 
                status           = '${status}', 
                applyForOperator = '${apply_for_operator}', 
                max_personas     = ${maxPersonasSQL},
                updated_at       = '${fecha}' 
                WHERE id         =  ${id}`;

        let result = await db.pool.query(query);
        result = result[0];

        const payload = {
            venta: {
                id: result.insertId,
            }
        }

        res.status(200).json({ error: false, msg: "Registro actualizado con exito" })

    } catch (error) {
        console.error(error); // <-- esto te lo muestra en la consola

        res.status(400).json({
            error: true,
            message: error.message,
            stack: error.stack
        });
    }
})

app.put('/delete/:id', async (req, res) => {
    try {
        let salidaId = req.params.id;

        let query = `DELETE FROM fecha WHERE id = ${salidaId}`;

        let result = await db.pool.query(query);
        result = result[0];

        res.status(200).json({ error: false, msg: "Se ha borrado la fecha de salida con exito" })

    } catch (error) {
        res.status(400).json({ error: true, details: error })
    }
})

app.put('/active', async (req, res) => {
    try {
        let fechaId = req.body.id;

        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
        let fecha = date + ' ' + time;

        let query = `UPDATE fecha SET
                        status     = 1,
                        updated_at = '${fecha}' 
                        WHERE id   = ${fechaId}`;

        let result = await db.pool.query(query);
        result = result[0];

        res.status(200).json({ error: false, msg: "Se ha reactivado la venta con exito" })

    } catch (error) {
        res.status(400).json({ error: true, details: error })
    }
})

module.exports = app
