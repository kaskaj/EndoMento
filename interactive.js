// Canvas
let canv_size = 800;
let pixel_density = 2;

// Tiles
let tiles = 100;
let tile_width;

// Color Section limits
let sec_high = 0.65;
let sec_low = 0.4;

// Colors
let bg_color = "#fff9daff";
let color_high = "#ff1b37";
let color_low = "#ff33d2";

// Brush settings
let brush_length_base = 1.5;
let brush_length_range = 2;
let brush_length_top_multiplier = 0.8;
let brush_weight = 5;
let brush_vibration = 1;

// Brush angles
let angle_start = 90;
let angle_end = -90;

// Area / field settings
let color_noise_scale = 0.005;          // bottom layer color noise scale
let angle_noise_scale = 0.01;           // bottom layer angle noise scale
let brush_length_noise_scale = 0.005;   // bottom layer brush length noise scale
let color_noise_multiplier = 2.0;       // top layer noise scale multiplier
let angle_noise_multiplier = 2.0;       // top layer noise scale multiplier

// Draw toggles
let show_tiles = false;
let show_bottom_layer = true;
let show_top_layer = true;

// Area maps
let bottom_layer_map;
let top_layer_map;
let brush_length_map;

// Progressive rendering state
let render_queue = [];
let render_index = 0;
let tiles_per_frame = 0;
let is_rendering = false;

function preload() {
  // Placeholder to ensure p5 runs this before setup
}

// Configure brushes
function configureBrushes() {
  brush.add("b1", {
    type: "standard",
    weight: brush_weight,
    vibration: brush_vibration,
    definition: 1, // 0 - 1
    quality: 1,
    opacity: 100,
    spacing: 0.1,
    blend: false,
    pressure: {
      type: "standard",
      curve: [0.15, 0.2],
      min_max: [0.9, 1.2]
    }
  });

  brush.add("b2", {
    type: "standard",
    weight: brush_weight,
    vibration: brush_vibration,
    definition: 1, // 0 - 1
    quality: 1,
    opacity: 100,
    spacing: 0.01,
    blend: false,
    pressure: {
      type: "standard",
      curve: [0.15, 0.2],
      min_max: [0.9, 1.2]
    }
  });
}

// Noise function
function noise_gen(x, y, t, noiseScale = 0.01) {
  return noise(noiseScale * x, noiseScale * y, noiseScale * t);
}

// Generate color areas
function area_gen(w, h, t, noiseScale) {
  const areas = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      // Generate noise
      let noise_raw = noise_gen(x, y, t, noiseScale);
      // Section noise
      if (noise_raw >= sec_high) { areas[x][y] = 2; }
      else if (noise_raw < sec_high && noise_raw > sec_low) { areas[x][y] = 1; }
      else { areas[x][y] = 0; }
    }
  }
  return areas;
}

// Generate brush length areas
function length_gen(w, h, t, noiseScale) {
  const lengths = Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      lengths[x][y] = noise_gen(x, y, t, noiseScale);
    }
  }
  return lengths;
}

// Get minimum and maximum brush length
function getBrushLengthBounds() {
  const base = Math.max(0, brush_length_base);
  const range = Math.max(1, brush_length_range);
  const min = base / range;
  const max = base * range;
  return { min, max };
}

// Generate brush field (angle areas)
function brush_field(name, noiseScale, angle_start, angle_end) {
  brush.addField(name, function (t, field) {
    const cols = field.length;
    const rows = field[0].length;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Generate noise
        let noise_raw = noise_gen(r, c, t, noiseScale)
        // Section noise
        field[c][r] = map(noise_raw, 0, 1, angle_start, angle_end)
      }
    }
    return field;
  });

}

// Render queue
function buildRenderQueue() {
  const queue = [];
  const { min: length_min, max: length_max } = getBrushLengthBounds();
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const start_x = random(x * tile_width, x * tile_width + tile_width);
      const start_y = random(y * tile_width, y * tile_width + tile_width);
      const bottom_area_value = bottom_layer_map[int(x * tile_width)][int(y * tile_width)];
      const top_area_value = top_layer_map[int(x * tile_width)][int(y * tile_width)];
      const length_noise_value = brush_length_map[int(x * tile_width)][int(y * tile_width)];
      queue.push({
        x,
        y,
        start_x,
        start_y,
        bottom_area_value,
        top_area_value,
        length_noise_value,
        length_min,
        length_max
      });
    }
  }
  return queue;
}

function drawTile(job) {
  const { x, y, start_x, start_y, bottom_area_value, top_area_value, length_noise_value, length_min, length_max } = job;
  const base_brush_length = Math.max(0, map(length_noise_value, 0, 1, length_min, length_max)) * tile_width;

  if (show_tiles) {
    push();
    noFill();
    stroke(220);
    strokeWeight(1);
    rect(x * tile_width, y * tile_width, tile_width, tile_width);
    pop();
  }

  if (show_bottom_layer) {
    if (bottom_area_value === 1) { brush.stroke(color_low); brush.pick("b1"); }
    else if (bottom_area_value === 2) { brush.stroke(color_high); brush.pick("b2"); }
    else { brush.stroke(bg_color); brush.pick("b2"); }

    brush.field("bottomFlowField");
    brush.flowLine(start_x - tile_width, start_y, base_brush_length, 0);
  }

  if (show_top_layer) {
    if (top_area_value === 1) { brush.stroke(color_high); brush.pick("b2"); }
    else if (top_area_value === 3) { brush.stroke(color_low); brush.pick("b1"); }
    else { brush.stroke(bg_color); brush.pick("b1"); }

    brush.field("topFlowField");
    const brush_length = base_brush_length * brush_length_top_multiplier;
    brush.flowLine(start_x - tile_width, start_y, brush_length, 0);
  }
}

// Initialize brush fields
function initializeBrushFields() {
  brush.field("bottomFlowField");
  brush.field("topFlowField");
  brush_field("bottomFlowField", angle_noise_scale, angle_start, angle_end);
  brush_field("topFlowField", angle_noise_scale * angle_noise_multiplier, angle_start, angle_end);
}

// Reseed noise (Generate)
function reseedNoise() {
  const seed = Math.floor(Math.random() * 1_000_000_000);
  noiseSeed(seed);
  randomSeed(seed + 1);
}

// Blank canvas (show before rendering)
function renderBlankCanvas() {
  resetMatrix();
  translate(-width / 2, -height / 2);
  background(bg_color);
}

function generateSketch() {

    resetMatrix();
    translate(-width / 2, -height / 2);
    background(bg_color);

    // Tile width
    tile_width = width / tiles;

    // Generate bottom areas
    bottom_layer_map = area_gen(width, height, 0, color_noise_scale);

    // Generate top areas
    top_layer_map = area_gen(width, height, 0, color_noise_scale * color_noise_multiplier);

    // Generate brush length area (shared across layers)
    brush_length_map = length_gen(width, height, 0, brush_length_noise_scale);

    // Prepare rendering queue to draw progressively
    render_queue = buildRenderQueue();
    render_index = 0;
    const total_tiles = render_queue.length;
    tiles_per_frame = Math.max(1, Math.floor(total_tiles / 80));
    is_rendering = true;
}

function applyParams(params = {}) {
  if (typeof params.tiles === "number") {
    tiles = params.tiles;
  }
  if (typeof params.pixelDensityValue === "number") {
    pixel_density = constrain(params.pixelDensityValue, 1, 4);
  }
  const hasNewBase = typeof params.brushLengthBase === "number";
  const hasNewRange = typeof params.brushLengthRange === "number";
  if (hasNewBase) {
    brush_length_base = params.brushLengthBase;
  }
  if (hasNewRange) {
    brush_length_range = params.brushLengthRange;
  }
  // Legacy min/max support: derive base and range if new values not provided
  if (!hasNewBase && !hasNewRange && typeof params.brushLengthMin === "number" && typeof params.brushLengthMax === "number") {
    const minVal = params.brushLengthMin;
    const maxVal = params.brushLengthMax;
    if (minVal > 0 && maxVal > 0) {
      brush_length_base = Math.sqrt(minVal * maxVal);
      brush_length_range = Math.max(1, maxVal / Math.max(minVal, 1e-6));
    }
  }
  brush_length_base = Math.max(0, brush_length_base);
  brush_length_range = Math.max(1, brush_length_range);
  if (typeof params.brushLengthTopMultiplier === "number") {
    brush_length_top_multiplier = params.brushLengthTopMultiplier;
  }
  if (typeof params.brushWeight === "number") {
    brush_weight = params.brushWeight;
  }
  if (typeof params.brushVibration === "number") {
    brush_vibration = params.brushVibration;
  }
  if (typeof params.areaNoiseScale === "number") {
    color_noise_scale = params.areaNoiseScale;
  }
  if (typeof params.angleNoiseScale === "number") {
    angle_noise_scale = params.angleNoiseScale;
  }
  if (typeof params.brushLengthNoiseScale === "number") {
    brush_length_noise_scale = params.brushLengthNoiseScale;
  }
  if (typeof params.areaNoiseMultiplier === "number") {
    color_noise_multiplier = params.areaNoiseMultiplier;
  }
  if (typeof params.angleNoiseMultiplier === "number") {
    angle_noise_multiplier = params.angleNoiseMultiplier;
  }
  if (typeof params.showTiles === "boolean") {
    show_tiles = params.showTiles;
  }
  if (typeof params.showBottomLayer === "boolean") {
    show_bottom_layer = params.showBottomLayer;
  }
  if (typeof params.showTopLayer === "boolean") {
    show_top_layer = params.showTopLayer;
  }
  if (typeof params.secHigh === "number") {
    sec_high = constrain(params.secHigh, 0.5, 1);
  }
  if (typeof params.secLow === "number") {
    sec_low = constrain(params.secLow, 0, 0.49);
  }
  configureBrushes();
  initializeBrushFields();
}

function regenerateSketch(params = {}) {
  applyParams(params);
  pixelDensity(pixel_density);
  reseedNoise();
  generateSketch();
}

// Expose regenerate for controls
window.regenerateSketch = regenerateSketch;

// Update layer visibility without changing the generated pattern
function updateVisibility(params = {}) {
  if (typeof params.showTiles === "boolean") {
    show_tiles = params.showTiles;
  }
  if (typeof params.showBottomLayer === "boolean") {
    show_bottom_layer = params.showBottomLayer;
  }
  if (typeof params.showTopLayer === "boolean") {
    show_top_layer = params.showTopLayer;
  }

  // Re-render the existing queue so the same pattern is shown with new visibility
  if (!render_queue || render_queue.length === 0) return;
  renderBlankCanvas();
  render_index = 0;
  tiles_per_frame = Math.max(1, Math.floor(render_queue.length / 80));
  is_rendering = true;
}

// Expose visibility update for controls
window.updateVisibility = updateVisibility;

function setup() {
  // Set canvas
  pixelDensity(pixel_density);
  window.canv = createCanvas(canv_size, canv_size, WEBGL);
  angleMode(DEGREES);
  renderBlankCanvas();
  configureBrushes();
  initializeBrushFields();
  reseedNoise();
  setTimeout(generateSketch, 0);
}


function draw() {
  resetMatrix();
  translate(-width / 2, -height / 2);

  if (!is_rendering || render_queue.length === 0) {
    return;
  }
  const remaining = render_queue.length - render_index;
  const batch = Math.min(tiles_per_frame, remaining);
  for (let i = 0; i < batch; i++) {
    drawTile(render_queue[render_index + i]);
  }
  render_index += batch;
  if (render_index >= render_queue.length) {
    is_rendering = false;
  }
}
