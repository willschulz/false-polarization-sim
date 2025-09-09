## Deployment Notes

This project is a static web visualization (HTML/CSS/JS) with an optional tiny Python HTTP server for local development. It can be deployed on any static hosting provider or served via a minimal container or a systemd-managed service.

### Prerequisites
- Git
- A recent browser (Chrome/Firefox/Safari/Edge)
- Optional: Python 3.9+ (for the provided `server.py` dev server)

### Repository Layout (relevant files)
- `index.html` – entry point
- `assets/` – JS/CSS
- `server.py` – simple local server (runs on port 8080 by default)
- `README.md` – project overview

---

## Common Deployment Options

### 1) Static Hosting (recommended)
Use any static host (GitHub Pages, Netlify, Vercel static export, S3+CloudFront, Firebase Hosting, etc.).

Steps:
1. Ensure the following are present in the root directory: `index.html`, `assets/`.
2. Upload or point the host to the repository root.
3. Configure the host to serve `index.html` at `/`.

Notes:
- No server-side code is required at runtime.
- Add appropriate cache headers for `assets/` (e.g., long TTL) and a shorter TTL for `index.html`.

### 2) Minimal Python HTTP server (VM/bare metal)
For a lightweight single-node setup where you control the box.

Run:
```bash
python3 server.py
# or
python3 -m http.server 8080
```

Then reverse-proxy via Nginx/Caddy if exposing publicly:
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3) Docker container
Wrap a tiny static server in a container for portability.

Example `Dockerfile` (using `nginx:alpine`):
```Dockerfile
FROM nginx:alpine
COPY ./index.html /usr/share/nginx/html/index.html
COPY ./assets /usr/share/nginx/html/assets
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1
```

Build & run:
```bash
docker build -t false-polarization-sim:latest .
docker run -d --name fpsim -p 8080:80 false-polarization-sim:latest
```

### 4) Systemd service (serving via Python)
If you prefer not to containerize and want auto-restart.

`/etc/systemd/system/false-polarization-sim.service`:
```ini
[Unit]
Description=False Polarization Visualization (Python http.server)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/false-polarization-sim
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=on-failure
RestartSec=3
User=www-data
Group=www-data
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now false-polarization-sim
```

---

## TLS
Terminate TLS at your reverse proxy or hosting provider. For Nginx on a VM, use certbot:
```bash
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -n --agree-tos -m admin@example.com
```

---

## Memory & Reliability Guardrails

Although the app is static, browsers or Node-based preview servers can leak memory if an animation runs indefinitely, or if the host is resource-constrained. Use both in-app and OS-level controls.

### A) In-App Safeguards (JS)
Apply these patterns inside `assets/js/` modules:

1. Use a single animation loop and cancel it on tab hide.
```js
let animationFrameId = null;

function draw() {
  // draw frame
  animationFrameId = requestAnimationFrame(draw);
}

function start() {
  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(draw);
  }
}

function stop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop(); else start();
});
```

2. Bound auto-sampling rate and queue sizes.
```js
const MAX_PARTICLES = 5000;           // cap objects
const MAX_HISTORY_POINTS = 2000;      // cap arrays
const AUTO_SAMPLE_INTERVAL_MS = 50;   // throttle

const items = [];
function addItem(item) {
  if (items.length >= MAX_PARTICLES) items.shift();
  items.push(item);
}

let history = [];
function pushHistory(point) {
  history.push(point);
  if (history.length > MAX_HISTORY_POINTS) {
    history = history.slice(-MAX_HISTORY_POINTS);
  }
}
```

3. Avoid setInterval leaks; use a self-scheduling loop that can stop.
```js
let autoSampling = false;
let autoTimer = null;

function scheduleAutoSample() {
  if (!autoSampling) return;
  autoTimer = setTimeout(() => {
    sampleOnce();
    scheduleAutoSample();
  }, AUTO_SAMPLE_INTERVAL_MS);
}

function startAuto() {
  if (autoSampling) return;
  autoSampling = true;
  scheduleAutoSample();
}

function stopAuto() {
  autoSampling = false;
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
}
```

4. Clean up on navigation/unload to free canvas and listeners.
```js
window.addEventListener('beforeunload', () => {
  stop();
  stopAuto();
  // remove listeners, null out large arrays/objects
});
```

5. Optional: fps-based back-pressure to reduce work under load.
```js
let lastFrameTs = performance.now();
let targetMs = 1000 / 60; // 60 fps

function draw() {
  const now = performance.now();
  const elapsed = now - lastFrameTs;
  if (elapsed >= targetMs) {
    lastFrameTs = now;
    renderFrame();
  }
  animationFrameId = requestAnimationFrame(draw);
}
```

### B) Operational Controls

1. cgroup memory limits (Docker):
```bash
docker run -d --name fpsim \
  --memory="256m" --memory-swap="256m" \
  -p 8080:80 false-polarization-sim:latest
```

2. Systemd resource limits (non-container):
Add to the service unit:
```ini
MemoryMax=256M
TasksMax=512
```

3. Reverse proxy hardening:
- Enable gzip/brotli.
- Set `keepalive_timeout 15;` and reasonable `client_max_body_size`.

4. Watchdog and auto-restart:
- Use `Restart=on-failure` (systemd) or healthchecks in Docker.

5. Instrumentation (optional):
- Add a simple `/healthz` that returns 200 to support healthchecks.

---

## Zero-Downtime Updates
- For static hosting: upload new assets under content-hashed paths and update `index.html`.
- For Docker: build a new image, start a new container, then swap (blue/green or rolling).
- For systemd + Python: restart the service during a low-traffic window.

---

## Rollback
- Keep previous container image or previous static build as an artifact.
- Re-deploy the prior version by tag or by restoring the last known-good files.


