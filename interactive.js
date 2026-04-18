// Canvas
let canvSize = 800;
let pixDensity = 2;

// Tiles
let tiles = 100;
let tileWidth;

// Noise section limits
let secH = 0.65;
let secL = 0.4;

// Colors
let colorBG = "#fff9daff";
let colorH = "#ff1b37";
let colorL = "#ff33d2";

// Brush settings
let brushLengthBase = 1.5;
let brushLengthRange = 2;
let brushLengthMulti = 0.8;
let brushWeight = 5;
let brushVibration = 1;

// Brush angles
let angleL = 90;
let angleH = -90;

// Perlin noise settings
let noiseScaleColor = 0.005;   
let noiseScaleAngle = 0.01; 
let noiseScaleLength = 0.005;
let noiseScaleColorMulti = 2.0;
let noiseScaleAngleMulti = 2.0;

// Draw toggles
let showLayerL = true;
let showLayerH = true;
let invMask = false;
let hideMask = false;

// Uploaded mask
let overlayIMG = null;
let tileMask = null;

// Perlin noise maps
let noiseMapColorL;
let noiseMapColorH;
let noiseMapColorLength;

// Rendering variables
let renderQueue = [];
let renderIndex = 0;
let tilesPerFrame = 0;
let isRendering = false;

// Expose for controls
window.regenerateSketch = regenerateSketch;
window.handleUploadedImage = handleUploadedImage;
window.updateVisibility = updateVisibility;

// Configure brushes
function configureBrushes() {
  brush.add("EndoBrush", {
    type: "standard",
    weight: brushWeight,
    vibration: brushVibration,
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
}

// Initialize brush fields
function initializeBrushFields() {
  brush.field("bottomFlowField");
  brush.field("topFlowField");
  genAngleMap("bottomFlowField", noiseScaleAngle, angleL, angleH);
  genAngleMap("topFlowField", noiseScaleAngle * noiseScaleAngleMulti, angleL, angleH);
}

// Get minimum and maximum brush length
function getBrushLengthBounds() {
  const base = Math.max(0, brushLengthBase);
  const range = Math.max(1, brushLengthRange);
  const min = base / range;
  const max = base * range;
  return { min, max };
}

// Noise function
function genNoise(x, y, t, noiseScale = 0.01) {
  return noise(noiseScale * x, noiseScale * y, noiseScale * t);
}

// Generate color map
function genMapColor(w, h, t, noiseScale) {
  const colors = Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      // Generate noise
      let noiseRaw = genNoise(x, y, t, noiseScale);
      // Section noise
      if (noiseRaw >= secH) { colors[x][y] = 2; }
      else if (noiseRaw < secH && noiseRaw > secL) { colors[x][y] = 1; }
      else { colors[x][y] = 0; }
    }
  }
  return colors;
}

// Generate brush length map
function genMapLength(w, h, t, noiseScale) {
  const lengths = Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      lengths[x][y] = genNoise(x, y, t, noiseScale);
    }
  }
  return lengths;
}

// Generate brush angle map
function genAngleMap(name, noiseScale, angleL, angleH) {
  brush.addField(name, function (t, field) {
    const cols = field.length;
    const rows = field[0].length;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Generate noise
        let noiseRaw = genNoise(r, c, t, noiseScale)
        // Section noise
        field[c][r] = map(noiseRaw, 0, 1, angleL, angleH)
      }
    }
    return field;
  });

}

// Build mask from BW image
function buildTileVisibilityMask() {
  if (!overlayIMG) return null;
  const mask = Array.from({ length: tiles }, () => Array.from({ length: tiles }, () => true));
  for (let x = 0; x < tiles; x++) {
    for (let y = 0; y < tiles; y++) {
      const cpx = overlayIMG.get(x * tileWidth, y * tileWidth);
      const b = map(brightness(cpx), 0, 100, 0, 1);
      mask[x][y] = b < 0.5;
    }
  }
  return mask;
}

// Handle uploaded image
function handleUploadedImage(src, doneCb) {
  loadImage(src, img => {
    overlayIMG = img;
    overlayIMG.resize(width, 0);
    tileMask = buildTileVisibilityMask();
    regenerateSketch();
    if (typeof doneCb === "function") doneCb();
  }, err => {
    console.error("Failed to load image", err);
    if (typeof doneCb === "function") doneCb();
  });
}

// Render queue
function buildRenderQueue() {
  const queue = [];
  const { min: length_min, max: length_max } = getBrushLengthBounds();
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const startX = random(x * tileWidth, x * tileWidth + tileWidth);
      const startY = random(y * tileWidth, y * tileWidth + tileWidth);
      const bottom_area_value = noiseMapColorL[int(x * tileWidth)][int(y * tileWidth)];
      const top_area_value = noiseMapColorH[int(x * tileWidth)][int(y * tileWidth)];
      const length_noise_value = noiseMapColorLength[int(x * tileWidth)][int(y * tileWidth)];
      queue.push({
        x,
        y,
        startX,
        startY,
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

// Main drawing logic
function drawTile(job) {
  const { x, y, startX, startY, bottom_area_value, top_area_value, length_noise_value, length_min, length_max } = job;

  const brushLength = Math.max(0, map(length_noise_value, 0, 1, length_min, length_max)) * tileWidth;

  const maskVal = tileMask ? tileMask[x][y] : null;
  const isBlack = maskVal === true;
  const isWhite = maskVal === false;

  let allowLayerL = showLayerL;
  let allowLayerH = showLayerH;

  if (maskVal !== null) {
    if (hideMask) {
      // Hide white areas entirely; invert flips the behavior
      if (invMask) {
        // white -> both layers; black -> none
        allowLayerL = isWhite ? allowLayerL : false;
        allowLayerH = isWhite ? allowLayerH : false;
      } else {
        // black -> both layers; white -> none
        allowLayerL = isBlack ? allowLayerL : false;
        allowLayerH = isBlack ? allowLayerH : false;
      }
    } else {
      // Normal behavior
      if (invMask) {
        // black -> bottom only; white -> both
        allowLayerH = isWhite ? allowLayerH : false;
      } else {
        // black -> both; white -> bottom only
        allowLayerH = isBlack ? allowLayerH : false;
      }
    }
  }

  if (!allowLayerL && !allowLayerH) {
    return;
  }

  if (allowLayerL) {
    if (bottom_area_value === 1) { brush.stroke(colorL);  }
    else if (bottom_area_value === 2) { brush.stroke(colorH); }
    else { brush.stroke(colorBG); }

    brush.pick("EndoBrush");
    brush.field("bottomFlowField");
    brush.flowLine(startX - tileWidth, startY, brushLength, 0);
  }

  if (allowLayerH) {
    if (top_area_value === 1) { brush.stroke(colorH);  }
    else if (top_area_value === 2) { brush.stroke(colorL); }
    else { brush.stroke(colorBG); }

    brush.pick("EndoBrush");
    brush.field("topFlowField");
    brush.flowLine(startX - tileWidth, startY, brushLength * brushLengthMulti, 0);
  }
}

// Reseed noise (Generate)
function reseedNoise() {
  const seed = Math.floor(Math.random() * 1_000_000_000);
  noiseSeed(seed);
  randomSeed(seed + 1);
}

// Blank canvas
function renderBlankCanvas() {
  resetMatrix();
  translate(-width / 2, -height / 2);
  background(colorBG);
}

// Generate sketch
function generateSketch() {
  resetMatrix();
  translate(-width / 2, -height / 2);
  background(colorBG);

  // Tile width
  tileWidth = width / tiles;

  tileMask = overlayIMG ? buildTileVisibilityMask() : null;

  // Generate bottom areas
  noiseMapColorL = genMapColor(width, height, 0, noiseScaleColor);

  // Generate top areas
  noiseMapColorH = genMapColor(width, height, 0, noiseScaleColor * noiseScaleColorMulti);

  // Generate brush length area (shared across layers)
  noiseMapColorLength = genMapLength(width, height, 0, noiseScaleLength);

  // Prepare rendering queue to draw progressively
  renderQueue = buildRenderQueue();
  renderIndex = 0;
  const tilesTotal = renderQueue.length;
  tilesPerFrame = Math.max(1, Math.floor(tilesTotal / 80));
  isRendering = true;
}

// Apply parameters
function applyParams(params = {}) {
  if (typeof params.tiles === "number") {
    tiles = params.tiles;
  }
  if (typeof params.pixelDensityValue === "number") {
    pixDensity = constrain(params.pixelDensityValue, 1, 4);
  }
  const hasNewBase = typeof params.brushLengthBase === "number";
  const hasNewRange = typeof params.brushLengthRange === "number";
  if (hasNewBase) {
    brushLengthBase = params.brushLengthBase;
  }
  if (hasNewRange) {
    brushLengthRange = params.brushLengthRange;
  }
  // Legacy min/max support: derive base and range if new values not provided
  if (!hasNewBase && !hasNewRange && typeof params.brushLengthMin === "number" && typeof params.brushLengthMax === "number") {
    const minVal = params.brushLengthMin;
    const maxVal = params.brushLengthMax;
    if (minVal > 0 && maxVal > 0) {
      brushLengthBase = Math.sqrt(minVal * maxVal);
      brushLengthRange = Math.max(1, maxVal / Math.max(minVal, 1e-6));
    }
  }
  brushLengthBase = Math.max(0, brushLengthBase);
  brushLengthRange = Math.max(1, brushLengthRange);
  if (typeof params.brushLengthTopMultiplier === "number") {
    brushLengthMulti = params.brushLengthTopMultiplier;
  }
  if (typeof params.brushWeight === "number") {
    brushWeight = params.brushWeight;
  }
  if (typeof params.brushVibration === "number") {
    brushVibration = params.brushVibration;
  }
  if (typeof params.colorNoiseScale === "number") {
    noiseScaleColor = params.colorNoiseScale;
  }
  if (typeof params.angleNoiseScale === "number") {
    noiseScaleAngle = params.angleNoiseScale;
  }
  if (typeof params.brushLengthNoiseScale === "number") {
    noiseScaleLength = params.brushLengthNoiseScale;
  }
  if (typeof params.colorNoiseMultiplier === "number") {
    noiseScaleColorMulti = params.colorNoiseMultiplier;
  }
  if (typeof params.angleNoiseMultiplier === "number") {
    noiseScaleAngleMulti = params.angleNoiseMultiplier;
  }
  if (typeof params.showBottomLayer === "boolean") {
    showLayerL = params.showBottomLayer;
  }
  if (typeof params.showTopLayer === "boolean") {
    showLayerH = params.showTopLayer;
  }
  if (typeof params.invertMask === "boolean") {
    invMask = params.invertMask;
  }
  if (typeof params.hideWhite === "boolean") {
    hideMask = params.hideWhite;
  }
  if (typeof params.secHigh === "number") {
    secH = constrain(params.secHigh, 0.5, 1);
  }
  if (typeof params.secLow === "number") {
    secL = constrain(params.secLow, 0, 0.49);
  }
  configureBrushes();
  initializeBrushFields();
}

// Regenerate sketch (Generate)
function regenerateSketch(params = {}) {
  applyParams(params);
  pixelDensity(pixDensity);
  reseedNoise();
  generateSketch();
}

// Update layer visibility
function updateVisibility(params = {}) {
  if (typeof params.showTiles === "boolean") {
    show_tiles = params.showTiles;
  }
  if (typeof params.showBottomLayer === "boolean") {
    showLayerL = params.showBottomLayer;
  }
  if (typeof params.showTopLayer === "boolean") {
    showLayerH = params.showTopLayer;
  }
  if (typeof params.invertMask === "boolean") {
    invMask = params.invertMask;
  }
  if (typeof params.hideWhite === "boolean") {
    hideMask = params.hideWhite;
  }

  // Re-render the existing queue so the same pattern is shown with new visibility
  if (!renderQueue || renderQueue.length === 0) return;
  renderBlankCanvas();
  renderIndex = 0;
  tilesPerFrame = Math.max(1, Math.floor(renderQueue.length / 80));
  isRendering = true;
}

// Setup p5.js
function setup() {
  // Set canvas
  pixelDensity(pixDensity);
  window.canv = createCanvas(canvSize, canvSize, WEBGL);
  angleMode(DEGREES);
  renderBlankCanvas();
  configureBrushes();
  initializeBrushFields();
  reseedNoise();
  setTimeout(generateSketch, 0);
}

// Draw p5.js
function draw() {
  resetMatrix();
  translate(-width / 2, -height / 2);

  if (!isRendering || renderQueue.length === 0) {
    return;
  }
  const remaining = renderQueue.length - renderIndex;
  const batch = Math.min(tilesPerFrame, remaining);
  for (let i = 0; i < batch; i++) {
    drawTile(renderQueue[renderIndex + i]);
  }
  renderIndex += batch;
  if (renderIndex >= renderQueue.length) {
    isRendering = false;
  }
}
