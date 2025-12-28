// DoE explorer: generate 3 rounds of 8 variants at 300x300, user picks favorite each round.

const PARAM_RANGES = {
  tiles: { min: 10, max: 200, step: 1 },
  brushLengthBase: { min: 0.5, max: 2.5, step: 0.1 },
  brushLengthTopMultiplier: { min: 0.5, max: 2.0, step: 0.05 },
  brushWeight: { min: 1, max: 10, step: 0.1 },
  areaNoiseScale: { min: 0.001, max: 0.05, step: 0.001 },
  angleNoiseScale: { min: 0.001, max: 0.1, step: 0.001 },
  areaNoiseMultiplier: { min: 0.5, max: 2.0, step: 0.05 },
  angleNoiseMultiplier: { min: 0.5, max: 2.0, step: 0.05 }
};

const ROUNDS = 3;
const BATCH_SIZE = 8;
const CANVAS_SIZE = 300;


const state = {
  round: 1,
  focus: null,
  spread: 1.0,
  selection: null,
  cards: []
};

const statusEl = document.getElementById("status");
const gridEl = document.getElementById("grid");
const regenBtn = document.getElementById("regen");
const finalActions = document.getElementById("final-actions");
const restartAllBtn = document.getElementById("restart-all");
const generateFullBtn = document.getElementById("generate-full");

let rendererPromise = null;

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function snap(val, min, step) {
  return Number((Math.round((val - min) / step) * step + min).toFixed(4));
}

function sampleParams(focus, spread) {
  const params = {};
  Object.entries(PARAM_RANGES).forEach(([key, range]) => {
    const span = (range.max - range.min) * spread;
    const base = focus ? focus[key] : (range.min + range.max) / 2;
    const raw = base + (Math.random() - 0.5) * span;
    params[key] = snap(clamp(raw, range.min, range.max), range.min, range.step);
  });
  return params;
}

function updateStatus() {
  const roundText = `${state.round}/${ROUNDS}`;
  const selectionText = state.selection ? "Selected" : "Pick one";
  statusEl.textContent = `Round ${roundText} • ${selectionText}`;
}

function clearGrid() {
  gridEl.innerHTML = "";
  state.cards = [];
}

function renderBatch() {
  clearGrid();
  state.selection = null;
  updateStatus();

  const focus = state.focus;
  const spread = state.spread;

  for (let i = 0; i < BATCH_SIZE; i++) {
    const params = sampleParams(focus, spread);
    const card = document.createElement("div");
    card.className = "card";
    const placeholder = document.createElement("div");
    placeholder.className = "placeholder";
    placeholder.textContent = "Rendering…";
    card.appendChild(placeholder);
    gridEl.appendChild(card);

    state.cards.push({ card, params });
    renderCard(card, params);

    card.addEventListener("click", () => {
      state.selection = params;
      state.cards.forEach(c => c.card.classList.remove("selected"));
      card.classList.add("selected");
      updateStatus();
      advanceRound();
    });
  }
}

async function getRenderer() {
  if (rendererPromise) return rendererPromise;
  rendererPromise = new Promise(resolve => {
    new p5(p => {
      p.setup = () => {
        p.noCanvas();
        resolve(p);
      };
    });
  });
  return rendererPromise;
}

async function renderCard(card, params) {
  const seed = Math.floor(Math.random() * 1_000_000);
  try {
    const p = await getRenderer();
    const g = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE);
    g.angleMode(p.DEGREES);
    if (typeof g.randomSeed === "function") g.randomSeed(seed);
    if (typeof g.noiseSeed === "function") g.noiseSeed(seed + 1);

    g.background("#fff9da");
    const tileWidth = g.width / params.tiles;

    const area = (w, h, scale) => {
      const arr = Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const n = g.noise(scale * x, scale * y, 0);
          let val = 0;
          if (n >= 0.65) val = 3;
          else if (n > 0.45) val = 2;
          else if (n > 0.28) val = 1;
          arr[x][y] = val;
        }
      }
      return arr;
    };

    const angleField = (w, h, scale) => {
      const arr = Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const n = g.noise(scale * x, scale * y, 0);
          arr[x][y] = g.map(n, 0, 1, 90, -90);
        }
      }
      return arr;
    };

    const bottom = area(g.width, g.height, params.areaNoiseScale);
    const top = area(g.width, g.height, params.areaNoiseScale * params.areaNoiseMultiplier);
    const bottomAngles = angleField(g.width, g.height, params.angleNoiseScale);
    const topAngles = angleField(g.width, g.height, params.angleNoiseScale * params.angleNoiseMultiplier);

    g.strokeWeight(params.brushWeight);

    for (let y = 0; y < params.tiles; y++) {
      for (let x = 0; x < params.tiles; x++) {
        const startX = g.random(x * tileWidth, x * tileWidth + tileWidth);
        const startY = g.random(y * tileWidth, y * tileWidth + tileWidth);

        const bx = Math.floor(x * tileWidth);
        const by = Math.floor(y * tileWidth);

        const bottomVal = bottom[bx]?.[by] ?? 0;
        if (bottomVal > 0) {
          if (bottomVal === 1) g.stroke("#ff33d2");
          else if (bottomVal === 2) g.stroke("#ff1b37");
          else if (bottomVal === 3) g.stroke("#ff1b37");
          const ang = bottomAngles[bx]?.[by] ?? 0;
          const len = params.brushLengthBase * tileWidth;
          const dx = g.cos(ang) * len;
          const dy = g.sin(ang) * len;
          g.line(startX, startY, startX + dx, startY + dy);
        }

        const topVal = top[bx]?.[by] ?? 0;
        if (topVal > 0) {
          if (topVal === 1) g.stroke("#ff1b37");
          else if (topVal === 2) g.stroke("#ff1b37");
          else if (topVal === 3) g.stroke("#ff33d2");
          const angTop = topAngles[bx]?.[by] ?? 0;
          const lenTop = g.random(0.5, 2) * params.brushLengthBase * params.brushLengthTopMultiplier * tileWidth;
          const dxTop = g.cos(angTop) * lenTop;
          const dyTop = g.sin(angTop) * lenTop;
          g.line(startX, startY, startX + dxTop, startY + dyTop);
        }
      }
    }

    const img = document.createElement("img");
    img.width = CANVAS_SIZE;
    img.height = CANVAS_SIZE;
    img.src = g.canvas.toDataURL("image/png");

    const placeholder = card.querySelector(".placeholder");
    if (placeholder) {
      placeholder.replaceWith(img);
    } else {
      card.appendChild(img);
    }

    if (typeof g.remove === "function") {
      g.remove();
    }
  } catch (e) {
    console.error("Render error", e);
    const placeholder = card.querySelector(".placeholder");
    if (placeholder) placeholder.textContent = "Render error";
  }
}

function advanceRound() {
  if (!state.selection) return;
  state.focus = state.selection;
  state.spread *= 0.45;
  state.round += 1;
  if (state.round > ROUNDS) {
    finishSelection();
    return;
  }
  renderBatch();
}

regenBtn.addEventListener("click", () => {
  if (state.round === 1) {
    restartSession();
  } else {
    // Re-roll current round using existing focus/spread
    renderBatch();
  }
});

function restartSession() {
  state.round = 1;
  state.spread = 1.2;
  state.focus = null;
  state.selection = null;
  renderBatch();
}

function finishSelection() {
  statusEl.textContent = "Finished all rounds. Choose next action.";
  finalActions.style.display = "flex";
  gridEl.classList.add("finished");
}

restartAllBtn.addEventListener("click", () => {
  finalActions.style.display = "none";
  restartSession();
});

generateFullBtn.addEventListener("click", () => {
  if (state.selection) {
    localStorage.setItem("doeSelection", JSON.stringify(state.selection));
  }
  window.location.href = "index.html";
});

// initial batch
restartSession();
