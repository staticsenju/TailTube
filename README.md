# TailTube

A lightweight browser extension and Node.js backend that beams YouTube videos from your local machine directly to a headless home server running MPV. It routes securely over Tailscale, featuring real-time two-way synchronization, full-screen overlay controls, and hardware-optimized playback.

## Features

* **One-Click Beaming:** Instantly transfer YouTube playback to your server.
* **Two-Way Sync:** Stopping the stream on the server automatically resumes playback in your browser at the exact second you left off.
* **Native Keyboard Shortcuts:** Automatically hijacks YouTube's native shortcuts (`Space`, `J`, `L`, `K`, `M`, `Arrow Keys`) and routes them to the server while beaming.
* **Headless Optimization:** Forces lightweight H.264 (avc1) codec fetching and aggressive RAM caching to prevent buffer underruns on low-power CPUs without dedicated GPUs.
* **Quality Control:** Select between Best, 1080p, 720p, and 480p on the fly without losing your timestamp.

## Architecture

TailTube works by running a small Express listener on your home server that executes `mpv` commands via an Inter-Process Communication (IPC) socket. The browser extension injects a content script into YouTube that sends HTTP POST requests directly to the server's Tailscale IP.

## Prerequisites

* **Node.js** and **npm** installed on the server.
* **mpv** and **yt-dlp** installed on the server.
* **Tailscale** installed on both your local machine and your home server.

---

## 1. Tailscale Setup

Tailscale creates a secure, flat mesh network between your devices. Install Tailscale on your server and authenticate.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

```

Retrieve your server's Tailscale IPv4 address. You will need this for the next steps.

```bash
tailscale ip -4

```

---

## 2. Server Setup

First, ensure `mpv` and the latest version of `yt-dlp` are installed on your server.

```bash
sudo apt update
sudo apt install mpv
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

```

Clone the repository to your home server. Since this machine only acts as the backend listener, you can remove the extension folder entirely.

```bash
git clone https://github.com/staticsenju/TailTube.git
cd TailTube
rm -rf extension
cd server
npm install

```

**Configuration:**

1. Open `server.js`.
2. Update the `tIP` IP address at the top of the file (e.g., `10.x.x.x`) to match your server's Tailscale IP.

**Run the Server:**
Start the server using PM2 to keep it running continuously in the background.

```bash
npm install -g pm2
pm2 start server.js --name "tailtube"
pm2 save
pm2 startup

```

---

## 3. Extension Setup (Local Machine)

On your local computer, clone the repository and remove the server folder.

```bash
git clone https://github.com/staticsenju/TailTube.git
cd TailTube
rm -rf server
cd extension

```

**Configuration (Crucial Step):**
You must update the IP address in **two** files within the `extension` folder:

1. **`content.js`**: Update the `SERVER` constant at the very top (e.g., `const SERVER = 'http://x.x.x.x:3000';`) to match your home server's Tailscale IP.
2. **`manifest.json`**: Find the `host_permissions` line and change the IP address to match your Tailscale IP:
`"host_permissions": ["http://x.x.x.x:3000/*"]`

**Loading the Extension into Chrome/Chromium:**

1. Open your browser and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on in the top right corner.
3. Click **Load unpacked** in the top left.
4. Select the `extension` folder you just modified.

---

## Usage

1. Open any YouTube video in your browser.
2. An overlay menu will appear in the bottom right corner of the window.
3. Select your desired streaming quality.
4. Click **Beam Video**.
5. Your local video will pause, the screen will dim, and playback will instantly begin on your home server.
6. Use the on-screen controls or your keyboard shortcuts (Space, J, L, K, M, etc.) to control the server instance.
7. Click **Stop & Sync** to kill the server stream and automatically resume playback in your local browser.
