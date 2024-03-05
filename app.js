// app.js

const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Configuración de Multer para la carga de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Configuración de Express y EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
  res.render('index');
});

// Ruta para subir videos
app.post('/upload', upload.single('video'), (req, res) => {
  // Comprimir el video usando FFMPEG
  const command = `ffmpeg -i - -vf scale=640:480 -c:v libx264 -preset medium -crf 23 -c:a aac -strict experimental -movflags +faststart -f mp4 -`;
  const ffmpegProcess = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
  });

  // Manejar cierre de la conexión de respuesta del cliente
  req.on('close', () => {
    console.log('La conexión se cerró prematuramente');
    ffmpegProcess.kill('SIGKILL'); // Finalizar proceso FFMPEG
  });

  // Configurar la respuesta HTTP para entregar el video comprimido
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename=compressed_video.mp4');
  ffmpegProcess.stdout.pipe(res);

  // Escribir el contenido del archivo en el proceso de FFMPEG
  ffmpegProcess.stdin.write(req.file.buffer);
  ffmpegProcess.stdin.end();
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
