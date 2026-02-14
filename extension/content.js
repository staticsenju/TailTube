const SERVER = 'http://{TAILSCALE IP HERE}:3000';
let isBeaming = false;

const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100vw';
overlay.style.height = '100vh';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
overlay.style.color = '#fff';
overlay.style.zIndex = '10000';
overlay.style.display = 'none';
overlay.style.flexDirection = 'column';
overlay.style.alignItems = 'center';
overlay.style.justifyContent = 'center';
overlay.style.fontFamily = 'Roboto, Arial, sans-serif';

const overlayText = document.createElement('h1');
overlayText.innerText = 'Playing on Server';
overlayText.style.marginBottom = '20px';

const overlayQualitySelect = document.createElement('select');
overlayQualitySelect.style.padding = '8px';
overlayQualitySelect.style.borderRadius = '4px';
overlayQualitySelect.style.backgroundColor = '#333';
overlayQualitySelect.style.color = '#fff';
overlayQualitySelect.style.border = '1px solid #555';
overlayQualitySelect.style.marginBottom = '20px';
overlayQualitySelect.style.fontSize = '16px';

const options = [
  { value: 'best', text: 'Best Quality' },
  { value: '1080', text: '1080p Max' },
  { value: '720', text: '720p Max' },
  { value: '480', text: '480p Max' }
];

options.forEach(opt => {
  const option = document.createElement('option');
  option.value = opt.value;
  option.innerText = opt.text;
  overlayQualitySelect.appendChild(option);
});

const overlayControls = document.createElement('div');
overlayControls.style.display = 'flex';
overlayControls.style.gap = '16px';
overlayControls.style.marginBottom = '30px';
overlayControls.style.flexWrap = 'wrap';
overlayControls.style.justifyContent = 'center';

const createOverlayBtn = (text, onClick, isPrimary = false) => {
  const btn = document.createElement('button');
  btn.innerText = text;
  btn.style.padding = '12px 24px';
  btn.style.backgroundColor = isPrimary ? '#cc0000' : '#333';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '16px';
  btn.style.fontWeight = 'bold';
  btn.onmouseover = () => btn.style.backgroundColor = isPrimary ? '#ff0000' : '#555';
  btn.onmouseout = () => btn.style.backgroundColor = isPrimary ? '#cc0000' : '#333';
  btn.onclick = onClick;
  return btn;
};

const sendControl = (action) => {
  fetch(`${SERVER}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  }).catch(() => {});
};

const stopPlayback = async () => {
  stopBtn.innerText = 'Syncing...';
  try {
    const res = await fetch(`${SERVER}/stop-sync`);
    const data = await res.json();
    const video = document.querySelector('video');
    
    if (video && data.time > 0) {
      video.currentTime = data.time;
      video.play();
    }
  } catch (e) {
    sendControl('stop');
  }
  
  isBeaming = false;
  overlay.style.display = 'none';
  overlayText.innerText = 'Playing on Server';
  stopBtn.innerText = 'Stop & Sync';
};

const rwBtn = createOverlayBtn('<< 10s', () => sendControl('seek_backward'));
const playPauseBtn = createOverlayBtn('Play / Pause', () => sendControl('toggle_pause'));
const ffBtn = createOverlayBtn('10s >>', () => sendControl('seek_forward'));
const volDownBtn = createOverlayBtn('Vol -', () => sendControl('vol_down'));
const volUpBtn = createOverlayBtn('Vol +', () => sendControl('vol_up'));
const stopBtn = createOverlayBtn('Stop & Sync', stopPlayback, true);

overlayControls.appendChild(rwBtn);
overlayControls.appendChild(playPauseBtn);
overlayControls.appendChild(ffBtn);
overlayControls.appendChild(volDownBtn);
overlayControls.appendChild(volUpBtn);

const shortcutsInfo = document.createElement('div');
shortcutsInfo.style.marginTop = '40px';
shortcutsInfo.style.color = '#aaa';
shortcutsInfo.style.fontSize = '14px';
shortcutsInfo.style.lineHeight = '1.8';
shortcutsInfo.style.textAlign = 'center';
shortcutsInfo.innerHTML = `
  <strong>Keyboard Controls:</strong><br>
  <strong>Space / K</strong> : Play/Pause &nbsp;|&nbsp; 
  <strong>Left / J</strong> : Rewind 10s &nbsp;|&nbsp; 
  <strong>Right / L</strong> : Forward 10s <br>
  <strong>Up / + / =</strong> : Volume Up &nbsp;|&nbsp; 
  <strong>Down / -</strong> : Volume Down &nbsp;|&nbsp;
  <strong>M</strong> : Mute
`;

overlay.appendChild(overlayText);
overlay.appendChild(overlayQualitySelect);
overlay.appendChild(overlayControls);
overlay.appendChild(stopBtn);
overlay.appendChild(shortcutsInfo);
document.body.appendChild(overlay);

const container = document.createElement('div');
container.style.position = 'fixed';
container.style.bottom = '20px';
container.style.right = '20px';
container.style.backgroundColor = 'rgba(28, 28, 28, 0.9)';
container.style.color = '#fff';
container.style.padding = '12px';
container.style.borderRadius = '8px';
container.style.zIndex = '9999';
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.gap = '8px';
container.style.fontFamily = 'Roboto, Arial, sans-serif';
container.style.border = '1px solid #333';

const title = document.createElement('div');
title.innerText = 'TailTube';
title.style.fontWeight = 'bold';
title.style.fontSize = '14px';
title.style.textAlign = 'center';
title.style.marginBottom = '4px';

const qualitySelect = document.createElement('select');
qualitySelect.style.padding = '6px';
qualitySelect.style.borderRadius = '4px';
qualitySelect.style.backgroundColor = '#333';
qualitySelect.style.color = '#fff';
qualitySelect.style.border = '1px solid #555';

options.forEach(opt => {
  const option = document.createElement('option');
  option.value = opt.value;
  option.innerText = opt.text;
  qualitySelect.appendChild(option);
});

overlayQualitySelect.addEventListener('change', async (e) => {
  const newQuality = e.target.value;
  qualitySelect.value = newQuality;
  overlayText.innerText = 'Switching quality...';

  try {
    const res = await fetch(`${SERVER}/stop-sync`);
    const data = await res.json();
    const time = data.time || 0;
    const url = window.location.href;

    await fetch(`${SERVER}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, time, quality: newQuality })
    });
    overlayText.innerText = 'Playing on Server';
    document.activeElement.blur();
  } catch (err) {
    overlayText.innerText = 'Error switching quality';
  }
});

qualitySelect.addEventListener('change', (e) => {
  overlayQualitySelect.value = e.target.value;
});

const createSmallBtn = (text, onClick) => {
  const btn = document.createElement('button');
  btn.innerText = text;
  btn.style.padding = '8px';
  btn.style.backgroundColor = '#cc0000';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = 'bold';
  btn.onmouseover = () => btn.style.backgroundColor = '#ff0000';
  btn.onmouseout = () => btn.style.backgroundColor = '#cc0000';
  btn.onclick = onClick;
  return btn;
};

const beamBtn = createSmallBtn('Beam Video', () => {
  const video = document.querySelector('video');
  const time = video ? Math.floor(video.currentTime) : 0;
  const url = window.location.href;
  const quality = qualitySelect.value;
  
  if (url.includes('watch')) {
    if (video) {
      video.pause();
      video.blur();
    }
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    isBeaming = true;
    overlay.style.display = 'flex';
    fetch(`${SERVER}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, time, quality })
    }).catch(() => {});
  }
});

const keyHandler = (e) => {
  if (!isBeaming) return;
  
  const target = e.target.tagName.toLowerCase();
  if (target === 'input' || target === 'textarea' || target === 'select') return;

  const key = e.key;
  const targetKeys = [' ', 'k', 'K', 'ArrowUp', '+', '=', 'ArrowDown', '-', 'ArrowRight', 'l', 'L', 'ArrowLeft', 'j', 'J', 'm', 'M'];
  
  if (targetKeys.includes(key)) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (e.type === 'keydown') {
      if (key === ' ' || key === 'k' || key === 'K') {
        sendControl('toggle_pause');
      } else if (key === 'ArrowUp' || key === '+' || key === '=') {
        sendControl('vol_up');
      } else if (key === 'ArrowDown' || key === '-') {
        sendControl('vol_down');
      } else if (key === 'ArrowRight' || key === 'l' || key === 'L') {
        sendControl('seek_forward');
      } else if (key === 'ArrowLeft' || key === 'j' || key === 'J') {
        sendControl('seek_backward');
      } else if (key === 'm' || key === 'M') {
        sendControl('toggle_mute');
      }
    }
  }
};

window.addEventListener('keydown', keyHandler, true);
window.addEventListener('keyup', keyHandler, true);
window.addEventListener('keypress', keyHandler, true);

container.appendChild(title);
container.appendChild(qualitySelect);
container.appendChild(beamBtn);

document.body.appendChild(container);

let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    isBeaming = false;
    overlay.style.display = 'none';
    container.style.display = url.includes('watch') ? 'flex' : 'none';
  }
}).observe(document, {subtree: true, childList: true});

container.style.display = window.location.href.includes('watch') ? 'flex' : 'none';
