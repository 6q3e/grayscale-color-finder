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

let crosshairPos = null; // 赤十字の表示位置

let lastValidRGB = { R: 128, G: 128, B: 128 }; // 最後に有効だったRGBを記録

// === 追加: ズーム・ドラッグ処理 ===
let scale = 1;
let minScale = 1;
let originX = 0;
let originY = 0;
let dragging = false;
let dragStart = { x: 0, y: 0 };
let canvasImage = null;

// ページロード時に関連UIを非表示にする
const colorTools = document.getElementById('colorTools');
colorTools.style.display = 'none';

imageLoader.addEventListener('change', handleImage);
imageCanvas.addEventListener('click', handleCanvasClick);
rSlider.addEventListener('input', () => handleSliderInput('R'));
gSlider.addEventListener('input', () => handleSliderInput('G'));
bSlider.addEventListener('input', () => handleSliderInput('B'));

const canvasWrapper = document.getElementById("canvasWrapper");

imageCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    const rect = imageCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + canvasWrapper.scrollLeft;
    const mouseY = e.clientY - rect.top + canvasWrapper.scrollTop;

    const xRatio = mouseX / (imageCanvas.width);
    const yRatio = mouseY / (imageCanvas.height);

    const oldScale = scale;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(minScale, scale + delta);
    if (scale === oldScale) return;

    const newWidth = canvasImage.width * scale;
    const newHeight = canvasImage.height * scale;

    imageCanvas.width = newWidth;
    imageCanvas.height = newHeight;

    // スクロール位置を補正
    canvasWrapper.scrollLeft = (newWidth * xRatio) - (rect.width / 2);
    canvasWrapper.scrollTop = (newHeight * yRatio) - (rect.height / 2);

    drawImage();
});
  
  // ドラッグによる移動
  imageCanvas.addEventListener("mousedown", (e) => {
    dragging = true;
    dragStart.x = e.clientX + canvasWrapper.scrollLeft;
    dragStart.y = e.clientY + canvasWrapper.scrollTop;
  });
  
  imageCanvas.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX + canvasWrapper.scrollLeft - dragStart.x;
    const dy = e.clientY + canvasWrapper.scrollTop - dragStart.y;
  
    canvasWrapper.scrollLeft -= dx;
    canvasWrapper.scrollTop -= dy;
  
    dragStart.x = e.clientX + canvasWrapper.scrollLeft;
    dragStart.y = e.clientY + canvasWrapper.scrollTop;
  });
  
  window.addEventListener("mouseup", () => {
    dragging = false;
  });

function clampOffset() {
    if (!img) return;
    const maxX = Math.max(0, img.width - imageCanvas.width / scale);
    const maxY = Math.max(0, img.height - imageCanvas.height / scale);
    offsetX = clamp(offsetX, 0, maxX);
    offsetY = clamp(offsetY, 0, maxY);
}
  
function drawImage() {
    if (!canvasImage) return;

    const width = canvasImage.width * scale;
    const height = canvasImage.height * scale;

    imageCanvas.width = width;
    imageCanvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(canvasImage, 0, 0, width, height);

    if (crosshairPos) {
        const x = crosshairPos.x * scale;
        const y = crosshairPos.y * scale;

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
    }
}


function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        canvasImage = img;
  
        // 画像のサイズとwrapperのサイズを比較して、最小ズーム倍率を設定
        const wrapperW = canvasWrapper.clientWidth;
        const wrapperH = canvasWrapper.clientHeight;
        const scaleX = wrapperW / img.width;
        const scaleY = wrapperH / img.height;
  
        minScale = Math.min(scaleX, scaleY, 1); // 全体が収まる最小の倍率（ただし1未満なら縮小）
        scale = minScale;
  
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

    const originalX = x / scale;
    const originalY = y / scale;
    crosshairPos = { x: originalX, y: originalY };
  
    // ここで lastValidRGB を更新！
    lastValidRGB = { R: r, G: g, B: b };

    // 表示の更新
    const grayHex = `#${toHex(currentGray)}${toHex(currentGray)}${toHex(currentGray)}`;
    document.getElementById('grayscaleBox').style.backgroundColor = grayHex;

  
    colorInfo.innerHTML = `
      <p>クリック座標: (${Math.floor(originalX)}, ${Math.floor(originalY)})<br>
      RGB: (${r}, ${g}, ${b})<br>
      HEX: #${toHex(r)}${toHex(g)}${toHex(b)}<br>
      グレースケールRGB: (${currentGray}, ${currentGray}, ${currentGray})<br>
      グレースケールHEX: #${toHex(currentGray)}${toHex(currentGray)}${toHex(currentGray)}</p>
    `;
  
    rSlider.value = r;
    gSlider.value = g;
    bSlider.value = b;
  
    colorTools.style.display = 'block';
  
    // handleSliderInputを呼び出して色を整える
    handleSliderInput(null);
    drawImage(); // 十字表示のため再描画
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

fetch("https://raw.githubusercontent.com/6q3e/grayscale-color-finder/main/README.md")
  .then(response => response.text())
  .then(markdown => {
    const html = marked.parse(markdown);
    document.getElementById("readmeContent").innerHTML = html;
  })
  .catch(error => {
    document.getElementById("readmeContent").textContent = "READMEを読み込めませんでした。";
    console.error(error);
  });

  fetch('https://raw.githubusercontent.com/6q3e/grayscale-color-finder/main/README.md')
  .then(response => response.text())
  .then(text => {
    const html = marked.parse(text);
    document.getElementById('readmeContent').innerHTML = html;

    // MathJax がロードされていれば再処理
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    }
  });