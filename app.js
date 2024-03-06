const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/compress', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const format = req.body.format;
  const outputPath = `compressed-${Date.now()}.${format}`;

  ffmpeg(inputPath)
    .output(outputPath)
    .on('end', function () {
      res.download(outputPath, outputPath, (err) => {
        if (err) {
          console.error("Error during download", err);
        }
        // Intenta eliminar los archivos después de la respuesta ha sido enviada completamente
        cleanUpFiles([inputPath, outputPath]);
      });
    })
    .on('error', function (err) {
      console.log('Error: ' + err.message);
      cleanUpFiles([inputPath, outputPath]); // Asegúrate de limpiar incluso si hay un error
      res.sendStatus(500);
    })
    .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

function cleanUpFiles(paths) {
  paths.forEach(path => {
    fs.unlink(path, (err) => {
      if (err) console.error(`Error al eliminar ${path}`, err);
      else console.log(`${path} fue eliminado correctamente.`);
    });
  });
}