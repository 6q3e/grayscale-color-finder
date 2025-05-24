// main.js

let imageCanvas = document.getElementById('imageCanvas');
let ctx = imageCanvas.getContext('2d');
let colorInfo = document.getElementById('color-info');
let imageLoader = document.getElementById('imageLoader');

let rSlider = document.getElementById('rRange');
let gSlider = document.getElementById('gRange');
let bSlider = document.getElementById('bRange');

let rValue = document.getElementById('rValue');
let gValue = document.getElementById('gValue');
let bValue = document.getElementById('bValue');

let colorPreview = document.getElementById('colorPreview');
let colorInfoOut = document.getElementById('colorInfoOut');
let colorPalette = document.getElementById('colorPalette');

let currentGray = 128;

imageLoader.addEventListener('change', handleImage);
imageCanvas.addEventListener('click', handleCanvasClick);
rSlider.addEventListener('input', updateColorFromSlider);
gSlider.addEventListener('input', updateColorFromSlider);
bSlider.addEventListener('input', updateColorFromSlider);

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

function handleCanvasClick(e) {
  const rect = imageCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const [r, g, b] = pixel;
  currentGray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

  colorInfo.innerHTML = `
    <p>クリック座標: (${Math.floor(x)}, ${Math.floor(y)})</p>
    <p>RGB: ${r}, ${g}, ${b}</p>
    <p>グレースケール値: ${currentGray}</p>
  `;

  rSlider.value = gSlider.value = bSlider.value = currentGray;
  updateColorFromSlider();
}

function updateColorFromSlider() {
  let R = parseInt(rSlider.value);
  let G = parseInt(gSlider.value);
  let B = parseInt(bSlider.value);

  // 制約を計算して値を調整
  [R, G, B] = adjustRGBWithinGray(R, G, B, currentGray);

  rSlider.value = R;
  gSlider.value = G;
  bSlider.value = B;

  rValue.textContent = R;
  gValue.textContent = G;
  bValue.textContent = B;

  colorPreview.style.backgroundColor = `rgb(${R},${G},${B})`;
  const hex = `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  colorInfoOut.innerHTML = `RGB: (${R}, ${G}, ${B})<br>HEX: ${hex}`;

  drawColorPalette(R, G, B);
}

function adjustRGBWithinGray(R, G, B, gray) {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  let grayTarget = gray;

  // R制約（GとBが固定）
  let rMin = (grayTarget - 0.587 * G - 0.114 * B) / 0.299;
  let rMax = rMin;

  // G制約（RとBが固定）
  let gMin = (grayTarget - 0.299 * R - 0.114 * B) / 0.587;
  let gMax = gMin;

  // B制約（RとGが固定）
  let bMin = (grayTarget - 0.299 * R - 0.587 * G) / 0.114;
  let bMax = bMin;

  R = clamp(Math.round(R), Math.floor(rMin), Math.ceil(rMin));
  G = clamp(Math.round(G), Math.floor(gMin), Math.ceil(gMin));
  B = clamp(Math.round(B), Math.floor(bMin), Math.ceil(bMin));

  return [R, G, B];
}

function drawColorPalette(R, G, B) {
  const w = colorPalette.width;
  const h = colorPalette.height;
  const ctxP = colorPalette.getContext('2d');

  const imageData = ctxP.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.floor((x / w) * 255);
      const g = Math.floor((y / h) * 255);
      const b = Math.max(0, Math.min(255, Math.round((currentGray - 0.299 * r - 0.587 * g) / 0.114)));

      const idx = (y * w + x) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }

  ctxP.putImageData(imageData, 0, 0);

  // 赤い枠を描画
  const posX = Math.round((R / 255) * w);
  const posY = Math.round((G / 255) * h);
  ctxP.strokeStyle = 'red';
  ctxP.lineWidth = 2;
  ctxP.strokeRect(posX - 5, posY - 5, 10, 10);
}

function toHex(n) {
  return n.toString(16).padStart(2, '0');
}

// 初期化
drawColorPalette(currentGray, currentGray, currentGray);
updateColorFromSlider();