const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const colorInfo = document.getElementById('color-info');
const rSlider = document.getElementById('rRange');
const gSlider = document.getElementById('gRange');
const bSlider = document.getElementById('bRange');
const rVal = document.getElementById('rValue');
const gVal = document.getElementById('gValue');
const bVal = document.getElementById('bValue');
const colorPreview = document.getElementById('colorPreview');
const colorInfoOut = document.getElementById('colorInfoOut');
const palette = document.getElementById('colorPalette');
const pctx = palette.getContext('2d');

let targetGray = null;

imageLoader.addEventListener('change', handleImage);
canvas.addEventListener('click', handleClick);
rSlider.addEventListener('input', updateColor);
gSlider.addEventListener('input', updateColor);
bSlider.addEventListener('input', updateColor);

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

function handleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const [r, g, b] = pixel;
  targetGray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  
  colorInfo.innerHTML = `
    <p>クリック座標: (${Math.floor(x)}, ${Math.floor(y)})</p>
    <p>RGB: ${r}, ${g}, ${b}</p>
    <p>グレースケール値: ${targetGray}</p>
  `;

  // 初期表示をクリック色に
  rSlider.value = r;
  gSlider.value = g;
  bSlider.value = b;
  updateColor();
  drawPalette();
}

function updateColor() {
  let R = parseInt(rSlider.value);
  let G = parseInt(gSlider.value);
  let B = parseInt(bSlider.value);

  if (targetGray !== null) {
    // Bを計算し直すことで制約のあるスライド
    const calcGray = 0.299 * R + 0.587 * G + 0.114 * B;
    const diff = Math.abs(calcGray - targetGray);
    if (diff > 1) {
      B = Math.max(0, Math.min(255, Math.round((targetGray - 0.299 * R - 0.587 * G) / 0.114)));
      bSlider.value = B;
    }
  }

  rVal.textContent = R;
  gVal.textContent = G;
  bVal.textContent = B;

  const hex = `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
  colorPreview.style.backgroundColor = `rgb(${R},${G},${B})`;
  colorInfoOut.innerHTML = `RGB: (${R}, ${G}, ${B})<br>HEX: ${hex}`;
  drawPalette(R, G, B);
}

function drawPalette(currentR = 0, currentG = 0, currentB = 0) {
  if (targetGray === null) return;
  for (let x = 0; x < 256; x++) {
    for (let y = 0; y < 256; y++) {
      const b = 255 - y; // 下が0、上が255に
      const r = x;
      const g = Math.max(0, Math.min(255, Math.round((targetGray - 0.299 * r - 0.114 * b) / 0.587)));
      if (g >= 0 && g <= 255) {
        pctx.fillStyle = `rgb(${r},${g},${b})`;
        pctx.fillRect(x, y, 1, 1);
      } else {
        pctx.fillStyle = '#ffffff';
        pctx.fillRect(x, y, 1, 1);
      }
    }
  }
  // 現在の位置を赤でマーク
  const markX = currentR;
  const markY = 255 - currentB;
  pctx.strokeStyle = 'red';
  pctx.lineWidth = 1;
  pctx.strokeRect(markX - 2, markY - 2, 4, 4);
}