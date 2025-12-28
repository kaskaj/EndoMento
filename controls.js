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
    id: "show-bottom-areas",
    checked: true
  });

  const topCheckbox = createCheckboxControl({
    label: "Top Layer",
    id: "show-top-areas",
    checked: true
  });

  const toggleRow = document.createElement("div");
  toggleRow.className = "toggle-row";
  toggleRow.appendChild(tileCheckbox.container);
  toggleRow.appendChild(bottomCheckbox.container);
  toggleRow.appendChild(topCheckbox.container);
  panel.appendChild(toggleRow);

  const tileControl = createSliderControl({
    label: "Tile Count",
    id: "tiles-slider",
    min: 10,
    max: 200,
    step: 1,
    value: 100
  });

  const brushLengthBottomControl = createSliderControl({
    label: "Bottom Brush Length",
    id: "brush-length-bottom",
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

  const areaDensityControl = createSliderControl({
    label: "Area Density (Base)",
    id: "area-density-base",
    min: 0.001,
    max: 0.05,
    step: 0.001,
    value: 0.005
  });

  const angleDensityControl = createSliderControl({
    label: "Angle Density (Base)",
    id: "angle-density-base",
    min: 0.001,
    max: 0.1,
    step: 0.001,
    value: 0.01
  });

  const topBottomDensityControl = createSliderControl({
    label: "Top/Bottom Density Multiplier",
    id: "top-bottom-density",
    min: 0.5,
    max: 2,
    step: 0.05,
    value: 2
  });

  const topBottomAngleControl = createSliderControl({
    label: "Top/Bottom Angle Multiplier",
    id: "top-bottom-angle",
    min: 0.5,
    max: 2,
    step: 0.05,
    value: 2
  });

  panel.appendChild(tileControl.container);

  const areaNoiseSection = createSection("Area Noise Pattern", [
    areaDensityControl.container,
    topBottomDensityControl.container
  ]);

  const angleNoiseSection = createSection("Angle Noise Pattern", [
    angleDensityControl.container,
    topBottomAngleControl.container
  ]);

  const brushSection = createSection("Brush", [
    brushLengthBottomControl.container,
    brushLengthTopMultiplierControl.container,
    brushWeightControl.container
  ]);

  panel.appendChild(areaNoiseSection);
  panel.appendChild(angleNoiseSection);
  panel.appendChild(brushSection);

  const generateButton = document.createElement("button");
  generateButton.type = "button";
  generateButton.textContent = "Generate";
  generateButton.addEventListener("click", () => {
    const tiles = parseInt(tileControl.input.value, 10);
    const brushLengthBottom = parseFloat(brushLengthBottomControl.input.value);
    const brushLengthTopMultiplier = parseFloat(brushLengthTopMultiplierControl.input.value);
    const brushWeight = parseFloat(brushWeightControl.input.value);
    const areaDensityBase = parseFloat(areaDensityControl.input.value);
    const angleDensityBase = parseFloat(angleDensityControl.input.value);
    const topVsBottomDensity = parseFloat(topBottomDensityControl.input.value);
    const topVsBottomAngle = parseFloat(topBottomAngleControl.input.value);
    const showTiles = tileCheckbox.input.checked;
    const showBottomAreas = bottomCheckbox.input.checked;
    const showTopAreas = topCheckbox.input.checked;
    if (typeof window.regenerateSketch === "function") {
      window.regenerateSketch({
        tiles,
        brushLengthBottom,
        brushLengthTopMultiplier,
        brushWeight,
        areaDensityBase,
        angleDensityBase,
        topVsBottomDensity,
        topVsBottomAngle,
        showTiles,
        showBottomAreas,
        showTopAreas
      });
    }
  });

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(generateButton);
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
