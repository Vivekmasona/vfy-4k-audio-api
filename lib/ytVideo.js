const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const spawn = require('child_process').spawn;
const contentDisposition = require('content-disposition');

var express = require('express');
var app = module.exports = express();

app.get('/4k', async (req, res) => {
  var URL = req.query.URL;
  URL = fixURL(URL);

  try {
    let info = await ytdl.getInfo(URL);
    var title = info.videoDetails.title;
    title = title.replace(/[\'\\\/]/g, '');
    let filename = `${title}.mkv`;

    res.writeHead(200, {
      'Content-Type': 'video/x-matroska',
      'Content-disposition': contentDisposition(filename),
      'Video-Length': info.videoDetails.lengthSeconds, // Add video length to response headers
    });

    const audio = ytdl(URL, { quality: 'highestaudio' });
    const video = ytdl(URL, { quality: 'highestvideo' });

    const ffmpegProcess = spawn(ffmpeg, [
      '-loglevel', '8', '-hide_banner',
      '-i', 'pipe:3',
      '-i', 'pipe:4',
      '-map', '0:a',
      '-map', '1:v',
      '-c:v', 'copy',
      '-f', 'matroska', 'pipe:5',
    ], {
      windowsHide: true,
      stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe'],
    });

    audio.pipe(ffmpegProcess.stdio[3]);
    video.pipe(ffmpegProcess.stdio[4]);
    ffmpegProcess.stdio[5].pipe(res);

  } catch (err) {
    console.log(err);
  }
});

function fixURL(url) {
  let fixed = 'https://youtube.com/watch?v';
  if (url.startsWith('https://youtu.be/')) {
    for (var i = 17; i < url.length; i++) {
      if (url[i] == '?') {
        break;
      }
      fixed = fixed + url[i];
    }
  } else {
    fixed = url;
  }
  console.log(fixed);
  return fixed;
}

