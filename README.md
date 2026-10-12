# RoadWatch AI PWA v2 — iPhone + Windows

## What works
- Live camera preview, TensorFlow.js COCO-SSD vehicle/traffic-light bounding boxes and simple object tracking.
- GPS speed/heading and GPS coordinate link to OpenStreetMap.
- **Experimental** red/amber/green estimation inside detected traffic-light boxes (not validated for driving decisions).
- Optional experimental screen-motion conflict alert, OFF by default. This is **not** wrong-way violation detection.
- Local photo snapshots, JSON event export, audio beep opt-in.
- PWA manifest and a service worker caching the app shell. AI model libraries still need internet on first use and may not be available offline.

## Windows deployment (free)
1. Extract the ZIP and open `RoadWatch_PWA_v2` in VS Code.
2. Create a public GitHub repository, e.g. `roadwatch-pwa`, and upload the **contents** of this folder to its root.
3. GitHub repository Settings → Pages → Deploy from a branch → `main` / root. Wait for the HTTPS URL.
4. On iPhone, open the HTTPS URL in Safari; Share → Add to Home Screen.
5. Open the app, tap Start live camera, allow camera/location permissions, and optionally enable audio.
6. Test **while parked**, or use a passenger to operate it. Do not interact with the phone while driving.

## Limitations and privacy
- No confirmed wrong-way detection, no verified one-way restrictions, no map matching, no traffic-law reasoning, and no automatic video recording.
- GPS accuracy varies, camera must remain foreground on iOS, and lighting/motion can cause false alerts.
- Video inference runs in the browser; snapshots download to the phone only on request. Third-party model libraries are loaded from jsDelivr; map link opens OpenStreetMap. Hosting providers may log web requests.
- This is a research/demo prototype, not a safety-certified system. Never use it as the sole basis for a driving decision.
- iPhone Safari generally requires HTTPS for camera and geolocation.
