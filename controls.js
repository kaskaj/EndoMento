document.addEventListener("DOMContentLoaded", () => {
  const panel = document.createElement("div");
  panel.id = "controls-panel";

  const tileCheckbox = createCheckboxControl({
    label: "Tiles",
    id: "show-tiles",
    checked: false
  });

  const bottomCheckbox = createCheckboxControl({
    label: "Bottom Layer",
    id: "show-bottom-layer",
    checked: true
  });

  const topCheckbox = createCheckboxControl({
    label: "Top Layer",
    id: "show-top-layer",
    checked: true
  });

  const syncVisibility = () => {
    if (typeof window.updateVisibility === "function") {
      window.updateVisibility({
        showTiles: tileCheckbox.input.checked,
        showBottomLayer: bottomCheckbox.input.checked,
        showTopLayer: topCheckbox.input.checked
      });
    }
  };

  [tileCheckbox.input, bottomCheckbox.input, topCheckbox.input].forEach(input => {
    input.addEventListener("change", syncVisibility);
  });

  const toggleRow = document.createElement("div");
  toggleRow.className = "toggle-row";
  toggleRow.appendChild(tileCheckbox.container);
  toggleRow.appendChild(bottomCheckbox.container);
  toggleRow.appendChild(topCheckbox.container);

  const tileControl = createSliderControl({
    label: "Number of Tiles",
    id: "tiles-slider",
    min: 10,
    max: 200,
    step: 1,
    value: 100
  });

  const pixelDensityControl = createSliderControl({
    label: "Pixel Density",
    id: "pixel-density",
    min: 1,
    max: 4,
    step: 1,
    value: 2
  });

  const brushLengthBaseControl = createSliderControl({
    label: "Base Length",
    id: "brush-length-base",
    min: 0.1,
    max: 2,
    step: 0.1,
    value: 1
  });

  const brushLengthRangeControl = createSliderControl({
    label: "Length Range",
    id: "brush-length-range",
    min: 1,
    max: 30,
    step: 0.1,
    value: 2
  });

  const brushVibrationControl = createSliderControl({
    label: "Vibration",
    id: "brush-vibration",
    min: 0,
    max: 5,
    step: 0.1,
    value: 1
  });

  const brushLengthTopMultiplierControl = createSliderControl({
    label: "Top/Bottom Length Multiplier",
    id: "brush-length-top-multiplier",
    min: 0.5,
    max: 8,
    step: 0.05,
    value: 0.8
  });

  const brushWeightControl = createSliderControl({
    label: "Brush Weight",
    id: "brush-weight",
    min: 1,
    max: 10,
    step: 0.1,
    value: 5
  });

  const colorNoiseScaleControl = createSliderControl({
    label: "Noise Scale",
    id: "color_noise_scale",
    min: 0.001,
    max: 0.05,
    step: 0.001,
    value: 0.005
  });

  const colorSecLowControl = createSliderControl({
    label: "Low Threshold",
    id: "color-sec-low",
    min: 0,
    max: 0.49,
    step: 0.01,
    value: 0.28
  });

  const colorSecHighControl = createSliderControl({
    label: "High Threshold",
    id: "color-sec-high",
    min: 0.5,
    max: 1,
    step: 0.01,
    value: 0.65
  });

  const angleNoiseScaleControl = createSliderControl({
    label: "Noise Scale",
    id: "angle-noise-scale",
    min: 0.001,
    max: 0.1,
    step: 0.001,
    value: 0.01
  });

  const lengthNoiseScaleControl = createSliderControl({
    label: "Noise Scale",
    id: "length-noise-scale",
    min: 0.001,
    max: 0.05,
    step: 0.001,
    value: 0.005
  });

  const colorNoiseMultiplierControl = createSliderControl({
    label: "Top/Bottom Multiplier",
    id: "color-noise-multiplier",
    min: 0.5,
    max: 2,
    step: 0.05,
    value: 2
  });

  const angleNoiseMultiplierControl = createSliderControl({
    label: "Top/Bottom Multiplier",
    id: "angle-noise-multiplier",
    min: 0.5,
    max: 2,
    step: 0.05,
    value: 2
  });

  const areaNoiseSection = createSection("Color Areas", [
    colorNoiseScaleControl.container,
    colorNoiseMultiplierControl.container,
    colorSecLowControl.container,
    colorSecHighControl.container
  ]);

  const angleNoiseSection = createSection("Angle Areas", [
    angleNoiseScaleControl.container,
    angleNoiseMultiplierControl.container
  ]);

  const brushSection = createSection("Brush Areas", [
    lengthNoiseScaleControl.container,
    brushLengthBaseControl.container,
    brushLengthRangeControl.container,
    brushLengthTopMultiplierControl.container,
    brushVibrationControl.container,
    brushWeightControl.container
  ]);

  const generateButton = document.createElement("button");
  generateButton.type = "button";
  generateButton.textContent = "Generate";
  generateButton.addEventListener("click", () => {
    triggerGenerate();
  });

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", () => {
    if (typeof window.saveFrames === "function" && typeof window.canv !== "undefined") {
      window.saveFrames(canv, "endo.png");
    }
  });

  const randomizeButton = document.createElement("button");
  randomizeButton.type = "button";
  randomizeButton.textContent = "Randomize";
  randomizeButton.addEventListener("click", () => {
    randomizeSliders([
      tileControl,
      brushLengthBaseControl,
      brushLengthRangeControl,
      brushVibrationControl,
      brushLengthTopMultiplierControl,
      brushWeightControl,
      colorNoiseScaleControl,
      colorSecLowControl,
      colorSecHighControl,
      angleNoiseScaleControl,
      lengthNoiseScaleControl,
      colorNoiseMultiplierControl,
      angleNoiseMultiplierControl
    ]);
    triggerGenerate();
  });

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(generateButton);
  buttonRow.appendChild(randomizeButton);
  buttonRow.appendChild(saveButton);
  panel.appendChild(buttonRow);
  panel.appendChild(toggleRow);
  panel.appendChild(pixelDensityControl.container);
  panel.appendChild(tileControl.container);
  panel.appendChild(areaNoiseSection);
  panel.appendChild(angleNoiseSection);
  panel.appendChild(brushSection);

  document.body.appendChild(panel);

  // Apply DoE selection if present
  const saved = loadDoeSelection();
  if (saved) {
    applyParamsToControls(saved);
    triggerGenerate(saved);
    localStorage.removeItem("doeSelection");
  }
});

function randomizeSliders(controls) {
  controls.forEach(control => {
    const min = parseFloat(control.input.min);
    const max = parseFloat(control.input.max);
    const step = parseFloat(control.input.step);
    const steps = Math.round((max - min) / step);
    const randStep = Math.floor(Math.random() * (steps + 1));
    const value = Number((min + randStep * step).toFixed(4));
    control.input.value = value;
    if (control.valueEl) {
      control.valueEl.textContent = value;
    }
  });
}

function triggerGenerate(paramsOverride) {
  const params = paramsOverride || {
    tiles: parseInt(document.getElementById("tiles-slider").value, 10),
    pixelDensityValue: parseInt(document.getElementById("pixel-density").value, 10),
    brushLengthBase: parseFloat(document.getElementById("brush-length-base").value),
    brushLengthRange: parseFloat(document.getElementById("brush-length-range").value),
    brushVibration: parseFloat(document.getElementById("brush-vibration").value),
    brushLengthTopMultiplier: parseFloat(document.getElementById("brush-length-top-multiplier").value),
    brushWeight: parseFloat(document.getElementById("brush-weight").value),
    areaNoiseScale: parseFloat(document.getElementById("color_noise_scale").value),
    secLow: parseFloat(document.getElementById("color-sec-low").value),
    secHigh: parseFloat(document.getElementById("color-sec-high").value),
    angleNoiseScale: parseFloat(document.getElementById("angle-noise-scale").value),
    brushLengthNoiseScale: parseFloat(document.getElementById("length-noise-scale").value),
    colorNoiseMultiplier: parseFloat(document.getElementById("color-noise-multiplier").value),
    angleNoiseMultiplier: parseFloat(document.getElementById("angle-noise-multiplier").value),
    showTiles: document.getElementById("show-tiles").checked,
    showBottomLayer: document.getElementById("show-bottom-layer").checked,
    showTopLayer: document.getElementById("show-top-layer").checked
  };

  if (typeof window.regenerateSketch === "function") {
    window.regenerateSketch(params);
  }
}

function loadDoeSelection() {
  try {
    const raw = localStorage.getItem("doeSelection");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse doeSelection", e);
    return null;
  }
}

function setSliderValue(id, value) {
  if (typeof value !== "number") return;
  const input = document.getElementById(id);
  if (!input) return;
  input.value = value;
  const valueEl = input.previousElementSibling && input.previousElementSibling.querySelector(".control-value");
  if (valueEl) valueEl.textContent = value;
}

function setCheckboxValue(id, value) {
  if (typeof value !== "boolean") return;
  const input = document.getElementById(id);
  if (input) input.checked = value;
}

function applyParamsToControls(params) {
  if (!params || typeof params !== "object") return;
  const hasBase = typeof params.brushLengthBase === "number";
  const hasRange = typeof params.brushLengthRange === "number";
  let baseLen = hasBase ? params.brushLengthBase : undefined;
  let rangeLen = hasRange ? params.brushLengthRange : undefined;
  // Legacy support: derive base/range from min/max if provided
  if (!hasBase && !hasRange && typeof params.brushLengthMin === "number" && typeof params.brushLengthMax === "number") {
    const minVal = params.brushLengthMin;
    const maxVal = params.brushLengthMax;
    if (minVal > 0 && maxVal > 0) {
      baseLen = Math.sqrt(minVal * maxVal);
      rangeLen = Math.max(1, maxVal / Math.max(minVal, 1e-6));
    }
  }
  setSliderValue("brush-length-base", baseLen);
  setSliderValue("brush-length-range", rangeLen);
  setSliderValue("tiles-slider", params.tiles);
  setSliderValue("pixel-density", params.pixelDensityValue);
  setSliderValue("brush-length-top-multiplier", params.brushLengthTopMultiplier);
  setSliderValue("brush-weight", params.brushWeight);
  setSliderValue("brush-vibration", params.brushVibration);
  setSliderValue("color_noise_scale", params.areaNoiseScale);
  setSliderValue("color-sec-low", params.secLow);
  setSliderValue("color-sec-high", params.secHigh);
  setSliderValue("angle-noise-scale", params.angleNoiseScale);
  setSliderValue("length-noise-scale", params.brushLengthNoiseScale);
  setSliderValue("color-noise-multiplier", params.colorNoiseMultiplier);
  setSliderValue("angle-noise-multiplier", params.angleNoiseMultiplier);
  setCheckboxValue("show-tiles", params.showTiles);
  setCheckboxValue("show-bottom-layer", params.showBottomLayer);
  setCheckboxValue("show-top-layer", params.showTopLayer);
}

function createSection(title, controls) {
  const container = document.createElement("div");
  container.className = "panel-section";

  const heading = document.createElement("h3");
  heading.textContent = title;
  container.appendChild(heading);

  controls.forEach(control => container.appendChild(control));

  return container;
}

function createSliderControl({ label, id, min, max, step, value }) {
  const container = document.createElement("div");
  container.className = "control-group";

  const row = document.createElement("div");
  row.className = "control-row";

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", id);
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "control-value";
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);

  const input = document.createElement("input");
  input.type = "range";
  input.id = id;
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.addEventListener("input", () => {
    valueEl.textContent = input.value;
  });

  container.appendChild(row);
  container.appendChild(input);

  return { container, input, valueEl };
}

function createCheckboxControl({ label, id, checked }) {
  const container = document.createElement("div");
  container.className = "control-group control-checkbox";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = id;
  input.checked = checked;

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", id);
  labelEl.textContent = label;

  container.appendChild(input);
  container.appendChild(labelEl);

  return { container, input };
}
