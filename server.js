// LÍNEAS BÁSICAS DE EXPRESS.JS
const express = require('express');
const app = express();

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Actividad 3 por Pedro De León.');
})

const PUERTO=3000;

app.listen(PUERTO,()=>{
    console.log(`El servidor está funcionando en el puerto ${PUERTO}`);
});

// RUTAS 
app.get('/tareas',(req,res)=>{
})
app.post('/tareas',(req,res)=>{
})
app.put('/tareas/',(req,res)=>{
})
app.delete('/tareas/',(req,res)=>{
})