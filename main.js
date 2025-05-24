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
let lock = false;

// ページロード時に関連UIを非表示にする
const colorTools = document.getElementById('colorTools');
colorTools.style.display = 'none';

imageLoader.addEventListener('change', handleImage);
imageCanvas.addEventListener('click', handleCanvasClick);
rSlider.addEventListener('input', () => handleSliderInput('R'));
gSlider.addEventListener('input', () => handleSliderInput('G'));
bSlider.addEventListener('input', () => handleSliderInput('B'));

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

  rSlider.value = r;
  gSlider.value = g;
  bSlider.value = b;

  // UI を表示
  colorTools.style.display = 'block';

  updateColorFromSlider();
}

function handleSliderInput(changed) {
  if (lock) return;
  lock = true;

  let R = parseInt(rSlider.value);
  let G = parseInt(gSlider.value);
  let B = parseInt(bSlider.value);

  const gray = currentGray;

  let newR = R, newG = G, newB = B;
  if (changed === 'R') {
    newB = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
  } else if (changed === 'G') {
    newB = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
  } else if (changed === 'B') {
    newG = Math.round((gray - 0.299 * R - 0.114 * B) / 0.587);
  }

  newR = clamp(newR, 0, 255);
  newG = clamp(newG, 0, 255);
  newB = clamp(newB, 0, 255);

  rSlider.value = newR;
  gSlider.value = newG;
  bSlider.value = newB;

  rValue.textContent = newR;
  gValue.textContent = newG;
  bValue.textContent = newB;

  colorPreview.style.backgroundColor = `rgb(${newR},${newG},${newB})`;
  const hex = `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  colorInfoOut.innerHTML = `RGB: (${newR}, ${newG}, ${newB})<br>HEX: ${hex}`;

  drawColorPalette(newR, newG, newB);

  lock = false;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
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

  const posX = Math.round((R / 255) * w);
  const posY = Math.round((G / 255) * h);
  ctxP.strokeStyle = 'red';
  ctxP.lineWidth = 2;
  ctxP.strokeRect(posX - 5, posY - 5, 10, 10);
}

function toHex(n) {
  return n.toString(16).padStart(2, '0');
}