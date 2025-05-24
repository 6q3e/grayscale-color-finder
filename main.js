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

let lastValidRGB = { R: 128, G: 128, B: 128 }; // 最後に有効だったRGBを記録

// === 追加: ズーム・ドラッグ処理 ===
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let img = null;

// ページロード時に関連UIを非表示にする
const colorTools = document.getElementById('colorTools');
colorTools.style.display = 'none';

imageLoader.addEventListener('change', handleImage);
imageCanvas.addEventListener('click', handleCanvasClick);
rSlider.addEventListener('input', () => handleSliderInput('R'));
gSlider.addEventListener('input', () => handleSliderInput('G'));
bSlider.addEventListener('input', () => handleSliderInput('B'));

const canvasWrapper = document.getElementById("canvasWrapper");

imageCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    imageCanvas.classList.add('dragging');
  });
  
  imageCanvas.addEventListener('mouseup', () => {
    isDragging = false;
    imageCanvas.classList.remove('dragging');
  });
  
  imageCanvas.addEventListener('mouseleave', () => {
    isDragging = false;
    imageCanvas.classList.remove('dragging');
  });
  
  imageCanvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !img) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    offsetX -= dx / scale;
    offsetY -= dy / scale;
    clampOffset();
    drawImage();
  });
  
  imageCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = clamp(scale + delta, 0.1, 10);
    scale = newScale;
    clampOffset();
    drawImage();
  }, { passive: false });

function clampOffset() {
    if (!img) return;
    const maxX = Math.max(0, img.width - imageCanvas.width / scale);
    const maxY = Math.max(0, img.height - imageCanvas.height / scale);
    offsetX = clamp(offsetX, 0, maxX);
    offsetY = clamp(offsetY, 0, maxY);
}
  
function drawImage() {
    if (!img) return;
    const w = imageCanvas.width;
    const h = imageCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.drawImage(img, -offsetX, -offsetY);
    ctx.restore();
}

function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
      img = new Image();
      img.onload = function() {
        imageCanvas.width = Math.min(img.width, 800);
        imageCanvas.height = Math.min(img.height, 600);
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        drawImage();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
}  

function updateTransform() {
    imageCanvas.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
  }

function handleCanvasClick(e) {
    document.getElementById("colorTools").classList.remove('hidden');
  
    const rect = imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;
    currentGray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  
    // ここで lastValidRGB を更新！
    lastValidRGB = { R: r, G: g, B: b };
  
    colorInfo.innerHTML = `
      <p>クリック座標: (${Math.floor(x)}, ${Math.floor(y)})</p>
      <p>RGB: ${r}, ${g}, ${b}</p>
      <p>グレースケール値: ${currentGray}</p>
    `;
  
    rSlider.value = r;
    gSlider.value = g;
    bSlider.value = b;
  
    colorTools.style.display = 'block';
  
    // handleSliderInputを呼び出して色を整える
    handleSliderInput(null);
  }  

  function handleSliderInput(changed) {
    if (lock) return;
    lock = true;
  
    let R = parseInt(rSlider.value);
    let G = parseInt(gSlider.value);
    let B = parseInt(bSlider.value);
  
    let gray = currentGray;
  
    let newR = R, newG = G, newB = B;
  
    if (changed === 'R') {
      newB = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
    } else if (changed === 'G') {
      newB = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
    } else if (changed === 'B') {
      newG = Math.round((gray - 0.299 * R - 0.114 * B) / 0.587);
    }
  
    // 制限チェック
    if (newR < 0 || newR > 255 || newG < 0 || newG > 255 || newB < 0 || newB > 255) {
      // 不正な値 → スライダーも前回の値に戻す
      rSlider.value = lastValidRGB.R;
      gSlider.value = lastValidRGB.G;
      bSlider.value = lastValidRGB.B;
  
      rValue.textContent = lastValidRGB.R;
      gValue.textContent = lastValidRGB.G;
      bValue.textContent = lastValidRGB.B;
  
      colorPreview.style.backgroundColor = `rgb(${lastValidRGB.R},${lastValidRGB.G},${lastValidRGB.B})`;
      const hex = `#${toHex(lastValidRGB.R)}${toHex(lastValidRGB.G)}${toHex(lastValidRGB.B)}`;
      colorInfoOut.innerHTML = `RGB: (${lastValidRGB.R}, ${lastValidRGB.G}, ${lastValidRGB.B})<br>HEX: ${hex}`;
  
      drawColorPalette(lastValidRGB.R, lastValidRGB.G, lastValidRGB.B);
      lock = false;
      return;
    }
  
    // 有効な値なら更新
    lastValidRGB = { R: newR, G: newG, B: newB };
  
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