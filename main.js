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
  document.getElementById("colorTools").classList.remove('hidden');

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

  handleSliderInput(null);
}

function handleSliderInput(changed) {
    if (lock) return;
    lock = true;
  
    // 現在のスライダー値を取得
    let inputR = parseInt(rSlider.value);
    let inputG = parseInt(gSlider.value);
    let inputB = parseInt(bSlider.value);
  
    let R = inputR, G = inputG, B = inputB;
  
    const gray = currentGray;
  
    // 一時的に計算
    let calcR = R, calcG = G, calcB = B;
  
    if (changed === 'R') {
      calcB = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
    } else if (changed === 'G') {
      calcB = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
    } else if (changed === 'B') {
      calcG = Math.round((gray - 0.299 * R - 0.114 * B) / 0.587);
    }
  
    // 条件チェック：いずれかが範囲外なら打ち消す
    if (
      calcR < 0 || calcR > 255 ||
      calcG < 0 || calcG > 255 ||
      calcB < 0 || calcB > 255
    ) {
      // 元の状態に戻す
      rSlider.value = R;
      gSlider.value = G;
      bSlider.value = B;
      lock = false;
      return;
    }
  
    // 新しいRGBとして代入（ここまで来たら条件を満たしている）
    R = clamp(calcR, 0, 255);
    G = clamp(calcG, 0, 255);
    B = clamp(calcB, 0, 255);
  
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