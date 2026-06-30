# 8_SITE_CAPTURE_MEASUREMENT_PLAN

Status: PROPOSED — FUTURE_SCOPE (not in the MVP core loop; build only after owner approval)
Owner: Isaac Brandon Burdette · Atlas Genesis Matrix LLC

ATLAS Site Capture & Measurement Fusion — turn ordinary phone photos (plus any
sensor data a device can produce) into accurate, confidence-scored measurements
of a property: pool, pad, retaining wall, shed, house footprint, fence-post
layout, cracks, slopes. Fits ATLAS's investor/rehab/D4D workflow and reuses the
existing `satellite_imagery`, `drone_flights`, and county/parcel data.

> Governance note: this is a NEW large module. It does not touch the MVP core
> loop. Per CLAUDE.md §3/§10 it is documented here first and built in thin,
> owner-approved slices — not as a speculative big-bang.

---

## 1. Core thesis

Don't "measure from a photo." **Estimate one 3D site model from many noisy
constraints.** Every sensor reading, known object, tape measurement, satellite
tile, and parcel edge is a *constraint with an uncertainty (σ)*. A fusion solver
finds the geometry that best satisfies all of them at once and reports an error
bar on every dimension. Adding one tight constraint (e.g. "pool = 32 ft")
re-scales and tightens everything else through the shared geometry. That
"bounce back and forth" is just constraint propagation.

The fundamental unknown in monocular photos is **scale**. Most methods below
exist to inject metric scale or a geometric constraint; the solver reconciles
them and surfaces conflicts.

---

## 2. The Capture Packet (the unit of data)

Every shutter press produces a packet: the image + optional depth + a sidecar
JSON of time-synchronized sensor data.

```
capture_packet/
  image.heic
  depth.tiff|bin            # AVDepthData disparity (multi-lens) or LiDAR sceneDepth
  mesh.obj|usdz|ply         # ARKit ARMeshAnchor (LiDAR devices)
  packet.json               # everything below
```

`packet.json` fields:
```
timestamp, gps_latitude, gps_longitude, gps_altitude, horizontal_accuracy,
vertical_accuracy, true_heading, magnetic_heading, heading_accuracy,
pitch, roll, yaw, gravity_vector, user_acceleration, rotation_rate,
focal_length_mm, focal_length_px, camera_intrinsics (3x3), principal_point,
lens_position, sensor_size, image_width, image_height, orientation,
ar_camera_transform (4x4), ar_tracking_state, depth_available, depth_type,
barometric_relative_altitude, device_model, os_version,
manual_scale_reference, known_object_markers[], notes
```

iOS capture stack (one synchronized snapshot, single clock):
- AVFoundation `AVCapturePhoto` → EXIF, intrinsics, focal length, lensPosition
- `AVDepthData` → dual/triple-lens disparity depth (**no LiDAR needed**)
- ARKit `ARFrame` → `camera.transform`, `intrinsics`, `sceneDepth`, `ARMeshAnchor`
- CoreMotion `CMDeviceMotion` → gravity, attitude, userAcceleration, rotationRate
- CoreLocation `CLLocation` + `CLHeading` → coords, accuracy, true/magnetic heading
- CoreMotion `CMAltimeter` → barometric relative altitude

Store depth as an HEIC auxiliary image; everything else in the sidecar JSON.

---

## 3. Measurement methods (each = one constraint type)

1. **Solar shadow geometry** — GPS + timestamp → sun azimuth/elevation (NREL SPA /
   SunCalc, offline). Vertical height H = shadow_len · tan(elevation); known
   height reverses it to ground scale. Two times = shadow triangulation.
2. **Sun/sky as absolute compass** — detected sun azimuth vs computed → fix
   compass drift, lock true orientation for satellite alignment.
3. **Gravity vector → true vertical/horizontal** — rectify perspective, plumb
   lines, separate walls from pads, level the model.
4. **Vanishing points (Manhattan-world)** — parallel edges → focal length +
   orientation + per-plane homography → measure on a rectified "virtual top-down".
5. **Known-object priors** — DB of standard sizes + tolerances (brick course,
   CMU block, door, garage door, license plate, outlet, stair riser, 2x4,
   sidewalk square, parking stall, letter paper, quarter). Each = scale anchor.
6. **Course/joint counting** — count brick/block rows × known course height
   (robust to perspective; counting beats pixel-measuring).
7. **VIO walk baseline (non-LiDAR "tape")** — ARKit fuses camera+IMU; IMU gives
   absolute scale; walking turns parallax into metric depth; raycast to planes.
8. **GPS-displacement stereo** — two shots meters apart; GPS delta = metric
   baseline for large/far features (roofline, whole lot). RTK = survey-grade.
9. **Multi-lens native stereo** — fixed known baseline between wide/ultrawide/tele
   → disparity depth, no LiDAR, no walking.
10. **Barometric height** — pressure delta ground→top for wall/grade/floor height.
11. **Satellite GSD + parcel/GIS registration** — georeference photo footprint,
    align to satellite tiles (known ground-sample-distance) + parcel polygons
    (surveyed edge lengths ≈ ground truth). Uses ATLAS satellite/county data.
12. **Depth-from-defocus / focus distance** — lens focus position → coarse depth.
13. **Operator as a ruler** — store user height/shoe length once; any frame with
    them (or their shadow) is a calibrated scale stick.
+ **Cross-photo bundle adjustment** — solve all site photos in one global graph.

---

## 4. Fusion engine (the novelty)

Model the site as variables (3D points, plane dimensions, camera poses, one
global scale). Each method contributes a **factor** = (predicted − measured),
weighted by **1/σ²**:

| Source | typical σ |
|---|---|
| Tape measure | ±0.5 cm |
| LiDAR point | ±1 cm |
| Multi-lens stereo | ±2–5 cm |
| Known object | ±size tolerance |
| Shadow height | ±5–10 % |
| Consumer GPS edge | ±3 m (use reported horizontal_accuracy) |

Solve weighted least squares (factor graph; Ceres/g2o-style, or a lightweight
custom solver for v1). Outputs the most-probable geometry **plus an error bar per
dimension** and flags constraints whose residuals disagree ("low confidence —
re-measure"). The product is the confidence number:
`34.2 ft ± 0.3 ft (LiDAR + tape + 2 known objects)`.

---

## 5. Two user tiers, one pipeline

- **LiDAR devices:** mesh + AR pose enter as tight constraints; near-instant.
- **No-LiDAR devices:** VIO walk-baseline + multi-lens stereo + monocular-depth
  ML + known-object priors + vanishing-point rectification; satellite/parcel +
  GPS-stereo carry the large features. Same packet schema; solver re-weights.

---

## 6. Phased build (each phase shippable)

- **P0 — Spec (this doc).**
- **P1 — Packet schema + ingest, no app.** `site_captures` / `capture_assets` /
  `measurements` tables (with `confidence`, `source_provenance` jsonb). Ingest a
  ZIP of originals; parse EXIF server-side with a **JS lib (`exifr`)** — NOT
  ExifTool (Perl binary won't run on Vercel serverless). Owner/admin gated.
- **P2 — Fusion v1 (no-app methods).** `lib/measurement/`: sun-position,
  known-object, vanishing-point, satellite/parcel scale, + weighted-fusion core
  with uncertainty. Returns measurement + confidence from uploaded photos alone.
- **P3 — iOS "ATLAS Site Capture" SDK.** Three buttons: Capture Corner / Capture
  Measurement / Capture Scan. Writes the packet; ARKit VIO + LiDAR.
- **P4 — Bundle-adjustment solver.** Likely a **Python microservice** (COLMAP /
  OpenMVG+OpenMVS / Ceres) behind an internal API — not the Next.js runtime.

---

## 7. Open decisions / risks (resolve before P2→P4)

- **Heavy solving runtime:** TS-only is fine for P1–P2 (closed-form geometry).
  Bundle adjustment / SfM (P4) needs Python/native — decide microservice host.
- **EXIF on serverless:** use `exifr`/`exif-reader` (JS), confirmed no ExifTool.
- **Monocular-depth ML:** on-device CoreML vs server model — cost/latency.
- **Storage:** large originals + depth + mesh → Supabase Storage / S3, not DB.
- **Scope fence:** keep this founder/admin + pilot only until accuracy is
  validated against real tape measurements on a known site.

---

## 8. ATLAS mapping

- Tables: `site_captures`, `capture_assets`, `measurements` (RLS owner/admin;
  follow the live-DB `is_god_admin()` / profiles.user_id convention).
- Routes: `/api/site-capture` (ingest), `/api/site-capture/[id]/measure`.
- Libs: `lib/measurement/` (sun, known-object, vanishing-point, fusion core).
- Reuse: `satellite_imagery`, `drone_flights`, county/parcel data for method #11.
- UI: founder-only console (pattern: `/admin/research-arena`).

---

## 9. The three nested loops (how refinement actually happens)

1. **Estimate loop (per solve):** factor-graph / bundle-adjustment optimization —
   every constraint solved together → geometry + an error bar per dimension.
2. **Active-sensing loop (the standout feature):** after each solve, compute
   *information gain* — which single new capture would shrink uncertainty most —
   and instruct the user precisely: "shoot the far pool corner", "lay the tape on
   the north edge", "we need one oblique aerial". The app guides instead of
   passively recording. This is what turns a pile of photos into a confident drawing.
3. **Data-acquisition loop:** for the capture's lat/lon, auto-pull every external
   dataset (§11), register it, feed it back, re-solve; new data can trigger more.

Two trust principles:
- **Consensus across independent estimators** — agreement between unrelated
  methods (shadow vs LiDAR vs known-object) ⇒ high confidence; an outlier gets
  down-weighted and flagged "re-measure".
- **One anchor floods the graph** — any single metric truth (tape, parcel edge,
  fiducial) propagates scale to all linked geometry.

---

## 10. How competitor apps gather data (playbooks to replicate)

- **Roof apps (EagleView/Pictometry, Hover, Nearmap):** oblique aerial
  photogrammetry → 3D → segment roof planes → area + pitch (from 3D slope, shadow,
  or oblique foreshortening) + azimuth → sum facets. Hover specifically guides the
  user to shoot 8 overlapping ground photos → cloud SfM → textured 3D house model.
- **Tape-measure apps (no LiDAR):** ARKit VIO (camera+IMU) gives metric scale;
  user taps two world points on a detected plane.
- **DSM−DEM height:** Digital Surface Model minus bare-earth DEM = structure
  height; both free from USGS over much of the US.
- **Single-image metrology:** vanishing points + known reference + horizon line.
- **Satellite/stereo:** two views with known geometry → triangulate; satellite
  shadow length + sun angle → building height.
Replicate the cheap versions with free data; license commercial APIs for accuracy.

---

## 11. External data catalog (pull everything for a lat/lon)

**Free / government**
- USGS **3DEP** (1 m DEM + raw lidar point clouds), **NAIP** (~0.6–1 m aerial),
  The National Map, **EPQS** elevation point service (keyless), **OpenTopography**.
- USGS **Landsat**, ESA **Sentinel-2** (10 m, free).
- **County assessor / GIS** parcels (surveyed edge lengths, sqft, year built,
  stories) — strongest ground truth; state GIS clearinghouses aggregate.
- **Microsoft Building Footprints** + **OpenStreetMap** (free building polygons,
  some heights).
- **FEMA** flood, **Census TIGER/Line + Geocoder** (keyless), **NOAA/NWS**.
**Commercial (license for accuracy)**
- Google **Solar API → Building Insights** (roof area, pitch, azimuth), **Map
  Tiles photorealistic 3D mesh**, Aerial View, Street View; Bing/Azure; Mapbox.
- **Nearmap, EagleView, Vexcel, Maxar, Planet**; **Regrid/ReportAll** (parcels).
**Records:** deeds, **plats/recorded surveys** (exact dims), building permits, MLS.

---

## 12. Expanded method library (beyond §3's 13)

14. **Fiducial markers** (printed ArUco/AprilTag/checkerboard, exact size) →
    instant metric scale + 6-DoF pose. Most reliable cheap anchor.
15. **Horizon line + known camera height** → every ground pixel's distance is
    computable; one eye-height number becomes a full ground ruler.
16. **Satellite shadow photogrammetry** → building height from shadow length +
    sun angle in a single aerial image (works on free imagery).
17. **Multi-temporal imagery** → multiple shadow lengths over dates/times
    over-constrain height.
18. **Gravity-aided two-view geometry** → IMU rotation removes most SfM ambiguity.
19. **UWB (U1) / BLE / Wi-Fi RTT ranging** → drop a tag/anchor for a metric
    baseline without line-of-sight.
20. **Acoustic echo ranging** → chirp + echo timing to large flat surfaces.
21. **Rolling-shutter / motion-blur** → known exposure + IMU → motion scale.
22. **Depth-from-focus (focal stack)** → per-region depth from focus sweep.
23. **Reflection / water-line as a level datum** → known horizontal plane.
24. **Crowd / multi-session SfM** → fuse multiple visits/users into one solve.
25. **Standardized-object OCR** → license plates, signage, brick stamps as
    auto-detected exact-size anchors; EXIF `SubjectDistance` when present.

For each *new* candidate method, score it on three axes: (a) gives absolute
scale? (b) gives 3D/angle? (c) gives an independent cross-check? Any "yes" = add.

---

## 13. Output: photo(s) → architectural drawing

Pipeline: fused 3D model → plane/edge extraction (RANSAC plane fit + line
detection) → snap to right angles / parallels (Manhattan regularization) → 2D
vectorization → export **SVG / DXF / DWG / IFC / USDZ** with dimensioned lines and
per-dimension confidence. Layers: footprint, pad, pool, wall, fence posts, slopes,
cracks. Each dimension annotated `value ± σ (sources)`.

---

## 14. Self-learning: teaching ATLAS to measure

- **Ground-truth harness:** a handful of real sites measured by tape/total-station.
  Every method is scored against truth → learn each method's *real* σ per device,
  lighting, and distance. Without truth, confidence numbers are guesses.
- **Learned weights:** the fusion solver's per-source weights are tuned from the
  harness (and cross-validation: hold one constraint out, predict it, score).
- **Method tournaments:** reuse the AI Tournament engine to bake off *ensembles*
  of methods against ground truth and keep the winners (this is the tournament
  concept applied to measurement).
- **Research notebook mining:** load photogrammetry/SLAM/remote-sensing papers +
  competitor patents (EagleView/Hover/Nearmap) as notebook sources; ask grounded
  questions to surface new methods → add to §12. Closes the idea-generation loop.
- **Genesis tie-in:** new method proposals become blueprints in the autopoietic
  queue, human-approved before they enter the live ensemble.

---

## 15. Capabilities/infrastructure needed to go deep

- **Data-connector layer** — pluggable lat/lon fetchers (USGS/NAIP/parcel/Solar/
  Sentinel/…), normalized into the packet. Start keyless (EPQS, Census), gate keyed.
- **Geometry + ML stack** — Python microservice (COLMAP / OpenMVG+OpenMVS / OpenCV
  / a monocular-depth model) behind an internal API; Next.js orchestrates.
- **Fusion solver** — factor graph (Ceres / g2o / GTSAM) as the core.
- **Calibration/ground-truth harness** — to learn σ and validate.
- **Experiment loop** — run method ensembles vs truth, log accuracy, keep winners.
- **Object storage** — originals/depth/mesh in Supabase Storage / S3, not the DB.

---

## 16. Build status (P1+P2+connector landed)

Implemented in this slice (no app, no Python required):
- DB: `site_captures`, `capture_assets`, `measurements` (owner/admin RLS,
  `is_god_admin`/profiles convention, `(select auth.uid())` form).
- EXIF: server-side parse via `exifr` (JS — not ExifTool; serverless-safe).
- Fusion v1: `lib/measurement/` — solar position, known-object DB,
  vanishing-point estimator, and the weighted inverse-variance fusion core with
  conflict detection.
- Connectors: `lib/site-capture/connectors/` — USGS EPQS elevation + Census
  reverse-geocode (keyless); parcel provider gated behind a key.
- APIs: `/api/site-capture` (ingest+parse+enrich), `/api/site-capture/[id]/measure`
  (fusion), `/api/site-capture/enrich` (lat/lon data pull). Owner/admin gated.
- UI: `/admin/site-capture` founder console.
Still ahead: iOS capture SDK (P3), Python SfM/bundle-adjust microservice (P4),
object storage for raw assets, commercial connectors, ground-truth harness.
