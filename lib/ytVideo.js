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
        title = title.replace(/[\'\\\/]/g,'');
        let filename = `${title}.mkv`;

        // Set the Content-Disposition header
        res.setHeader('Content-disposition', contentDisposition(filename));

        // Get audio and video streams
        const audio = ytdl(URL, { quality: 'highestaudio' });
        const video = ytdl(URL, { quality: 'highestvideo' });

        // Initialize video size
        let videoSizeInBytes = 0;

        // Track video size during download
        video.on('response', (res) => {
            videoSizeInBytes = parseInt(res.headers['content-length'], 10);
        });

        // Start the ffmpeg child process
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

        // Set the Content-Type header
        res.setHeader('Content-Type', 'video/x-matroska');

        // Pipe audio and video streams to ffmpeg
        audio.pipe(ffmpegProcess.stdio[3]);
        video.pipe(ffmpegProcess.stdio[4]);

        // Pipe ffmpeg output to the response
        ffmpegProcess.stdio[5].pipe(res);

        // Set the video duration in response headers
        res.setHeader('Content-Duration', info.videoDetails.lengthSeconds);

    } catch (err) {
        console.log(err);
    }
});

function fixURL(url){
    let fixed = 'https://youtube.com/watch?v=';
    if(url.startsWith('https://youtu.be/')){
        for(var i = 17; i < url.length; i++){
            if(url[i] == '?'){
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

