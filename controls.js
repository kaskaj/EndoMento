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

  const brushLengthBaseControl = createSliderControl({
    label: "Brush Length",
    id: "brush-length-base",
    min: 0.5,
    max: 2.5,
    step: 0.1,
    value: 1.5
  });

  const brushLengthTopMultiplierControl = createSliderControl({
    label: "Top Brush Multiplier",
    id: "brush-length-top-multiplier",
    min: 0.5,
    max: 2,
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

  const areaNoiseScaleControl = createSliderControl({
    label: "Area Noise Scale",
    id: "area-noise-scale",
    min: 0.001,
    max: 0.05,
    step: 0.001,
    value: 0.005
  });

  const angleNoiseScaleControl = createSliderControl({
    label: "Angle Noise Scale",
    id: "angle-noise-scale",
    min: 0.001,
    max: 0.1,
    step: 0.001,
    value: 0.01
  });

  const areaNoiseMultiplierControl = createSliderControl({
    label: "Top/Bottom Multiplier",
    id: "area-noise-multiplier",
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
    areaNoiseScaleControl.container,
    areaNoiseMultiplierControl.container
  ]);

  const angleNoiseSection = createSection("Angle Areas", [
    angleNoiseScaleControl.container,
    angleNoiseMultiplierControl.container
  ]);

  const brushSection = createSection("Brush", [
    brushLengthBaseControl.container,
    brushWeightControl.container,
    brushLengthTopMultiplierControl.container
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
      brushLengthTopMultiplierControl,
      brushWeightControl,
      areaNoiseScaleControl,
      angleNoiseScaleControl,
      areaNoiseMultiplierControl,
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
  panel.appendChild(tileControl.container);
  panel.appendChild(areaNoiseSection);
  panel.appendChild(angleNoiseSection);
  panel.appendChild(brushSection);

  document.body.appendChild(panel);
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

function triggerGenerate() {
  const tiles = parseInt(document.getElementById("tiles-slider").value, 10);
  const brushLengthBase = parseFloat(document.getElementById("brush-length-base").value);
  const brushLengthTopMultiplier = parseFloat(document.getElementById("brush-length-top-multiplier").value);
  const brushWeight = parseFloat(document.getElementById("brush-weight").value);
  const areaNoiseScale = parseFloat(document.getElementById("area-noise-scale").value);
  const angleNoiseScale = parseFloat(document.getElementById("angle-noise-scale").value);
  const areaNoiseMultiplier = parseFloat(document.getElementById("area-noise-multiplier").value);
  const angleNoiseMultiplier = parseFloat(document.getElementById("angle-noise-multiplier").value);
  const showTiles = document.getElementById("show-tiles").checked;
  const showBottomLayer = document.getElementById("show-bottom-layer").checked;
  const showTopLayer = document.getElementById("show-top-layer").checked;

  if (typeof window.regenerateSketch === "function") {
    window.regenerateSketch({
      tiles,
      brushLengthBase,
      brushLengthTopMultiplier,
      brushWeight,
      areaNoiseScale,
      angleNoiseScale,
      areaNoiseMultiplier,
      angleNoiseMultiplier,
      showTiles,
      showBottomLayer,
      showTopLayer
    });
  }
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
