# RoadWatch AI v4 — iPhone PWA

## Features
- Live camera + TensorFlow.js COCO-SSD detection (downloads from CDNs).
- Improved (still approximate) frame-to-frame object tracking.
- GPS diagnostics with retry after permission denial.
- **Opt-in** OpenStreetMap one-way direction check for the phone's **own** movement, using Overpass nearby road geometry.
- Traffic-light color estimation, experimental screen-motion alerts, event JSON export, snapshots.

## Deploy from Windows
Extract the ZIP. Upload **all files inside** this folder to the root of your GitHub `AI-ROAD-WATCH` repository, replacing the old versions. GitHub Pages: Settings → Pages → Deploy from main / (root). Reload Safari or remove/re-add Home Screen shortcut if it caches the old app.

## GPS/map test
Open the HTTPS site on your iPhone, tap Test GPS, grant precise location permission, then opt in to Enable road lookup. Look at road name, centerline distance, one-way flag, and diagnostic status. If the Overpass endpoint is rate-limited or offline, road lookup will be unavailable while camera detection continues.

## Limitations and safety
This is not a driving safety device. Test while parked or with a passenger. GPS map matching is approximate and can choose the wrong road near junctions or parallel carriageways. A map-direction conflict is not proof of a violation. The app **cannot detect another driver's legal wrong-way travel**. Do not use it to make driving decisions. Road lookup transmits approximate location to a public Overpass server when explicitly enabled. No location is transmitted to the app developer by this code. Camera frames are processed in-browser, with third-party AI libraries loaded from CDNs. No video recording or server-side upload.

## Developer notes
The public Overpass API is community-operated, subject to rate limits, and is not a production-grade map service. Map results depend on OSM tagging and may be missing or outdated. Camera motion is not compensated. Safari must remain foregrounded for continuous camera use. Requires HTTPS for camera/GPS.
