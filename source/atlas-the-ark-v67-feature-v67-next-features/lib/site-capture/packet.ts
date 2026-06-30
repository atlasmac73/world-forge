/**
 * ATLAS v67 — Site Capture packet types
 * The schema a future iOS "ATLAS Site Capture" SDK conforms to, plus the
 * normalized EXIF shape we extract server-side from existing photos.
 * See 07_PLANS/8_SITE_CAPTURE_MEASUREMENT_PLAN.md.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

/** Level-1: metadata already inside a normal photo (EXIF/XMP). */
export interface ParsedExif {
  latitude?: number
  longitude?: number
  altitude_m?: number
  captured_at?: string        // ISO
  camera_model?: string
  lens_model?: string
  focal_length_mm?: number
  image_width?: number
  image_height?: number
  orientation?: number
  raw: Record<string, unknown>
}

/** Level-2: full sensor packet captured at shutter time by the SDK. */
export interface CapturePacket {
  timestamp: string
  gps_latitude?: number
  gps_longitude?: number
  gps_altitude?: number
  horizontal_accuracy?: number
  vertical_accuracy?: number
  true_heading?: number
  magnetic_heading?: number
  heading_accuracy?: number
  pitch?: number
  roll?: number
  yaw?: number
  gravity_vector?: [number, number, number]
  user_acceleration?: [number, number, number]
  rotation_rate?: [number, number, number]
  focal_length_mm?: number
  focal_length_px?: number
  camera_intrinsics?: number[]        // 3x3 row-major
  principal_point?: [number, number]
  lens_position?: number
  sensor_size_mm?: [number, number]
  image_width?: number
  image_height?: number
  orientation?: number
  ar_camera_transform?: number[]      // 4x4 row-major
  ar_tracking_state?: string
  depth_available?: boolean
  depth_type?: 'lidar' | 'disparity' | 'none'
  barometric_relative_altitude?: number
  device_model?: string
  os_version?: string
  manual_scale_reference?: string
  known_object_markers?: Array<{ label: string; pixels?: number; known_size_m?: number }>
  notes?: string
}
