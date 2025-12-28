document.addEventListener("DOMContentLoaded", () => {
  const panel = document.createElement("div");
  panel.id = "controls-panel";

  const title = document.createElement("h2");
  title.textContent = "Controls";
  panel.appendChild(title);

  const hint = document.createElement("p");
  hint.className = "control-note";
  hint.textContent = "Toggles on top; adjust sliders, then use Refresh or Generate.";
  panel.appendChild(hint);

  const tileCheckbox = createCheckboxControl({
    label: "Tiles",
    id: "show-tiles",
    checked: false
  });

  const mainCheckbox = createCheckboxControl({
    label: "Main Areas",
    id: "show-main-areas",
    checked: true
  });

  const subCheckbox = createCheckboxControl({
    label: "Sub Areas",
    id: "show-sub-areas",
    checked: true
  });

  const toggleRow = document.createElement("div");
  toggleRow.className = "toggle-row";
  toggleRow.appendChild(tileCheckbox.container);
  toggleRow.appendChild(mainCheckbox.container);
  toggleRow.appendChild(subCheckbox.container);
  panel.appendChild(toggleRow);

  const tileControl = createSliderControl({
    label: "Tile Count",
    id: "tiles-slider",
    min: 10,
    max: 200,
    step: 1,
    value: 100
  });

  const brushLengthMainControl = createSliderControl({
    label: "Brush Length Main",
    id: "brush-length-main",
    min: 0.5,
    max: 2.5,
    step: 0.1,
    value: 1.5
  });

  const brushLengthSubControl = createSliderControl({
    label: "Brush Length Sub",
    id: "brush-length-sub",
    min: 0.5,
    max: 2.5,
    step: 0.1,
    value: 1.2
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
    label: "Area Density",
    id: "area-density",
    min: 0.001,
    max: 0.05,
    step: 0.001,
    value: 0.005
  });

  const angleDensityControl = createSliderControl({
    label: "Angle Density",
    id: "angle-density",
    min: 0.001,
    max: 0.1,
    step: 0.001,
    value: 0.01
  });

  const subVsMainDensityControl = createSliderControl({
    label: "Sub/Main Density",
    id: "sub-vs-main-density",
    min: 0.5,
    max: 2,
    step: 0.05,
    value: 2
  });

  const subVsMainAngleControl = createSliderControl({
    label: "Sub/Main Angle",
    id: "sub-vs-main-angle",
    min: 0.5,
    max: 2,
    step: 0.05,
    value: 2
  });

  panel.appendChild(tileControl.container);
  panel.appendChild(brushLengthMainControl.container);
  panel.appendChild(brushLengthSubControl.container);
  panel.appendChild(brushWeightControl.container);
  panel.appendChild(areaDensityControl.container);
  panel.appendChild(angleDensityControl.container);
  panel.appendChild(subVsMainDensityControl.container);
  panel.appendChild(subVsMainAngleControl.container);

  const generateButton = document.createElement("button");
  generateButton.type = "button";
  generateButton.textContent = "Generate";
  generateButton.addEventListener("click", () => {
    const tiles = parseInt(tileControl.input.value, 10);
    const brushLengthMain = parseFloat(brushLengthMainControl.input.value);
    const brushLengthSub = parseFloat(brushLengthSubControl.input.value);
    const brushWeight = parseFloat(brushWeightControl.input.value);
    const areaDensity = parseFloat(areaDensityControl.input.value);
    const angleDensity = parseFloat(angleDensityControl.input.value);
    const subVsMainDensity = parseFloat(subVsMainDensityControl.input.value);
    const subVsMainAngle = parseFloat(subVsMainAngleControl.input.value);
    const showTiles = tileCheckbox.input.checked;
    const showMainAreas = mainCheckbox.input.checked;
    const showSubAreas = subCheckbox.input.checked;
    if (typeof window.regenerateSketch === "function") {
      window.regenerateSketch({
        tiles,
        brushLengthMain,
        brushLengthSub,
        brushWeight,
        areaDensity,
        angleDensity,
        subVsMainDensity,
        subVsMainAngle,
        showTiles,
        showMainAreas,
        showSubAreas
      });
    }
  });

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-row";
  buttonRow.appendChild(generateButton);
  panel.appendChild(buttonRow);

  document.body.appendChild(panel);
});

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
