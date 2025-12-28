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
  panel.appendChild(toggleRow);

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

  panel.appendChild(tileControl.container);

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

  panel.appendChild(areaNoiseSection);
  panel.appendChild(angleNoiseSection);
  panel.appendChild(brushSection);

  const generateButton = document.createElement("button");
  generateButton.type = "button";
  generateButton.textContent = "Generate";
  generateButton.addEventListener("click", () => {
    const tiles = parseInt(tileControl.input.value, 10);
    const brushLengthBase = parseFloat(brushLengthBaseControl.input.value);
    const brushLengthTopMultiplier = parseFloat(brushLengthTopMultiplierControl.input.value);
    const brushWeight = parseFloat(brushWeightControl.input.value);
    const areaNoiseScale = parseFloat(areaNoiseScaleControl.input.value);
    const angleNoiseScale = parseFloat(angleNoiseScaleControl.input.value);
    const areaNoiseMultiplier = parseFloat(areaNoiseMultiplierControl.input.value);
    const angleNoiseMultiplier = parseFloat(angleNoiseMultiplierControl.input.value);
    const showTiles = tileCheckbox.input.checked;
    const showBottomLayer = bottomCheckbox.input.checked;
    const showTopLayer = topCheckbox.input.checked;
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
  });

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", () => {
    if (typeof window.saveFrames === "function" && typeof window.canv !== "undefined") {
      window.saveFrames(canv, "endo.png");
    }
  });

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(generateButton);
  buttonRow.appendChild(saveButton);
  panel.appendChild(buttonRow);

  document.body.appendChild(panel);
});

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

  return { container, input };
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
