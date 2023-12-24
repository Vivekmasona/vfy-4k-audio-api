const fs = require('fs');
const ytdl = require('ytdl-core');
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
    let filename = `${title}.mp4`;

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-disposition': contentDisposition(filename),
    });

    const video = ytdl(URL, { quality: 'highestvideo' });
    const fileStream = fs.createWriteStream(filename);

    video.pipe(res); // Stream the video to the client
    video.pipe(fileStream); // Save the video file locally

    fileStream.on('finish', () => {
      console.log('Video file saved locally:', filename);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error downloading video');
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

