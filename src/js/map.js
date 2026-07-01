// ===========================
// 地図関係
// ===========================

console.log("map.js 読み込み成功");

/* ===========================
             ルート線表示
          =========================== */
function drawRoute() {
  console.log(JSON.stringify(routePoints));
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  if (routePoints.length < 2) {
    return;
  }

  routeLine = L.polyline(routePoints, {
    weight: 5,
  }).addTo(map);
}

/* ===========================
             マーカー表示
          =========================== */
function addMarker(lat, lng, memo, imageUrl) {
  let html = "";

  if (memo) {
    html += "<b>メモ</b><br>" + memo + "<br><br>";
  }

  if (imageUrl) {
    html += "<img src='" + imageUrl + "' style='width:200px'>";
  }

  L.circleMarker([lat, lng], {
    radius: 8,
  })
    .addTo(map)
    .bindPopup(html);
}

/* ===========================
             地図初期化
          =========================== */

async function initMap() {
  if (map) {
    return;
  }

  map = L.map("map", {
    gestureHandling: true,
    scrollWheelZoom: false,
  }).setView([35.138, 132.225], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  getCurrentLocation();
}

/* ===========================
現在地取得
=========================== */

window.drawRoute = drawRoute;
window.addMarker = addMarker;
window.initMap = initMap;
