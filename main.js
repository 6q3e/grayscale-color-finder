const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const colorInfo = document.getElementById('color-info');

let currentGray = null;

imageLoader.addEventListener('change', handleImage, false);
canvas.addEventListener('click', handleClick);

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
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
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  currentGray = gray;

  renderSliders(r, g, b, gray, x, y);
}

function renderSliders(r, g, b, gray, x, y) {
  colorInfo.innerHTML = `
    <p>クリック座標: (${Math.floor(x)}, ${Math.floor(y)})</p>
    <p>RGB: ${r}, ${g}, ${b}</p>
    <p>グレースケール値: ${gray}</p>
    <p>このグレーになる色候補（例）:</p>
    <div class="color-box" style="background-color: rgb(${gray},0,0);"></div>
    <div class="color-box" style="background-color: rgb(0,${gray},0);"></div>
    <div class="color-box" style="background-color: rgb(0,0,${gray});"></div>
    
    <div id="sliders">
      <p>RGBスライダー（1つを調整）</p>
      <label>R: <input type="range" id="rSlider" min="0" max="255" value="${r}"> <span id="rVal">${r}</span></label><br>
      <label>G: <input type="range" id="gSlider" min="0" max="255" value="${g}"> <span id="gVal">${g}</span></label><br>
      <label>B: <input type="range" id="bSlider" min="0" max="255" value="${b}"> <span id="bVal">${b}</span></label><br><br>
      <div class="color-box" id="previewBox"></div>
      <p id="colorResult"></p>
    </div>
  `;

  const rSlider = document.getElementById("rSlider");
  const gSlider = document.getElementById("gSlider");
  const bSlider = document.getElementById("bSlider");
  const rVal = document.getElementById("rVal");
  const gVal = document.getElementById("gVal");
  const bVal = document.getElementById("bVal");
  const previewBox = document.getElementById("previewBox");
  const colorResult = document.getElementById("colorResult");

  function updateColorFromSlider(changed) {
    let R = parseInt(rSlider.value);
    let G = parseInt(gSlider.value);
    let B = parseInt(bSlider.value);

    // グレー値と一致させるよう残り2色を自動計算
    if (changed === "R") {
      B = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
      B = Math.max(0, Math.min(255, B));
      bSlider.value = B;
      bVal.textContent = B;
    } else if (changed === "G") {
      B = Math.round((gray - 0.299 * R - 0.587 * G) / 0.114);
      B = Math.max(0, Math.min(255, B));
      bSlider.value = B;
      bVal.textContent = B;
    } else if (changed === "B") {
      G = Math.round((gray - 0.299 * R - 0.114 * B) / 0.587);
      G = Math.max(0, Math.min(255, G));
      gSlider.value = G;
      gVal.textContent = G;
    }

    rVal.textContent = R;
    gVal.textContent = G;
    bVal.textContent = B;

    previewBox.style.backgroundColor = `rgb(${R},${G},${B})`;
    const hex = `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`.toUpperCase();
    colorResult.innerHTML = `RGB: (${R}, ${G}, ${B})<br>HEX: ${hex}`;
  }

  rSlider.addEventListener("input", () => updateColorFromSlider("R"));
  gSlider.addEventListener("input", () => updateColorFromSlider("G"));
  bSlider.addEventListener("input", () => updateColorFromSlider("B"));
}