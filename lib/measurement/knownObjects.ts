/**
 * ATLAS v67 — Known-object scale library
 * Standard real-world sizes (meters) + tolerance, used as scale anchors:
 * pixels of a recognized object → meters-per-pixel → measure anything else.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

export interface KnownObject {
  key: string
  label: string
  dimension: 'length' | 'width' | 'height' | 'diameter'
  size_m: number
  tolerance_m: number   // 1-σ real-world variation
}

export const KNOWN_OBJECTS: Record<string, KnownObject> = {
  us_license_plate:  { key: 'us_license_plate',  label: 'US license plate (width)', dimension: 'width',  size_m: 0.3048, tolerance_m: 0.002 },
  us_license_plate_h:{ key: 'us_license_plate_h',label: 'US license plate (height)',dimension: 'height', size_m: 0.1524, tolerance_m: 0.002 },
  letter_paper:      { key: 'letter_paper',      label: 'US Letter paper (11in)',   dimension: 'length', size_m: 0.2794, tolerance_m: 0.001 },
  quarter:           { key: 'quarter',           label: 'US quarter (diameter)',    dimension: 'diameter', size_m: 0.02426, tolerance_m: 0.0001 },
  credit_card:       { key: 'credit_card',       label: 'Credit card (length)',     dimension: 'length', size_m: 0.0856, tolerance_m: 0.0005 },
  brick_course:      { key: 'brick_course',      label: 'Brick course (modular)',   dimension: 'height', size_m: 0.0679, tolerance_m: 0.003 },
  cmu_block:         { key: 'cmu_block',         label: 'CMU block (length)',       dimension: 'length', size_m: 0.4064, tolerance_m: 0.004 },
  standard_door:     { key: 'standard_door',     label: 'Interior door (height)',   dimension: 'height', size_m: 2.032,  tolerance_m: 0.02 },
  door_width:        { key: 'door_width',        label: 'Interior door (width 36in)',dimension:'width', size_m: 0.9144, tolerance_m: 0.02 },
  garage_door_single:{ key: 'garage_door_single',label: 'Single garage door (16ft)',dimension: 'width',  size_m: 4.877,  tolerance_m: 0.1 },
  garage_door_height:{ key: 'garage_door_height',label: 'Garage door (height 7ft)', dimension: 'height', size_m: 2.134,  tolerance_m: 0.05 },
  stair_riser:       { key: 'stair_riser',       label: 'Stair riser (~7in)',       dimension: 'height', size_m: 0.1778, tolerance_m: 0.01 },
  two_by_four:       { key: 'two_by_four',       label: '2x4 (actual 3.5in)',       dimension: 'width',  size_m: 0.0889, tolerance_m: 0.002 },
  sidewalk_square:   { key: 'sidewalk_square',   label: 'Sidewalk square (~4ft)',   dimension: 'length', size_m: 1.2192, tolerance_m: 0.15 },
  parking_stall_w:   { key: 'parking_stall_w',   label: 'Parking stall (width 9ft)',dimension: 'width',  size_m: 2.7432, tolerance_m: 0.15 },
  parking_stall_l:   { key: 'parking_stall_l',   label: 'Parking stall (length 18ft)',dimension:'length',size_m: 5.4864, tolerance_m: 0.3 },
  outlet_plate:      { key: 'outlet_plate',      label: 'Outlet cover (height)',    dimension: 'height', size_m: 0.1143, tolerance_m: 0.003 },
  // Field-trial additions (pool/fence): precision references you'll have on site.
  four_ft_level:     { key: 'four_ft_level',     label: '4-ft level (48in)',        dimension: 'length', size_m: 1.2192, tolerance_m: 0.003 },
  two_ft_level:      { key: 'two_ft_level',      label: '2-ft level (24in)',        dimension: 'length', size_m: 0.6096, tolerance_m: 0.003 },
  tape_1ft_mark:     { key: 'tape_1ft_mark',     label: 'Tape measure 1-ft span',   dimension: 'length', size_m: 0.3048, tolerance_m: 0.002 },
  fence_panel_6ft:   { key: 'fence_panel_6ft',   label: 'Fence panel (6ft)',        dimension: 'width',  size_m: 1.8288, tolerance_m: 0.03 },
  fence_panel_8ft:   { key: 'fence_panel_8ft',   label: 'Fence panel (8ft)',        dimension: 'width',  size_m: 2.4384, tolerance_m: 0.03 },
  concrete_block_8in:{ key: 'concrete_block_8in',label: 'CMU block height (8in)',   dimension: 'height', size_m: 0.2032, tolerance_m: 0.004 },
}

export function getKnownObject(key: string): KnownObject | null {
  return KNOWN_OBJECTS[key] ?? null
}

export function listKnownObjects(): KnownObject[] {
  return Object.values(KNOWN_OBJECTS)
}
