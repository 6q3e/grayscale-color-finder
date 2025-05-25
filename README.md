<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js">
</script>
<script type="text/x-mathjax-config">
 MathJax.Hub.Config({
 tex2jax: {
 inlineMath: [['$', '$'] ],
 displayMath: [ ['$$','$$'], ["\\[","\\]"] ]
 }
 });
</script>

# このツールについて

クリックした画像の任意のピクセルのRGB値を取得し、そのグレースケール値に対応する他の色候補を表示します。
画像はモノクロを想定しています。カラーの場合、選択したピクセルをモノクロにしたものに対して処理をします。
カラーとモノクロの変換は次の式を使っています。

$$grayscale = 0.299 * r + 0.587 * g + 0.114 * b$$

## 更新履歴
2025.05.25 公開