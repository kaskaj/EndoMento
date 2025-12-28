// Canvas
let canv;
let canv_size = 800;

// Tiles
let tiles = 100;
let tile_width;

// Section limits
let sec_high = 0.65;
let sec_mid = 0.45;
let sec_low = 0.28;

// Colors
let bg_color = "#fff9daff";
let color_high = "#ff1b37";
let color_low = "#ff33d2";

// Brush settings
let brush_length_bottom = 1.5;
let brush_length_top_multiplier = 0.8;
let brush_weight = 5;
let brush_vibration = 1;

// Brush angles
let angle_start = 90;
let angle_end = -90;

// Area / field settings
let base_area_density = 0.005;          // bottom area noise scale
let base_angle_density = 0.01;          // bottom field noise scale
let top_vs_bottom_density = 2.0;        // multiplier for top areas vs bottom
let top_vs_bottom_angle = 2.0;          // multiplier for top field vs bottom


// Draw toggles
let show_tiles = false;
let show_bottom_areas = true;
let show_top_areas = true;

// Areas
let bottom_areas;
let top_areas;

function preload() {
  // Placeholder to ensure p5 runs this before setup; useful if assets are added.
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

// Generate area
function area_gen(w, h, t, noiseScale) {
  const areas = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      // Generate noise
      let noise_raw = noise_gen(x, y, t, noiseScale);
      // Section noise
      if (noise_raw >= sec_high) { areas[x][y] = 3; }
      else if (noise_raw < sec_high && noise_raw > sec_mid) { areas[x][y] = 2; }
      else if (noise_raw <= sec_mid && noise_raw > sec_low) { areas[x][y] = 1; }
      else { areas[x][y] = 0; }
    }
  }
  return areas;
}

// Generate brush field
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

// Initialize brush fields
function initializeBrushFields() {
  brush.field("bottomField");
  brush.field("topField");
  brush_field("bottomField", base_angle_density, angle_start, angle_end);
  brush_field("topField", base_angle_density * top_vs_bottom_angle, angle_start, angle_end);
}

function reseedNoise() {
  const seed = Math.floor(Math.random() * 1_000_000_000);
  noiseSeed(seed);
  randomSeed(seed + 1);
}

// Blank canvas
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

    // Generate main areas
    bottom_areas = area_gen(width, height, 0, base_area_density);

    // Generate sub areas
    top_areas = area_gen(width, height, 0, base_area_density * top_vs_bottom_density);

    let bottom_area;
    let top_area;
    for (let y = 0; y < tiles; y++) {
      for (let x = 0; x < tiles; x++) {

        // Select random position
        let start_x = random(x * tile_width, x * tile_width + tile_width);
        let start_y = random(y * tile_width, y * tile_width + tile_width);

        // Draw tiles
        if (show_tiles) {
          push();
          noFill();
          stroke(220);
          strokeWeight(1);
          rect(x * tile_width, y * tile_width, tile_width, tile_width);
          pop();
        }

        // Detect main areas
        if (bottom_areas[int(x * tile_width)][int(y * tile_width)] == 1) { bottom_area = 1; }
        else if (bottom_areas[int(x * tile_width)][int(y * tile_width)] == 2) { bottom_area = 2; }
        else if (bottom_areas[int(x * tile_width)][int(y * tile_width)] == 3) { bottom_area = 3; }
        else { bottom_area = 0; }

        // Detect sub areas
        if (top_areas[int(x * tile_width)][int(y * tile_width)] == 1) { top_area = 1; }
        else if (top_areas[int(x * tile_width)][int(y * tile_width)] == 2) { top_area = 2; }
        else if (top_areas[int(x * tile_width)][int(y * tile_width)] == 3) { top_area = 3; }
        else { top_area = 0; }

        // Draw main areas
        if (show_bottom_areas) {
          if (bottom_area == 1) { brush.stroke(color_low); brush.pick("b1"); }
          else if (bottom_area == 2) { brush.stroke(color_high); brush.pick("b2"); }
          else if (bottom_area == 3) { brush.stroke(color_high); brush.pick("b1"); }
          else { brush.stroke(bg_color); brush.pick("b2"); }

          brush.field("bottomField");
          brush.flowLine(start_x - tile_width, start_y, brush_length_bottom * tile_width, 0);
        }

        // Draw sub areas
        if (show_top_areas) {
          if (top_area == 1) { brush.stroke(color_high); brush.pick("b2"); }
          else if (top_area == 2) { brush.stroke(color_high); brush.pick("b1"); }
          else if (top_area == 3) { brush.stroke(color_low); brush.pick("b2"); }
          else { brush.stroke(bg_color); brush.pick("b1"); }

          brush.field("topField");
          let brush_length = random(0.5, 2) * brush_length_bottom * brush_length_top_multiplier;
          brush.flowLine(start_x - tile_width, start_y, brush_length * tile_width, 0);
        }
      }
    }
}

function applyParams(params = {}) {
  if (typeof params.tiles === "number") {
    tiles = params.tiles;
  }
  if (typeof params.brushLengthBottom === "number") {
    brush_length_bottom = params.brushLengthBottom;
  }
  if (typeof params.brushLengthTopMultiplier === "number") {
    brush_length_top_multiplier = params.brushLengthTopMultiplier;
  }
  if (typeof params.brushWeight === "number") {
    brush_weight = params.brushWeight;
  }
  if (typeof params.areaDensityBase === "number") {
    base_area_density = params.areaDensityBase;
  }
  if (typeof params.angleDensityBase === "number") {
    base_angle_density = params.angleDensityBase;
  }
  if (typeof params.topVsBottomDensity === "number") {
    top_vs_bottom_density = params.topVsBottomDensity;
  }
  if (typeof params.topVsBottomAngle === "number") {
    top_vs_bottom_angle = params.topVsBottomAngle;
  }
  if (typeof params.showTiles === "boolean") {
    show_tiles = params.showTiles;
  }
  if (typeof params.showBottomAreas === "boolean") {
    show_bottom_areas = params.showBottomAreas;
  }
  if (typeof params.showTopAreas === "boolean") {
    show_top_areas = params.showTopAreas;
  }
  configureBrushes();
  initializeBrushFields();
}

function regenerateSketch(params = {}) {
  applyParams(params);
  reseedNoise();
  generateSketch();
}

// Expose regenerate for controls
window.regenerateSketch = regenerateSketch;

function setup() {
  // Set canvas
  canv = createCanvas(canv_size, canv_size, WEBGL);
  pixelDensity(2), angleMode(DEGREES);
  renderBlankCanvas();
  configureBrushes();
  initializeBrushFields();
  reseedNoise();
  setTimeout(generateSketch, 0);
  // saveFrames(canv, "endo.png");
}


function draw() {
}
