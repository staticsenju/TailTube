const express = require('express');
const { exec } = require('child_process');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SOCKET = '/tmp/mpvsocket';

const tIp = "YOUR_TAILSCALE_IP_HERE"; 

const sendCmd = (cmd) => {
  const client = net.createConnection(SOCKET);
  client.on('connect', () => {
    console.log(`[MPV CMD] Sending: ${cmd}`);
    client.write(JSON.stringify({ command: cmd }) + '\n');
    client.end();
  });
  client.on('error', (err) => {
    console.error(`[IPC ERROR] Failed to send command: ${err.message}`);
  });
};

const getFormat = (quality) => {
  const h = quality === 'best' ? '' : `[height<=?${quality}]`;
  return `bestvideo${h}[vcodec^=avc1]+bestaudio/bestvideo${h}+bestaudio/best`;
};

app.post('/play', (req, res) => {
  const { url, time, quality } = req.body;
  const cleanUrl = new URL(url).toString();
  const safeTime = Number(time) || 0;
  const formatStr = getFormat(quality || 'best');

  console.log(`[PLAY] Starting playback: ${cleanUrl} at ${safeTime}s (Quality: ${quality || 'best'})`);

  exec('killall mpv', () => {
    exec(`mpv "${cleanUrl}" --start=${safeTime} --ytdl-format="${formatStr}" --input-ipc-server=${SOCKET} --profile=fast --framedrop=vo --autosync=30 --cache=yes --demuxer-max-bytes=400M`, (error) => {
      if (error) console.error(`[MPV PROCESS ERROR] ${error.message}`);
      else console.log(`[MPV PROCESS] Exited cleanly.`);
    });
    res.send('Playing');
  });
});

app.post('/control', (req, res) => {
  const { action, time } = req.body;
  console.log(`[CONTROL] Received action: ${action}`);

  if (action === 'toggle_pause') sendCmd(['cycle', 'pause']);
  if (action === 'vol_up') sendCmd(['add', 'volume', 10]);
  if (action === 'vol_down') sendCmd(['add', 'volume', -10]);
  if (action === 'seek_forward') sendCmd(['seek', 10]);
  if (action === 'seek_backward') sendCmd(['seek', -10]);
  if (action === 'toggle_mute') sendCmd(['cycle', 'mute']);
  if (action === 'seek_to' && time !== undefined) sendCmd(['seek', Number(time), 'absolute']);

  res.send('Done');
});

app.get('/stop-sync', (req, res) => {
  console.log(`[SYNC] Stop and sync requested`);
  const client = net.createConnection(SOCKET);
  let buffer = '';

  client.on('connect', () => {
    client.write(JSON.stringify({ command: ['get_property', 'time-pos'] }) + '\n');
  });

  client.on('data', (data) => {
    buffer += data.toString();
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.data !== undefined) {
        console.log(`[SYNC] Captured timestamp: ${parsed.data}s`);
        client.end();
        exec('killall mpv', () => {});
        return res.json({ time: parsed.data });
      }
    } catch (e) {
      console.error(`[SYNC ERROR] Could not parse timestamp.`);
    }
  });

  client.on('error', (err) => {
    console.error(`[SYNC IPC ERROR] ${err.message}`);
    exec('killall mpv', () => {});
    res.json({ time: 0 });
  });
});

app.listen(3000, tIp, () => {
  console.log(`[SERVER] TailTube server listening on ${tIp}:3000`);
});
