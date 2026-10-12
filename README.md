# RoadWatch AI v3 — iPhone PWA

Upload **all files in this folder** into the root of your existing `AI-ROAD-WATCH` GitHub repository, replacing `index.html` and adding `app.js`, `manifest.webmanifest`, `sw.js`. Then open https://salartaimuri.github.io/AI-ROAD-WATCH/ and refresh. If an older version remains, close the Home Screen app and reopen or clear Safari website data.

## Changes
- Complete JavaScript implementation included (the earlier v2 package contained an HTML page referencing missing JS files).
- Live rear camera and TensorFlow.js COCO-SSD detection (requires internet to load CDN scripts and model).
- GPS permission request, diagnostic status, accuracy, speed, heading, coordinates, OpenStreetMap link.
- Approximate traffic-light color heuristic, camera snapshot, opt-in beep, local event JSON export.
- Optional experimental screen-motion conflict warnings (OFF by default). Not legal wrong-way detection.
- PWA manifest and service worker for the application shell.

## Testing
On iPhone Safari over HTTPS, tap Start live camera; then Test GPS. Allow location access in Settings > Privacy & Security > Location Services > Safari Websites. Test while parked. If location denied, use Settings to re-enable and reload.

## Limitations
- Not validated on physical iPhone hardware in this environment.
- Wrong-way legal direction detection, lane reasoning, navigation and validated signal-state recognition are NOT implemented.
- Object motion in moving camera footage can generate false alarms; keep experimental alerts OFF.
- No automatic video recording. Frames are processed locally; third-party CDN assets download over internet. Snapshot only saves when pressed.
- Camera requires foreground browser; GPS accuracy varies. This is not a certified safety system.
