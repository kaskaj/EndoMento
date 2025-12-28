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
let brush_length_main = 1.5;
let brush_length_sub = 1.2;
let brush_weight = 5;
let brush_vibration = 1;

// Brush angles
let angle_start = 90;
let angle_end = -90;

// Area / field settings
let area_density = 0.005;        // main area noise scale
let angle_density = 0.01;        // main field noise scale
let sub_vs_main_density = 2.0;   // multiplier for sub areas vs main
let sub_vs_main_angle = 2.0;     // multiplier for sub field vs main


// Draw toggles
let show_tiles = false;
let show_main_areas = true;
let show_sub_areas = true;

// Areas
let main_areas;
let sub_areas;

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
  brush.field("myfield1");
  brush.field("myfield2");
  brush_field("myfield1", angle_density, angle_start, angle_end);
  brush_field("myfield2", angle_density * sub_vs_main_angle, angle_start, angle_end);
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
    main_areas = area_gen(width, height, 0, area_density);

    // Generate sub areas
    sub_areas = area_gen(width, height, 0, area_density * sub_vs_main_density);

    let area;
    let sub_area;
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
        if (main_areas[int(x * tile_width)][int(y * tile_width)] == 1) { area = 1; }
        else if (main_areas[int(x * tile_width)][int(y * tile_width)] == 2) { area = 2; }
        else if (main_areas[int(x * tile_width)][int(y * tile_width)] == 3) { area = 3; }
        else { area = 0; }

        // Detect sub areas
        if (sub_areas[int(x * tile_width)][int(y * tile_width)] == 1) { sub_area = 1; }
        else if (sub_areas[int(x * tile_width)][int(y * tile_width)] == 2) { sub_area = 2; }
        else if (sub_areas[int(x * tile_width)][int(y * tile_width)] == 3) { sub_area = 3; }
        else { sub_area = 0; }

        // Draw main areas
        if (show_main_areas) {
          if (area == 1) { brush.stroke(color_low); brush.pick("b1"); }
          else if (area == 2) { brush.stroke(color_high); brush.pick("b2"); }
          else if (area == 3) { brush.stroke(color_high); brush.pick("b1"); }
          else { brush.stroke(bg_color); brush.pick("b2"); }

          brush.field("myfield1");
          brush.flowLine(start_x - tile_width, start_y, brush_length_main * tile_width, 0);
        }

        // Draw sub areas
        if (show_sub_areas) {
          if (sub_area == 1) { brush.stroke(color_high); brush.pick("b2"); }
          else if (sub_area == 2) { brush.stroke(color_high); brush.pick("b1"); }
          else if (sub_area == 3) { brush.stroke(color_low); brush.pick("b2"); }
          else { brush.stroke(bg_color); brush.pick("b1"); }

          brush.field("myfield2");
          let brush_length = random(0.5, 2) * brush_length_sub;
          brush.flowLine(start_x - tile_width, start_y, brush_length * tile_width, 0);
        }
      }
    }
}

function applyParams(params = {}) {
  if (typeof params.tiles === "number") {
    tiles = params.tiles;
  }
  if (typeof params.brushLengthMain === "number") {
    brush_length_main = params.brushLengthMain;
  }
  if (typeof params.brushLengthSub === "number") {
    brush_length_sub = params.brushLengthSub;
  }
  if (typeof params.brushWeight === "number") {
    brush_weight = params.brushWeight;
  }
  if (typeof params.areaDensity === "number") {
    area_density = params.areaDensity;
  }
  if (typeof params.angleDensity === "number") {
    angle_density = params.angleDensity;
  }
  if (typeof params.subVsMainDensity === "number") {
    sub_vs_main_density = params.subVsMainDensity;
  }
  if (typeof params.subVsMainAngle === "number") {
    sub_vs_main_angle = params.subVsMainAngle;
  }
  if (typeof params.showTiles === "boolean") {
    show_tiles = params.showTiles;
  }
  if (typeof params.showMainAreas === "boolean") {
    show_main_areas = params.showMainAreas;
  }
  if (typeof params.showSubAreas === "boolean") {
    show_sub_areas = params.showSubAreas;
  }
  configureBrushes();
  initializeBrushFields();
}

function refreshSketch(params = {}) {
  applyParams(params);
  generateSketch();
}

function regenerateSketch(params = {}) {
  applyParams(params);
  reseedNoise();
  generateSketch();
}

// Expose refresh for controls
window.refreshSketch = refreshSketch;
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
