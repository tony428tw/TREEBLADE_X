const state = {
  teams: [],
  round: 0,
  wins: [0, 0],
  phase: "idle",
  animationId: 0,
  activeIndex: 0,
  roundWinners: [],
  lastResult: null,
  finalWinner: null,
  recordSaved: false,
  launchText: "",
  log: []
};

const els = {
  setupView: document.querySelector("#setupView"),
  battleView: document.querySelector("#battleView"),
  modeHint: document.querySelector("#modeHint"),
  playerOneInput: document.querySelector("#playerOneInput"),
  playerTwoInput: document.querySelector("#playerTwoInput"),
  playerOnePreview: document.querySelector("#playerOnePreview"),
  playerTwoPreview: document.querySelector("#playerTwoPreview"),
  customPlantName: document.querySelector("#customPlantName"),
  customPlantFile: document.querySelector("#customPlantFile"),
  addPlantImageButton: document.querySelector("#addPlantImageButton"),
  uploadStatus: document.querySelector("#uploadStatus"),
  customPlantList: document.querySelector("#customPlantList"),
  startButton: document.querySelector("#startButton"),
  leftNameLabel: document.querySelector("#leftNameLabel"),
  rightNameLabel: document.querySelector("#rightNameLabel"),
  roundProgress: document.querySelector("#roundProgress"),
  leftPanel: document.querySelector("#leftPanel"),
  rightPanel: document.querySelector("#rightPanel"),
  canvas: document.querySelector("#arenaCanvas"),
  roundOverlay: document.querySelector("#roundOverlay"),
  battleLog: document.querySelector("#battleLog"),
  nextRoundButton: document.querySelector("#nextRoundButton"),
  rematchButton: document.querySelector("#rematchButton"),
  backButton: document.querySelector("#backButton"),
  recordsButton: document.querySelector("#recordsButton"),
  recordsDialog: document.querySelector("#recordsDialog"),
  recordsList: document.querySelector("#recordsList"),
  clearRecordsButton: document.querySelector("#clearRecordsButton")
};

const ctx = els.canvas.getContext("2d");
const MAX_ROUNDS = 3;
const WINNING_SCORE = 4;
const RECORD_KEY = "tree-top-battle-records";
const CUSTOM_PLANT_KEY = "tree-top-custom-plants";
const fallbackPlants = [
  ["榕樹", "竹子", "櫻花"],
  ["松樹", "荷花", "楓樹"]
];
const TREE_SHEET_WIDTH = 563;
const TREE_SHEET_HEIGHT = 1000;
const TREE_SPRITES = [
  { src: "Tree top view/Tree top view1.jpg", x: 38, y: 22, w: 210, h: 205, kind: "olive" },
  { src: "Tree top view/Tree top view1.jpg", x: 286, y: 24, w: 235, h: 215, kind: "broadleaf" },
  { src: "Tree top view/Tree top view1.jpg", x: 42, y: 258, w: 215, h: 205, kind: "needle" },
  { src: "Tree top view/Tree top view1.jpg", x: 306, y: 252, w: 200, h: 205, kind: "round" },
  { src: "Tree top view/Tree top view1.jpg", x: 36, y: 505, w: 224, h: 205, kind: "open" },
  { src: "Tree top view/Tree top view1.jpg", x: 304, y: 500, w: 205, h: 215, kind: "palm" },
  { src: "Tree top view/Tree top view1.jpg", x: 36, y: 740, w: 220, h: 215, kind: "open" },
  { src: "Tree top view/Tree top view1.jpg", x: 304, y: 742, w: 210, h: 210, kind: "palm" },
  { src: "Tree top view/Tree top view2.jpg", x: 46, y: 33, w: 210, h: 205, kind: "round" },
  { src: "Tree top view/Tree top view2.jpg", x: 303, y: 31, w: 212, h: 205, kind: "flower" },
  { src: "Tree top view/Tree top view2.jpg", x: 42, y: 266, w: 210, h: 205, kind: "gold" },
  { src: "Tree top view/Tree top view2.jpg", x: 303, y: 263, w: 205, h: 205, kind: "needle" },
  { src: "Tree top view/Tree top view2.jpg", x: 44, y: 512, w: 208, h: 198, kind: "shrub" },
  { src: "Tree top view/Tree top view2.jpg", x: 304, y: 510, w: 210, h: 198, kind: "flower" },
  { src: "Tree top view/Tree top view2.jpg", x: 42, y: 742, w: 220, h: 215, kind: "flower" },
  { src: "Tree top view/Tree top view2.jpg", x: 307, y: 744, w: 205, h: 205, kind: "open" },
  { src: "Tree top view/Tree top view3.jpg", x: 44, y: 34, w: 215, h: 210, kind: "open" },
  { src: "Tree top view/Tree top view3.jpg", x: 308, y: 36, w: 205, h: 205, kind: "maple" },
  { src: "Tree top view/Tree top view3.jpg", x: 43, y: 270, w: 220, h: 210, kind: "broadleaf" },
  { src: "Tree top view/Tree top view3.jpg", x: 305, y: 267, w: 205, h: 205, kind: "palm" },
  { src: "Tree top view/Tree top view3.jpg", x: 37, y: 512, w: 230, h: 205, kind: "broadleaf" },
  { src: "Tree top view/Tree top view3.jpg", x: 309, y: 512, w: 202, h: 200, kind: "shrub" },
  { src: "Tree top view/Tree top view3.jpg", x: 43, y: 742, w: 215, h: 215, kind: "sparse" },
  { src: "Tree top view/Tree top view3.jpg", x: 305, y: 740, w: 210, h: 218, kind: "palm" }
];
const canopyCache = new Map();
const treeSpriteImages = new Map();
const processedSpriteCache = new Map();
const GPT_PLANT_SHEET = "assets/gpt-plant-tree-top-sheet.png";
const GPT_PLANT_ASSETS = {
  broadleaf: { col: 0, row: 0, label: "榕樹闊葉 Tree top view" },
  bamboo: { col: 1, row: 0, label: "竹葉叢 Tree top view" },
  cherry: { col: 2, row: 0, label: "櫻花 Tree top view" },
  pine: { col: 0, row: 1, label: "松樹針葉 Tree top view" },
  lotus: { col: 1, row: 1, label: "荷花蓮葉 Tree top view" },
  maple: { col: 2, row: 1, label: "楓樹 Tree top view" }
};
let gptPlantSheetImage = null;
const customPlantImages = new Map();
const customPlantImageElements = new Map();

function normalizedPlantName(value) {
  return Array.from(String(value).trim()).slice(0, 8).join("");
}

function loadCustomPlantImages() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_PLANT_KEY) || "{}");
    Object.entries(saved).forEach(([name, dataUrl]) => {
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
        customPlantImages.set(name, dataUrl);
      }
    });
  } catch {
    localStorage.removeItem(CUSTOM_PLANT_KEY);
  }
}

function saveCustomPlantImages() {
  localStorage.setItem(
    CUSTOM_PLANT_KEY,
    JSON.stringify(Object.fromEntries(customPlantImages))
  );
}

function customPlantImage(name) {
  return customPlantImages.get(normalizedPlantName(name)) || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function splitPlants(value, side) {
  const plants = value
    .split(/[\n,，、;；/|]+|\s{2,}/u)
    .map(item => Array.from(item.trim()).slice(0, 8).join(""))
    .filter(Boolean);

  const fallback = fallbackPlants[side];
  while (plants.length < MAX_ROUNDS) {
    plants.push(fallback[plants.length]);
  }
  return plants.slice(0, MAX_ROUNDS);
}

function hashString(value, salt = 0) {
  let hash = 2166136261 ^ salt;
  for (const char of Array.from(value)) {
    hash ^= char.codePointAt(0) || 0;
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function stat(name, index, salt, min, max) {
  const seed = hashString(name, salt + index * 131);
  return min + (seed % (max - min + 1));
}

function hsl(seed, hueBase, hueRange, sat, light) {
  const hue = hueBase + (seed % hueRange);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

function plantPalette(name, index, side) {
  const seed = hashString(name, 900 + side * 41 + index);
  const base = side === 0 ? 92 : 128;
  return {
    leafA: hsl(seed, base, 34, 43 + (seed % 16), 42 + (seed % 8)),
    leafB: hsl(seed >>> 3, base + 18, 38, 48 + (seed % 16), 58 + (seed % 10)),
    leafC: hsl(seed >>> 6, base - 18, 28, 42 + (seed % 18), 30 + (seed % 7)),
    accent: side === 0 ? "#f3c95e" : "#d87380",
    bark: hsl(seed >>> 9, 32, 15, 42, 33)
  };
}

function plantProfile(name, index, side) {
  const rules = [
    { type: "lotus", keys: ["荷", "蓮", "睡蓮"], label: "荷花蓮葉" },
    { type: "cherry", keys: ["櫻", "桃", "梅", "花", "玫", "牡丹", "杜鵑", "菊", "蘭"], label: "櫻花花冠" },
    { type: "pine", keys: ["松", "杉", "柏", "針", "羅漢"], label: "松樹針葉" },
    { type: "bamboo", keys: ["竹", "椰", "棕", "蒲葵", "蘇鐵", "草", "蘆", "芒", "麥", "稻"], label: "竹葉叢" },
    { type: "maple", keys: ["楓", "槭"], label: "楓樹" },
    { type: "broadleaf", keys: ["榕", "樟", "橡", "梧", "桂", "柳", "樹", "木"], label: "榕樹闊葉" }
  ];
  const rule = rules.find(item => item.keys.some(key => name.includes(key))) || {
    type: "broadleaf",
    label: "闊葉樹"
  };
  const seed = hashString(name, 4400 + side * 97 + index * 13);
  const palettes = {
    cherry: ["#f7a7c7", "#e86e9d", "#ffd7e7", "#6f4d38"],
    flower: ["#e77aa8", "#f2b14f", "#b3417c", "#4d7f3e"],
    pine: ["#1f5e3a", "#2f7d45", "#9fcf7a", "#7a5a35"],
    bamboo: ["#73b85b", "#2f8a42", "#c9e779", "#6f8b3e"],
    lotus: ["#67b985", "#8ed4a8", "#f0a4bf", "#6f7f42"],
    maple: ["#c94d35", "#e39137", "#f0c35a", "#7b4930"],
    palm: ["#88c84f", "#2f8d45", "#cce66f", "#7d6732"],
    grass: ["#8fcf57", "#4f9b42", "#d7e879", "#80763a"],
    willow: ["#8fcf72", "#3f8b52", "#c2dfa0", "#7a5b36"],
    broadleaf: ["#56a64f", "#2f7f43", "#a6d66e", "#6f4f31"]
  };
  const colors = palettes[rule.type];
  return {
    type: rule.type,
    label: rule.label,
    asset: GPT_PLANT_ASSETS[rule.type] || GPT_PLANT_ASSETS.broadleaf,
    seed,
    primary: colors[seed % 3],
    secondary: colors[(seed >>> 3) % 3],
    accent: colors[2],
    bark: colors[3]
  };
}

function svgLeaf(cx, cy, rx, ry, rotate, fill) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rotate} ${cx} ${cy})" fill="${fill}"/>`;
}

function makePlantSvg(plant) {
  const profile = plant.profile;
  const seed = profile.seed;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">`,
    `<rect width="120" height="120" fill="none"/>`,
    `<filter id="soft"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#244a2d" flood-opacity=".18"/></filter>`,
    `<g filter="url(#soft)">`
  ];

  if (profile.type === "pine") {
    for (let i = 0; i < 34; i += 1) {
      const angle = (360 / 34) * i + (seed % 11);
      const len = 33 + ((seed + i * 17) % 22);
      const width = 4 + ((seed + i * 7) % 5);
      parts.push(svgLeaf(60, 60 - len / 2, width, len, angle, i % 3 ? profile.primary : profile.secondary));
    }
  } else if (profile.type === "palm" || profile.type === "bamboo" || profile.type === "grass") {
    const count = profile.type === "bamboo" ? 18 : profile.type === "grass" ? 26 : 16;
    for (let i = 0; i < count; i += 1) {
      const angle = (360 / count) * i + ((seed >>> 2) % 17);
      const len = profile.type === "grass" ? 31 + (i % 9) : 39 + (i % 7);
      const width = profile.type === "bamboo" ? 7 : 5;
      parts.push(svgLeaf(60, 60 - len / 2, width, len, angle, i % 2 ? profile.primary : profile.accent));
    }
  } else if (profile.type === "lotus") {
    for (let i = 0; i < 11; i += 1) {
      const angle = (360 / 11) * i + (seed % 19);
      parts.push(svgLeaf(60, 38, 17, 28, angle, i % 2 ? profile.primary : profile.secondary));
    }
    for (let i = 0; i < 7; i += 1) {
      const angle = (360 / 7) * i + 14;
      parts.push(svgLeaf(60, 46, 9, 18, angle, profile.accent));
    }
  } else if (profile.type === "cherry" || profile.type === "flower") {
    for (let i = 0; i < 28; i += 1) {
      const a = (Math.PI * 2 * i) / 28;
      const ring = 18 + ((seed + i * 23) % 32);
      const cx = 60 + Math.cos(a) * ring;
      const cy = 60 + Math.sin(a) * ring;
      const color = i % 3 === 0 ? profile.accent : i % 2 ? profile.primary : profile.secondary;
      parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${7 + (i % 5)}" fill="${color}"/>`);
    }
    for (let i = 0; i < 18; i += 1) {
      const a = (Math.PI * 2 * i) / 18;
      const ring = 12 + ((seed + i * 11) % 24);
      parts.push(`<circle cx="${(60 + Math.cos(a) * ring).toFixed(1)}" cy="${(60 + Math.sin(a) * ring).toFixed(1)}" r="4" fill="#ffe9a7" opacity=".82"/>`);
    }
  } else if (profile.type === "maple") {
    for (let i = 0; i < 18; i += 1) {
      const angle = (360 / 18) * i + (seed % 13);
      const color = i % 3 === 0 ? profile.accent : i % 2 ? profile.primary : profile.secondary;
      parts.push(`<path d="M60 60 L54 24 L60 32 L67 22 L66 38 L82 28 L73 48 L96 46 L76 60 L95 76 L72 73 L80 96 L64 79 L60 104 L55 78 L38 97 L47 74 L24 76 L44 60 L24 45 L47 48 L38 27 L54 39 Z" transform="rotate(${angle} 60 60) scale(.47 .47) translate(68 68)" fill="${color}" opacity=".84"/>`);
    }
  } else {
    for (let i = 0; i < 34; i += 1) {
      const a = (Math.PI * 2 * i) / 34;
      const ring = 12 + ((seed + i * 19) % 38);
      const cx = 60 + Math.cos(a) * ring;
      const cy = 60 + Math.sin(a) * ring;
      parts.push(svgLeaf(cx.toFixed(1), cy.toFixed(1), 13 + (i % 7), 10 + (i % 6), ((i * 29 + seed) % 180), i % 2 ? profile.primary : profile.secondary));
    }
  }

  parts.push(`<circle cx="60" cy="60" r="8" fill="${profile.bark}" opacity=".74"/>`);
  parts.push(`<circle cx="60" cy="60" r="4" fill="none" stroke="#fff0bc" stroke-opacity=".45" stroke-width="1.5"/>`);
  parts.push(`</g></svg>`);
  return parts.join("");
}

function plantImageStyle(plant) {
  const svg = encodeURIComponent(makePlantSvg(plant));
  return `--plant-image:url('data:image/svg+xml,${svg}')`;
}

function gptPlantAssetStyle(plant) {
  if (plant.customImage) {
    return [
      `--plant-image:url('${plant.customImage}')`,
      "--plant-position:center",
      "--plant-size:contain"
    ];
  }
  const asset = plant.profile.asset;
  const x = asset.col === 0 ? "0%" : asset.col === 1 ? "50%" : "100%";
  const y = asset.row === 0 ? "0%" : "100%";
  return [
    `--plant-image:url('${GPT_PLANT_SHEET}')`,
    `--plant-position:${x} ${y}`,
    `--plant-size:300% 200%`
  ];
}

function selectTreeSprite(name, index, side) {
  const seed = hashString(name, 1200 + index * 17 + side * 97);
  const kindRules = [
    { keys: ["櫻", "桃", "梅", "花", "玫", "牡丹", "杜鵑"], kinds: ["flower"] },
    { keys: ["松", "杉", "柏", "針", "羅漢"], kinds: ["needle", "olive"] },
    { keys: ["竹", "椰", "棕", "蒲葵", "蘇鐵"], kinds: ["palm"] },
    { keys: ["楓", "槭"], kinds: ["maple", "gold"] },
    { keys: ["荷", "蓮", "睡蓮", "草", "蘆"], kinds: ["shrub", "open"] },
    { keys: ["榕", "樟", "橡", "梧", "柳", "桂"], kinds: ["broadleaf", "round", "open"] }
  ];
  const rule = kindRules.find(item => item.keys.some(key => name.includes(key)));
  const pool = rule
    ? TREE_SPRITES.filter(sprite => rule.kinds.includes(sprite.kind))
    : TREE_SPRITES;
  return pool[seed % pool.length];
}

function cssSpriteStyle(sprite) {
  const url = encodeURI(sprite.src);
  const posX = sprite.x / Math.max(1, TREE_SHEET_WIDTH - sprite.w) * 100;
  const posY = sprite.y / Math.max(1, TREE_SHEET_HEIGHT - sprite.h) * 100;
  const sizeX = TREE_SHEET_WIDTH / sprite.w * 100;
  const sizeY = TREE_SHEET_HEIGHT / sprite.h * 100;
  return [
    `--sprite-url:url('${url}')`,
    `--sprite-position:${posX.toFixed(2)}% ${posY.toFixed(2)}%`,
    `--sprite-size:${sizeX.toFixed(2)}% ${sizeY.toFixed(2)}%`
  ];
}

function getSpriteImage(src) {
  if (!treeSpriteImages.has(src)) {
    const image = new Image();
    image.src = src;
    treeSpriteImages.set(src, image);
  }
  return treeSpriteImages.get(src);
}

TREE_SPRITES.forEach(sprite => getSpriteImage(sprite.src));

function getGptPlantSheetImage() {
  if (!gptPlantSheetImage) {
    gptPlantSheetImage = new Image();
    gptPlantSheetImage.src = GPT_PLANT_SHEET;
  }
  return gptPlantSheetImage;
}

function makePlant(name, index, side) {
  const palette = plantPalette(name, index, side);
  const profile = plantProfile(name, index, side);
  const sprite = selectTreeSprite(name, index, side);
  return {
    name,
    index,
    side,
    palette,
    profile,
    sprite,
    customImage: customPlantImage(name),
    crown: stat(name, index, 1, 56, 96),
    roots: stat(name, index, 2, 42, 88),
    spin: stat(name, index, 3, 48, 95),
    resilience: stat(name, index, 4, 50, 98),
    bloom: stat(name, index, 5, 30, 88),
    hp: 100,
    result: ""
  };
}

function makeTeam(inputValue, side) {
  const plants = splitPlants(inputValue, side).map((name, index) => makePlant(name, index, side));
  return {
    side,
    name: plants.map(plant => plant.name).join("、"),
    plants
  };
}

function treeTokenMarkup(plant) {
  const style = [
    `--leaf-a:${plant.palette.leafA}`,
    `--leaf-b:${plant.palette.leafB}`,
    `--leaf-c:${plant.palette.leafC}`,
    `--spin:${hashString(plant.name, plant.index) % 360}deg`,
    ...gptPlantAssetStyle(plant),
    ...cssSpriteStyle(plant.sprite)
  ].join(";");

  return `
    <div class="tree-token use-generated" style="${style}">
      <span>${escapeHtml(plant.name)}</span>
    </div>
  `;
}

function cardMarkup(plant) {
  return `
    <div class="plant-card">
      ${treeTokenMarkup(plant)}
      <div class="plant-stats">
        <strong>${escapeHtml(plant.name)}</strong>
        <div>${plant.customImage ? "自訂圖片" : escapeHtml(plant.profile.label)} Tree top view</div>
        <div>樹冠 ${plant.crown}　旋風 ${plant.spin}</div>
        <div>根系 ${plant.roots}　韌性 ${plant.resilience}</div>
      </div>
    </div>
  `;
}

function renderPreviews() {
  const teamOne = makeTeam(els.playerOneInput.value, 0);
  const teamTwo = makeTeam(els.playerTwoInput.value, 1);
  els.playerOnePreview.innerHTML = teamOne.plants.map(cardMarkup).join("");
  els.playerTwoPreview.innerHTML = teamTwo.plants.map(cardMarkup).join("");
}

function renderCustomPlantList() {
  els.customPlantList.innerHTML = customPlantImages.size
    ? Array.from(customPlantImages, ([name, dataUrl]) => `
        <div class="custom-plant-item">
          <img src="${dataUrl}" alt="${escapeHtml(name)} Tree top view">
          <strong>${escapeHtml(name)}</strong>
          <button class="remove-custom-plant" type="button" data-plant-name="${escapeHtml(name)}" aria-label="移除 ${escapeHtml(name)}">移除</button>
        </div>
      `).join("")
    : "";
}

function setUploadStatus(message, isError = false) {
  els.uploadStatus.textContent = message;
  els.uploadStatus.classList.toggle("error", isError);
}

function imageFileToTreeTop(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("無法讀取圖片。"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("圖片格式無法辨識。"));
      image.onload = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        const localCtx = canvas.getContext("2d");
        canvas.width = size;
        canvas.height = size;
        const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        localCtx.clearRect(0, 0, size, size);
        localCtx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/webp", 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addCustomPlantImage() {
  const name = normalizedPlantName(els.customPlantName.value);
  const file = els.customPlantFile.files[0];
  if (!name) {
    setUploadStatus("請先輸入植物名稱。", true);
    els.customPlantName.focus();
    return;
  }
  if (!file) {
    setUploadStatus("請選擇對應的 Tree top view 圖片。", true);
    return;
  }
  if (!file.type.startsWith("image/")) {
    setUploadStatus("僅支援 PNG、JPG 或 WebP 圖片。", true);
    return;
  }

  els.addPlantImageButton.disabled = true;
  setUploadStatus("正在處理圖片…");
  try {
    const dataUrl = await imageFileToTreeTop(file);
    customPlantImages.set(name, dataUrl);
    customPlantImageElements.delete(name);
    saveCustomPlantImages();
    els.customPlantName.value = "";
    els.customPlantFile.value = "";
    renderCustomPlantList();
    renderPreviews();
    setUploadStatus(`已加入「${name}」，隊伍輸入相同名稱即可使用。`);
  } catch (error) {
    setUploadStatus(error.message || "圖片處理失敗。", true);
  } finally {
    els.addPlantImageButton.disabled = false;
  }
}

function renderRoundProgress() {
  const recent = state.roundWinners
    .slice(-5)
    .map(winner => winner === null ? "－" : winner === 0 ? "●" : "◆")
    .join(" ");
  const displayRound = state.phase === "finished" ? state.round : state.round + 1;
  els.roundProgress.textContent = `${recent || "○"}　第 ${displayRound} 局　${state.wins[0]}：${state.wins[1]} 分（先得 ${WINNING_SCORE} 分）`;
}

function plantStatus(plant, index, activeIndex) {
  if (plant.result) return plant.result;
  if (index === activeIndex && (state.phase === "playing" || state.phase === "launching")) return "出戰中";
  if (index === activeIndex && state.phase === "paused") return "剛出戰";
  return "待命";
}

function renderPanel(panel, team, activeIndex) {
  const active = team.plants[activeIndex] || team.plants[team.plants.length - 1];
  panel.classList.toggle("right-side", team.side === 1);
  panel.innerHTML = `
    <h2>${escapeHtml(team.side === 0 ? "玩家一植物隊" : "玩家二植物隊")}</h2>
    <div class="plant-list">
      ${team.plants.map((plant, index) => `
        <div class="plant-slot ${index === activeIndex ? "active" : ""}">
          <span>${escapeHtml(plant.name)}</span>
          <small>${plantStatus(plant, index, activeIndex)}</small>
        </div>
      `).join("")}
    </div>
    <div class="active-card">
      ${treeTokenMarkup(active)}
      <div class="vitality">${escapeHtml(active.name)}　生命力 <strong>${Math.max(0, Math.round(active.hp))}</strong>%</div>
    </div>
  `;
}

function renderBattleUi() {
  els.leftNameLabel.textContent = "玩家一植物隊";
  els.rightNameLabel.textContent = "玩家二植物隊";
  renderRoundProgress();

  const activeIndex = state.activeIndex % MAX_ROUNDS;
  renderPanel(els.leftPanel, state.teams[0], activeIndex);
  renderPanel(els.rightPanel, state.teams[1], activeIndex);
  els.battleLog.innerHTML = state.log.map(line => `<div>${escapeHtml(line)}</div>`).join("");
  renderRoundOverlay();
  els.nextRoundButton.classList.toggle("hidden", state.phase !== "paused");
}

function renderRoundOverlay() {
  if (state.phase === "launching") {
    els.roundOverlay.innerHTML = `
      <div class="round-overlay-card launch-countdown">
        <strong>${escapeHtml(state.launchText)}</strong>
        <span>雙方準備同時發射</span>
      </div>
    `;
    els.roundOverlay.classList.remove("hidden");
    return;
  }

  if ((state.phase !== "paused" && state.phase !== "finished") || !state.lastResult) {
    els.roundOverlay.classList.add("hidden");
    els.roundOverlay.innerHTML = "";
    return;
  }

  const result = state.lastResult;
  if (result.winner === null) {
    els.roundOverlay.innerHTML = `
      <div class="round-overlay-card">
        <strong>平手・本局不計分</strong>
        <span>目前比數　玩家一 ${state.wins[0]} - ${state.wins[1]} 玩家二</span>
        <span>按下一局重新對戰</span>
      </div>
    `;
    els.roundOverlay.classList.remove("hidden");
    return;
  }
  const winnerPlant = result.winner === 0 ? result.left : result.right;
  const winnerSide = result.winner === 0 ? "玩家一" : "玩家二";
  const closing = state.phase === "finished" ? `${winnerSide}的 ${winnerPlant.name} 帶隊封王` : "按下一局繼續";

  els.roundOverlay.innerHTML = `
    <div class="round-overlay-card">
      <strong>${escapeHtml(result.finish.label)}・${escapeHtml(winnerPlant.name)} +${result.points} 分</strong>
      <span>目前比數　玩家一 ${state.wins[0]} - ${state.wins[1]} 玩家二（先得 ${WINNING_SCORE} 分）</span>
      <span>${escapeHtml(closing)}</span>
    </div>
  `;
  els.roundOverlay.classList.remove("hidden");
}

function resizeCanvasForDpr() {
  const rect = els.canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  els.canvas.width = Math.round(rect.width * dpr);
  els.canvas.height = Math.round(rect.width * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawArenaBase(size) {
  const center = size / 2;
  ctx.clearRect(0, 0, size, size);

  const ground = ctx.createRadialGradient(center, center, 18, center, center, center * 0.96);
  ground.addColorStop(0, "#fffdf0");
  ground.addColorStop(0.42, "#edf7dc");
  ground.addColorStop(0.75, "#d9eee4");
  ground.addColorStop(1, "#bfe0d8");
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(48, 119, 65, 0.24)";
  ctx.lineWidth = 2;
  [0.25, 0.46, 0.67, 0.86].forEach(ratio => {
    ctx.beginPath();
    ctx.arc(center, center, center * ratio, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(103, 183, 189, 0.28)";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(center, center, center * 0.58, Math.PI * 0.16, Math.PI * 1.08);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(center, center);
  ctx.strokeStyle = "rgba(86, 139, 58, 0.42)";
  ctx.lineWidth = Math.max(3, size * 0.008);
  for (let i = 0; i < 36; i += 1) {
    const angle = Math.PI * 2 * i / 36;
    const inner = center * 0.5;
    const outer = center * (i % 3 === 0 ? 0.66 : 0.62);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.74)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 18; i += 1) {
    const angle = Math.PI * 2 * i / 18;
    ctx.beginPath();
    ctx.moveTo(center + Math.cos(angle) * center * 0.13, center + Math.sin(angle) * center * 0.13);
    ctx.lineTo(center + Math.cos(angle) * center * 0.84, center + Math.sin(angle) * center * 0.84);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(47, 94, 54, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function getCanopyBlobs(plant) {
  const key = `${plant.side}-${plant.index}-${plant.name}`;
  if (canopyCache.has(key)) return canopyCache.get(key);

  const seedBase = hashString(plant.name, 303 + plant.index);
  const blobs = [];
  const count = 34 + (seedBase % 13);

  for (let i = 0; i < count; i += 1) {
    const seed = hashString(`${plant.name}-${i}`, seedBase);
    blobs.push({
      angle: (Math.PI * 2 * i) / count + ((seed % 31) - 15) / 100,
      distance: 8 + (seed % 48),
      radius: 13 + (seed % 24),
      squash: 0.74 + ((seed >>> 3) % 34) / 100,
      rotate: (seed % 360) * Math.PI / 180,
      color: seed % 3,
      alpha: 0.78 + ((seed >>> 6) % 18) / 100
    });
  }

  canopyCache.set(key, blobs);
  return blobs;
}

function getProcessedSprite(sprite) {
  const key = `${sprite.src}-${sprite.x}-${sprite.y}-${sprite.w}-${sprite.h}`;
  if (processedSpriteCache.has(key)) return processedSpriteCache.get(key);

  const image = getSpriteImage(sprite.src);
  if (!image.complete || !image.naturalWidth) return null;

  const canvas = document.createElement("canvas");
  const localCtx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = sprite.w;
  canvas.height = sprite.h;
  localCtx.drawImage(image, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h);

  try {
    const imageData = localCtx.getImageData(0, 0, sprite.w, sprite.h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const veryLight = r > 236 && g > 236 && b > 230;
      const paleBackdrop = r > 218 && g > 229 && b > 216 && Math.abs(r - g) < 28 && Math.abs(g - b) < 36;
      if (veryLight || paleBackdrop) {
        data[i + 3] = 0;
      }
    }
    localCtx.putImageData(imageData, 0, 0);
  } catch {
    return image;
  }

  processedSpriteCache.set(key, canvas);
  return canvas;
}

function drawTreeSprite(plant, radius) {
  const sprite = plant.sprite;
  const image = getProcessedSprite(sprite);
  if (!image) return false;

  ctx.save();
  const drawSize = radius * (sprite.kind === "palm" ? 2.65 : 2.38);
  ctx.globalAlpha *= 0.96;
  ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.14;
  ctx.strokeStyle = plant.palette.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.98, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  return true;
}

function drawTopLeaf(x, y, rx, ry, rotation, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMapleBlade(scale, color, rotation) {
  ctx.save();
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(9, -23);
  ctx.lineTo(28, -35);
  ctx.lineTo(21, -11);
  ctx.lineTo(48, -8);
  ctx.lineTo(25, 6);
  ctx.lineTo(38, 29);
  ctx.lineTo(12, 19);
  ctx.lineTo(0, 50);
  ctx.lineTo(-12, 19);
  ctx.lineTo(-38, 29);
  ctx.lineTo(-25, 6);
  ctx.lineTo(-48, -8);
  ctx.lineTo(-21, -11);
  ctx.lineTo(-28, -35);
  ctx.lineTo(-9, -23);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGeneratedPlantTop(plant, radius) {
  const profile = plant.profile;
  const seed = profile.seed;
  const countBase = 20 + (seed % 11);

  ctx.save();
  ctx.globalAlpha *= 0.98;

  if (profile.type === "pine") {
    for (let i = 0; i < 42; i += 1) {
      const angle = (Math.PI * 2 * i) / 42 + (seed % 21) / 100;
      const len = radius * (0.52 + ((seed + i * 17) % 36) / 100);
      const distance = radius * (0.12 + ((seed + i * 11) % 32) / 100);
      drawTopLeaf(Math.cos(angle) * distance, Math.sin(angle) * distance, 4 + (i % 4), len, angle, i % 3 ? profile.primary : profile.secondary, 0.88);
    }
  } else if (profile.type === "palm" || profile.type === "bamboo" || profile.type === "grass") {
    const count = profile.type === "palm" ? 18 : profile.type === "bamboo" ? 24 : 34;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + (seed % 17) / 80;
      const len = radius * (profile.type === "grass" ? 0.46 : 0.68) + (i % 5) * 3;
      const width = profile.type === "bamboo" ? 7 : 4.5;
      drawTopLeaf(Math.cos(angle) * len * 0.28, Math.sin(angle) * len * 0.28, width, len, angle, i % 2 ? profile.primary : profile.accent, 0.9);
    }
  } else if (profile.type === "lotus") {
    for (let i = 0; i < 14; i += 1) {
      const angle = (Math.PI * 2 * i) / 14 + (seed % 19) / 120;
      const dist = radius * (0.22 + (i % 4) * 0.055);
      drawTopLeaf(Math.cos(angle) * dist, Math.sin(angle) * dist, radius * 0.22, radius * 0.35, angle, i % 2 ? profile.primary : profile.secondary, 0.92);
    }
    for (let i = 0; i < 7; i += 1) {
      const angle = (Math.PI * 2 * i) / 7;
      drawTopLeaf(Math.cos(angle) * 9, Math.sin(angle) * 9, 7, 15, angle, profile.accent, 0.86);
    }
  } else if (profile.type === "cherry" || profile.type === "flower") {
    for (let i = 0; i < 38; i += 1) {
      const angle = (Math.PI * 2 * i) / 38;
      const dist = radius * (0.1 + ((seed + i * 23) % 74) / 100);
      const size = 5 + ((seed + i * 7) % 8);
      const color = i % 4 === 0 ? profile.accent : i % 2 ? profile.primary : profile.secondary;
      ctx.save();
      ctx.globalAlpha *= 0.92;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 24; i += 1) {
      const angle = (Math.PI * 2 * i) / 24;
      const dist = radius * (0.16 + (i % 5) * 0.08);
      ctx.fillStyle = "rgba(255, 237, 158, 0.78)";
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (profile.type === "maple") {
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18 + (seed % 11) / 80;
      ctx.save();
      ctx.translate(Math.cos(angle) * radius * 0.22, Math.sin(angle) * radius * 0.22);
      drawMapleBlade(0.42 + (i % 3) * 0.04, i % 3 === 0 ? profile.accent : i % 2 ? profile.primary : profile.secondary, angle);
      ctx.restore();
    }
  } else if (profile.type === "willow") {
    for (let i = 0; i < 32; i += 1) {
      const angle = (Math.PI * 2 * i) / 32;
      const dist = radius * (0.18 + (i % 6) * 0.06);
      drawTopLeaf(Math.cos(angle) * dist, Math.sin(angle) * dist, 5, radius * 0.34, angle + 0.4, i % 2 ? profile.primary : profile.secondary, 0.84);
    }
  } else {
    for (let i = 0; i < countBase + 18; i += 1) {
      const angle = (Math.PI * 2 * i) / (countBase + 18);
      const dist = radius * (0.08 + ((seed + i * 19) % 76) / 100);
      const rx = 10 + (i % 8);
      const ry = 8 + ((seed + i * 5) % 9);
      drawTopLeaf(Math.cos(angle) * dist, Math.sin(angle) * dist, rx, ry, angle + i, i % 2 ? profile.primary : profile.secondary, 0.9);
    }
  }

  ctx.save();
  ctx.globalAlpha *= 0.72;
  ctx.fillStyle = profile.bark;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 244, 197, 0.45)";
  ctx.lineWidth = 1.4;
  [4, 7, 10].forEach(ring => {
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
  ctx.restore();
}

function drawGptPlantTop(plant, radius) {
  if (plant.customImage) {
    let image = customPlantImageElements.get(plant.name);
    if (!image || image.src !== plant.customImage) {
      image = new Image();
      image.src = plant.customImage;
      customPlantImageElements.set(plant.name, image);
    }
    if (!image.complete || !image.naturalWidth) return false;
    const drawSize = radius * 2.62;
    ctx.save();
    ctx.globalAlpha *= 0.98;
    ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
    return true;
  }
  const image = getGptPlantSheetImage();
  if (!image.complete || !image.naturalWidth) return false;

  const asset = plant.profile.asset;
  const cellWidth = image.naturalWidth / 3;
  const cellHeight = image.naturalHeight / 2;
  const sx = asset.col * cellWidth;
  const sy = asset.row * cellHeight;
  const drawSize = radius * 2.62;

  ctx.save();
  ctx.globalAlpha *= 0.98;
  ctx.drawImage(image, sx, sy, cellWidth, cellHeight, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.72;
  ctx.fillStyle = plant.profile.bark;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 244, 197, 0.45)";
  ctx.lineWidth = 1.4;
  [4, 7, 10].forEach(ring => {
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
  return true;
}

function drawTreeTop(top) {
  const plant = top.plant;

  ctx.save();
  ctx.translate(top.x, top.y);
  ctx.globalAlpha = top.alpha;

  ctx.rotate(top.spin);
  ctx.scale(top.scale, top.scale);

  ctx.save();
  ctx.fillStyle = "rgba(88, 58, 32, 0.76)";
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 239, 188, 0.45)";
  ctx.lineWidth = 2;
  [8, 14, 20].forEach(radius => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  if (!drawGptPlantTop(plant, 62)) {
    drawGeneratedPlantTop(plant, 62);
  }

  ctx.restore();
}

function drawBurstPieces(top, burstProgress) {
  const pieceCount = 10;
  const spread = burstProgress * top.radius * 1.25;
  const fade = Math.max(0.08, 1 - burstProgress * 0.82);

  ctx.save();
  ctx.translate(top.x, top.y);
  ctx.globalAlpha = top.alpha * fade;
  ctx.rotate(top.spin);
  ctx.scale(top.scale, top.scale);

  for (let i = 0; i < pieceCount; i += 1) {
    const startAngle = Math.PI * 2 * i / pieceCount;
    const endAngle = Math.PI * 2 * (i + 1) / pieceCount;
    const middleAngle = (startAngle + endAngle) / 2;
    const uneven = 0.72 + (hashString(`${top.plant.name}-burst-${i}`, 822) % 42) / 100;
    const distance = spread * uneven;

    ctx.save();
    ctx.translate(Math.cos(middleAngle) * distance, Math.sin(middleAngle) * distance);
    ctx.rotate((i % 2 === 0 ? 1 : -1) * burstProgress * (0.18 + i * 0.025));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 94, startAngle - 0.025, endAngle + 0.025);
    ctx.closePath();
    ctx.clip();

    if (!drawGptPlantTop(top.plant, 62)) {
      drawGeneratedPlantTop(top.plant, 62);
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawLeafFragment(fragment) {
  ctx.save();
  ctx.translate(fragment.x, fragment.y);
  ctx.rotate(fragment.spin);
  ctx.globalAlpha = fragment.alpha;
  ctx.fillStyle = fragment.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, fragment.w, fragment.h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(48, 84, 43, 0.16)";
  ctx.stroke();
  ctx.restore();
}

function makeFragments(leftPlant, rightPlant, result, size) {
  const center = size / 2;
  const fragments = [];
  [leftPlant, rightPlant].forEach((plant, side) => {
    const count = side === result.winner ? 12 : 24;
    const baseAngle = side === 0 ? Math.PI * 0.72 : Math.PI * 1.72;
    for (let i = 0; i < count; i += 1) {
      const seed = hashString(`${plant.name}-leaf-${i}`, plant.index + 77);
      const angle = baseAngle + (i - count / 2) * 0.09 + (seed % 25) / 90;
      const distance = size * (0.08 + (seed % 180) / 880);
      const color = seed % 3 === 0 ? plant.palette.leafA : seed % 3 === 1 ? plant.palette.leafB : plant.palette.leafC;
      fragments.push({
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance,
        vx: Math.cos(angle) * (0.36 + (seed % 9) / 12),
        vy: Math.sin(angle) * (0.28 + (seed % 8) / 14),
        spin: (seed % 360) * Math.PI / 180,
        spinRate: ((seed % 13) - 6) / 85,
        w: 5 + (seed % 9),
        h: 2 + ((seed >>> 3) % 5),
        color,
        alpha: 0
      });
    }
  });
  return fragments;
}

function spawnTops(leftPlant, rightPlant) {
  const size = els.canvas.getBoundingClientRect().width;
  const center = size / 2;
  return [
    {
      plant: leftPlant,
      x: center - size * 0.15,
      y: center + size * 0.08,
      vx: 1.05 + leftPlant.spin / 95,
      vy: -0.62,
      radius: 48 + leftPlant.crown / 8,
      scale: 0.74 + leftPlant.crown / 260,
      spin: 0,
      spinRate: 0.22 + leftPlant.spin / 480,
      alpha: 1
    },
    {
      plant: rightPlant,
      x: center + size * 0.15,
      y: center - size * 0.06,
      vx: -1.04 - rightPlant.spin / 96,
      vy: 0.68,
      radius: 48 + rightPlant.crown / 8,
      scale: 0.74 + rightPlant.crown / 260,
      spin: 0.82,
      spinRate: -0.21 - rightPlant.spin / 490,
      alpha: 1
    }
  ];
}

function collisionPush(attacker, defender) {
  const force = attacker.plant.crown * 0.36 + attacker.plant.spin * 0.48 + attacker.plant.roots * 0.16;
  const guard = defender.plant.resilience * 0.44 + defender.plant.roots * 0.35;
  return Math.max(0.26, (force - guard * 0.42) / 46);
}

function resolveRound(leftPlant, rightPlant) {
  const leftBefore = leftPlant.hp;
  const rightBefore = rightPlant.hp;
  const leftPower = leftPlant.crown * 0.92 + leftPlant.spin * 0.78 + leftPlant.roots * 0.58 + leftPlant.resilience * 0.72 + leftPlant.bloom * 0.34;
  const rightPower = rightPlant.crown * 0.92 + rightPlant.spin * 0.78 + rightPlant.roots * 0.58 + rightPlant.resilience * 0.72 + rightPlant.bloom * 0.34;
  const leftLuck = ((hashString(leftPlant.name, leftPlant.index + 11) % 19) - 9) * 0.8;
  const rightLuck = ((hashString(rightPlant.name, rightPlant.index + 17) % 19) - 9) * 0.8;
  const leftScore = leftPower + leftLuck;
  const rightScore = rightPower + rightLuck;
  const diff = Math.abs(leftScore - rightScore);
  const isDraw = diff < 2.4;
  const winner = isDraw ? null : leftScore >= rightScore ? 0 : 1;
  const winnerPlant = winner === 0 ? leftPlant : rightPlant;
  const loserPlant = winner === 0 ? rightPlant : leftPlant;
  let finish = { type: "spin", label: "殘存結局 Spin Finish", points: 1 };
  if (!isDraw && diff >= 34 && winnerPlant.spin >= 78) {
    finish = { type: "xtreme", label: "極限結局 Xtreme Finish", points: 3 };
  } else if (!isDraw && diff >= 21 && winnerPlant.crown + winnerPlant.spin >= 150) {
    finish = { type: "burst", label: "爆裂結局 Burst Finish", points: 2 };
  } else if (!isDraw && diff >= 12 && winnerPlant.crown >= loserPlant.resilience - 8) {
    finish = { type: "over", label: "擊飛結局 Over Finish", points: 2 };
  }
  const damage = clamp(Math.round(22 + diff / 3.4), 18, 64);

  if (winner === null) {
    leftPlant.hp = Math.max(16, leftPlant.hp - Math.round(damage * 0.28));
    rightPlant.hp = Math.max(16, rightPlant.hp - Math.round(damage * 0.28));
  } else if (winner === 0) {
    rightPlant.hp = Math.max(0, rightPlant.hp - damage);
    leftPlant.hp = Math.max(16, leftPlant.hp - Math.round(damage * 0.32));
  } else {
    leftPlant.hp = Math.max(0, leftPlant.hp - damage);
    rightPlant.hp = Math.max(16, rightPlant.hp - Math.round(damage * 0.32));
  }

  return {
    winner,
    finish,
    points: isDraw ? 0 : finish.points,
    diff,
    damage,
    left: leftPlant,
    right: rightPlant,
    before: [leftBefore, rightBefore],
    after: [leftPlant.hp, rightPlant.hp]
  };
}

function drawPostRoundScene(result) {
  resizeCanvasForDpr();
  const size = els.canvas.getBoundingClientRect().width;
  const center = size / 2;
  drawArenaBase(size);

  const fragments = makeFragments(result.left, result.right, result, size);
  fragments.forEach((fragment, index) => {
    fragment.alpha = 0.42 + (index % 4) * 0.06;
    fragment.x += fragment.vx * 52;
    fragment.y += fragment.vy * 52;
    fragment.spin += fragment.spinRate * 52;
    drawLeafFragment(fragment);
  });

  const tops = spawnTops(result.left, result.right);
  if (result.winner === null) {
    tops[0].x = center - size * 0.08;
    tops[0].y = center + size * 0.04;
    tops[1].x = center + size * 0.08;
    tops[1].y = center - size * 0.04;
    tops[0].alpha = 0.58;
    tops[1].alpha = 0.58;
    drawTreeTop(tops[0]);
    drawTreeTop(tops[1]);
    return;
  }
  tops[0].x = center - (result.winner === 0 ? size * 0.02 : size * 0.18);
  tops[0].y = center + (result.winner === 0 ? size * 0.04 : size * 0.13);
  tops[0].spin = 2.4;
  tops[0].alpha = result.winner === 0 ? 0.95 : 0.2;
  tops[1].x = center + (result.winner === 1 ? size * 0.02 : size * 0.18);
  tops[1].y = center - (result.winner === 1 ? size * 0.02 : size * 0.12);
  tops[1].spin = -1.7;
  tops[1].alpha = result.winner === 1 ? 0.95 : 0.2;
  if (result.finish.type === "burst") {
    drawBurstPieces(tops[1 - result.winner], 0.92);
  } else {
    drawTreeTop(tops[1 - result.winner]);
  }
  drawTreeTop(tops[result.winner]);
}

function animateRound(leftPlant, rightPlant, result) {
  cancelAnimationFrame(state.animationId);
  resizeCanvasForDpr();
  const size = els.canvas.getBoundingClientRect().width;
  const center = size / 2;
  const limit = center * 0.82;
  const tops = spawnTops(leftPlant, rightPlant);
  const fragments = makeFragments(leftPlant, rightPlant, result, size);
  const duration = result.finish.type === "xtreme" ? 11800 : 10500;
  const trails = [[], []];
  let startTime = 0;
  let previousTime = 0;
  let lastCollision = 0;
  let rushTriggered = false;

  function drawTrail(trail, color) {
    if (trail.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i += 1) {
      const opacity = (i / trail.length) * 0.28;
      ctx.strokeStyle = color.replace(")", ` / ${opacity})`).replace("hsl", "hsl");
      ctx.lineWidth = 2 + i / trail.length * 8;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBattlePhase(progress) {
    const phase = progress < 0.18
      ? "加速軌道・高速進場"
      : progress < 0.72
        ? "連續追撞・攻防拉鋸"
        : progress < 0.9
          ? "極速衝刺・決勝碰撞"
          : result.winner === null
            ? "同步失速・平手"
            : result.finish.label;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `900 ${Math.max(14, size * 0.025)}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 242, 0.9)";
    ctx.strokeStyle = "rgba(31, 72, 42, 0.72)";
    ctx.lineWidth = 5;
    ctx.strokeText(phase, center, size * 0.1);
    ctx.fillText(phase, center, size * 0.1);
    ctx.restore();
  }

  function tick(timestamp) {
    if (!startTime) {
      startTime = timestamp;
      previousTime = timestamp;
    }
    const elapsed = timestamp - startTime;
    const delta = Math.min(34, Math.max(8, timestamp - previousTime)) / 16.667;
    previousTime = timestamp;
    const progress = clamp(elapsed / duration, 0, 1);
    drawArenaBase(size);

    tops.forEach((top, side) => {
      const dxCenter = top.x - center;
      const dyCenter = top.y - center;
      const distCenter = Math.max(1, Math.hypot(dxCenter, dyCenter));
      const tangent = side === 0 ? 1 : -1;

      if (progress < 0.18) {
        top.vx += (-dyCenter / distCenter) * 0.075 * tangent * delta;
        top.vy += (dxCenter / distCenter) * 0.075 * tangent * delta;
      } else if (progress < 0.72) {
        top.vx += (-dxCenter / distCenter) * 0.026 * delta;
        top.vy += (-dyCenter / distCenter) * 0.026 * delta;
      } else {
        const opponent = tops[1 - side];
        const chaseX = opponent.x - top.x;
        const chaseY = opponent.y - top.y;
        const chaseDist = Math.max(1, Math.hypot(chaseX, chaseY));
        top.vx += chaseX / chaseDist * 0.045 * delta;
        top.vy += chaseY / chaseDist * 0.045 * delta;
      }

      const speed = Math.hypot(top.vx, top.vy);
      const maxSpeed = progress < 0.18 ? 5.2 : progress < 0.9 ? 4.6 : 3.4;
      if (speed > maxSpeed) {
        top.vx = top.vx / speed * maxSpeed;
        top.vy = top.vy / speed * maxSpeed;
      }

      top.x += top.vx * delta;
      top.y += top.vy * delta;
      top.spin += top.spinRate * delta;
      top.spinRate *= Math.pow(progress > 0.9 ? 0.97 : 0.9984, delta);

      const dx = top.x - center;
      const dy = top.y - center;
      const dist = Math.hypot(dx, dy);
      if (dist > limit - top.radius * 0.42) {
        const nx = dx / dist;
        const ny = dy / dist;
        top.vx -= nx * 0.34 * delta;
        top.vy -= ny * 0.34 * delta;
        top.vx *= 0.94;
        top.vy *= 0.94;
      }

      trails[side].push({ x: top.x, y: top.y });
      if (trails[side].length > 18) trails[side].shift();
    });

    const a = tops[0];
    const b = tops[1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.radius + b.radius && elapsed - lastCollision > 330) {
      lastCollision = elapsed;
      const nx = dx / Math.max(1, dist);
      const ny = dy / Math.max(1, dist);
      const hitA = collisionPush(b, a);
      const hitB = collisionPush(a, b);
      a.vx -= nx * hitA * 1.35;
      a.vy -= ny * hitA * 1.35;
      b.vx += nx * hitB * 1.35;
      b.vy += ny * hitB * 1.35;
      a.spinRate *= -1.035;
      b.spinRate *= -1.035;
    }

    if (progress > 0.72 && !rushTriggered && result.winner !== null) {
      rushTriggered = true;
      const winnerTop = tops[result.winner];
      const loserTop = tops[1 - result.winner];
      const rushX = loserTop.x - winnerTop.x;
      const rushY = loserTop.y - winnerTop.y;
      const rushDist = Math.max(1, Math.hypot(rushX, rushY));
      winnerTop.vx = rushX / rushDist * 6.2;
      winnerTop.vy = rushY / rushDist * 6.2;
    }

    if (progress > 0.9 && result.winner !== null) {
      const loserTop = tops[1 - result.winner];
      loserTop.alpha = Math.max(0.16, 1 - (progress - 0.9) * 7.4);
      loserTop.spinRate *= Math.pow(0.91, delta);
      if (result.finish.type === "over" || result.finish.type === "xtreme") {
        const awayX = loserTop.x - center;
        const awayY = loserTop.y - center;
        const awayDist = Math.max(1, Math.hypot(awayX, awayY));
        loserTop.vx += awayX / awayDist * 0.18 * delta;
        loserTop.vy += awayY / awayDist * 0.18 * delta;
      }
    } else if (progress > 0.9) {
      tops.forEach(top => {
        top.alpha = Math.max(0.32, 1 - (progress - 0.9) * 5.5);
      });
    }

    if (progress > 0.42) {
      fragments.forEach(fragment => {
        fragment.alpha = Math.min(0.62, fragment.alpha + 0.018 * delta);
        fragment.x += fragment.vx * delta;
        fragment.y += fragment.vy * delta;
        fragment.vy += 0.008 * delta;
        fragment.spin += fragment.spinRate * delta;
      });
    }

    drawTrail(trails[0], "hsl(88 76% 48%)");
    drawTrail(trails[1], "hsl(342 78% 60%)");
    fragments.forEach(drawLeafFragment);
    if (result.finish.type === "burst" && result.winner !== null && progress > 0.88) {
      drawTreeTop(tops[result.winner]);
      drawBurstPieces(tops[1 - result.winner], clamp((progress - 0.88) / 0.12, 0, 1));
    } else {
      drawTreeTop(tops[0]);
      drawTreeTop(tops[1]);
    }
    drawBattlePhase(progress);

    if (progress < 1) {
      state.animationId = requestAnimationFrame(tick);
    } else {
      endRound(result);
    }
  }

  state.animationId = requestAnimationFrame(tick);
}

function makeRoundLog(roundNumber, result) {
  const leftName = result.left.name;
  const rightName = result.right.name;
  if (result.winner === null) {
    return [
      `第 ${roundNumber} 局：${leftName} 對 ${rightName}。`,
      "• 雙方同時達成得分條件，裁判判定平手。",
      "• 本局不計分，輪替後重新對戰。"
    ];
  }
  const winner = result.winner === 0 ? result.left : result.right;
  const loser = result.winner === 0 ? result.right : result.left;
  const lines = [`第 ${roundNumber} 局：${leftName} 對 ${rightName}。`];
  const hitCount = Math.max(3, Math.min(5, Math.round(result.damage / 14)));

  for (let i = 0; i < hitCount; i += 1) {
    const phrase = i % 2 === 0 ? "樹冠外緣擦出一圈葉浪" : "根系重心頂住旋轉";
    lines.push(`• ${phrase}，${winner.name} 保住章心。`);
  }

  lines.push(`• ${result.finish.label}：${winner.name} 取得 ${result.points} 分。`);
  lines.push(`• ${loser.name} 落敗，${winner.name} 勝出本局。`);
  lines.push(`• 生命力：${leftName} ${Math.round(result.after[0])}%，${rightName} ${Math.round(result.after[1])}%`);
  return lines;
}

function endRound(result) {
  const leftPlant = state.teams[0].plants[state.activeIndex];
  const rightPlant = state.teams[1].plants[state.activeIndex];

  if (result.winner !== null) {
    state.wins[result.winner] += result.points;
  }
  state.roundWinners[state.round] = result.winner;
  leftPlant.result = result.winner === null ? "平" : result.winner === 0 ? `+${result.points}` : "敗";
  rightPlant.result = result.winner === null ? "平" : result.winner === 1 ? `+${result.points}` : "敗";
  state.lastResult = result;
  state.log = makeRoundLog(state.round + 1, result);
  state.round += 1;
  drawPostRoundScene(result);

  const finished = state.wins[0] >= WINNING_SCORE || state.wins[1] >= WINNING_SCORE;
  if (finished) {
    finishMatch();
    return;
  }

  state.phase = "paused";
  state.activeIndex = (state.round - 1) % MAX_ROUNDS;
  renderBattleUi();
}

function playRound() {
  if (state.phase === "playing" || state.phase === "launching" || state.phase === "finished") return;
  state.phase = "launching";
  state.activeIndex = state.round % MAX_ROUNDS;
  state.lastResult = null;
  state.launchText = "3";
  state.log = [`第 ${state.round + 1} 局：裁判倒數「3、2、1，Go Shoot！」`];
  renderBattleUi();

  const leftPlant = state.teams[0].plants[state.activeIndex];
  const rightPlant = state.teams[1].plants[state.activeIndex];
  const countdown = ["3", "2", "1", "Go Shoot！"];
  let countdownIndex = 0;

  function advanceCountdown() {
    if (state.phase !== "launching") return;
    state.launchText = countdown[countdownIndex];
    renderBattleUi();
    countdownIndex += 1;
    if (countdownIndex < countdown.length) {
      window.setTimeout(advanceCountdown, 620);
      return;
    }
    window.setTimeout(() => {
      if (state.phase !== "launching") return;
      state.phase = "playing";
      state.launchText = "";
      renderBattleUi();
      const result = resolveRound(leftPlant, rightPlant);
      animateRound(leftPlant, rightPlant, result);
    }, 520);
  }

  advanceCountdown();
}

function finishMatch() {
  state.phase = "finished";
  state.activeIndex = Math.max(0, state.round - 1) % MAX_ROUNDS;
  const winner = state.wins[0] >= WINNING_SCORE ? 0 : 1;

  state.finalWinner = winner;
  const championPlants = state.teams[winner].plants
    .filter(plant => plant.result.startsWith("+"))
    .map(plant => plant.name)
    .join("、") || state.teams[winner].plants[0].name;
  state.log.push(`• 最終勝者：玩家${winner === 0 ? "一" : "二"}植物隊（${state.wins[0]}：${state.wins[1]}），最強樹章：${championPlants}`);
  renderBattleUi();

  if (!state.recordSaved) {
    saveRecord(winner, championPlants);
    state.recordSaved = true;
  }
}

function saveRecord(winner, championPlants) {
  const records = getRecords();
  records.unshift({
    time: new Date().toLocaleString("zh-TW", { hour12: false }),
    left: state.teams[0].name,
    right: state.teams[1].name,
    score: `${state.wins[0]}：${state.wins[1]}`,
    winner: winner === 0 ? "玩家一植物隊" : "玩家二植物隊",
    championPlants
  });
  localStorage.setItem(RECORD_KEY, JSON.stringify(records.slice(0, 18)));
}

function startBattle() {
  cancelAnimationFrame(state.animationId);
  const rosters = [
    splitPlants(els.playerOneInput.value, 0),
    splitPlants(els.playerTwoInput.value, 1)
  ];
  if (rosters.some(names => new Set(names).size < MAX_ROUNDS)) {
    els.modeHint.textContent = "3on3 陣容中的三種植物不可重複，請調整後再開戰。";
    return;
  }
  els.modeHint.textContent = "3on3 輪替賽：雙方各準備三顆不同植物樹章，依序出戰。率先取得 4 分者獲勝。";
  state.teams = [
    makeTeam(els.playerOneInput.value, 0),
    makeTeam(els.playerTwoInput.value, 1)
  ];
  state.round = 0;
  state.wins = [0, 0];
  state.roundWinners = [];
  state.phase = "idle";
  state.activeIndex = 0;
  state.lastResult = null;
  state.finalWinner = null;
  state.recordSaved = false;
  state.launchText = "";
  state.log = ["3on3 第一局準備開始，率先取得 4 分者獲勝。"];

  els.setupView.classList.add("hidden");
  els.battleView.classList.remove("hidden");
  renderBattleUi();
  resizeCanvasForDpr();
  drawArenaBase(els.canvas.getBoundingClientRect().width);
  window.setTimeout(playRound, 500);
}

function nextRound() {
  if (state.phase !== "paused") return;
  state.activeIndex = state.round % MAX_ROUNDS;
  state.log = [`第 ${state.round + 1} 局準備開始，雙方輪替下一順位樹章。`];
  playRound();
}

function backToSetup() {
  cancelAnimationFrame(state.animationId);
  state.phase = "idle";
  els.battleView.classList.add("hidden");
  els.setupView.classList.remove("hidden");
  renderPreviews();
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORD_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderRecords() {
  const records = getRecords();
  els.recordsList.innerHTML = records.length
    ? records.map(record => `
        <div class="record-item">
          <div><strong>${escapeHtml(record.winner)}</strong> 勝出　${escapeHtml(record.score)}</div>
          <div>最強樹章：${escapeHtml(record.championPlants || "")}</div>
          <div>${escapeHtml(record.left)} 對 ${escapeHtml(record.right)}</div>
          <small>${escapeHtml(record.time)}</small>
        </div>
      `).join("")
    : `<div class="empty-records">尚無上場紀錄。</div>`;
}

els.playerOneInput.addEventListener("input", renderPreviews);
els.playerTwoInput.addEventListener("input", renderPreviews);
els.addPlantImageButton.addEventListener("click", addCustomPlantImage);
els.customPlantList.addEventListener("click", event => {
  const button = event.target.closest("[data-plant-name]");
  if (!button) return;
  const name = button.dataset.plantName;
  customPlantImages.delete(name);
  customPlantImageElements.delete(name);
  saveCustomPlantImages();
  renderCustomPlantList();
  renderPreviews();
  setUploadStatus(`已移除「${name}」的自訂圖片。`);
});
els.startButton.addEventListener("click", startBattle);
els.nextRoundButton.addEventListener("click", nextRound);
els.rematchButton.addEventListener("click", startBattle);
els.backButton.addEventListener("click", backToSetup);
els.recordsButton.addEventListener("click", () => {
  renderRecords();
  els.recordsDialog.showModal();
});
els.clearRecordsButton.addEventListener("click", () => {
  localStorage.removeItem(RECORD_KEY);
  renderRecords();
});
window.addEventListener("resize", () => {
  if (!els.battleView.classList.contains("hidden")) {
    if ((state.phase === "paused" || state.phase === "finished") && state.lastResult) {
      drawPostRoundScene(state.lastResult);
    } else {
      resizeCanvasForDpr();
      drawArenaBase(els.canvas.getBoundingClientRect().width);
    }
  }
});

loadCustomPlantImages();
renderCustomPlantList();
renderPreviews();
