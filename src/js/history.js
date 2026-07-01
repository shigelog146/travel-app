/* ===========================
             デリートログ
          =========================== */
async function deleteLog(id) {
  if (!confirm("削除しますか？")) {
    return;
  }

  const { error } = await deleteTravelLog(id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("削除しました");

  await loadLogs();
}

window.deleteLog = deleteLog;

/* ===========================
             ロードログ
          =========================== */
async function loadLogs() {
  console.log("loadLogs開始");

  console.log(document.getElementById("historyArea"));

  console.log(document.getElementById("logCount"));

  // 履歴表示初期化
  document.getElementById("historyArea").innerHTML = "";

  // ルート初期化
  routePoints = [];

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  // CircleMarker削除
  map.eachLayer(function (layer) {
    if (layer instanceof L.CircleMarker) {
      map.removeLayer(layer);
    }
  });

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return;
  }

  const { data, error } = await getTravelLogs(session.user.id);

  if (error) {
    console.error(error);
    return;
  }

  console.log("Supabase取得成功", data.length);

  // 次回追加
  const visibleLogs = data.filter((log) => log.memo !== "自動記録");

  document.getElementById("logCount").innerHTML = visibleLogs.length;

  // =====================
  // 地図表示
  // =====================

  console.log("読み込んだ件数", data.length);

  console.log(data[0]);

  data.forEach((log) => {
    addMarker(log.latitude, log.longitude, log.memo, null);
  });

  // =====================
  // ルート線
  // =====================

  routePoints = data.map((log) => [log.latitude, log.longitude]);

  drawRoute();

  // 次回追加
  // =====================
  // 履歴は手動記録のみ
  // =====================

  let historyHtml = "";

  visibleLogs.slice(0, 50).forEach((log) => {
    historyHtml += `
<div style="
    border:1px solid #ddd;
    border-radius:8px;
    padding:10px;
    margin-top:10px;
">

    <b>
        ${new Date(log.created_at).toLocaleString()}
    </b>

    <br><br>

    ${log.memo || "メモなし"}

    <br><br>

    ${
      log.image_url
        ? `
<button
    onclick="showImage('${log.image_url}')">
    写真を見る
</button>
`
        : ""
    }

    <button onclick="deleteLog(${log.id})">
        削除
    </button>

</div>
`;
  });

  console.log("historyHtml文字数", historyHtml.length);

  document.getElementById("historyArea").innerHTML = historyHtml;
}

window.loadLogs = loadLogs;
