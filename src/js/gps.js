console.log("gps.js 読み込み成功");

let lastGpsTime = null;
async function initBackgroundGPS() {
  try {
    const bg = window.BackgroundGeolocation;

    const state = await bg.ready({
      options: {
        distanceFilter: 200,

        stopOnTerminate: false,

        startOnBoot: true,
      },
    });

    //  alert("READY成功");

    console.log(JSON.stringify(state, null, 2));

    await bg.start();
    const currentState = await bg.getState();

    console.log("CURRENT STATE", currentState);

    // ======================
    // 起動直後の現在地を1回保存
    // ======================

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,

          reject,

          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          },
        );
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      console.log("初回GPS保存", lat, lng);

      // 現在地マーカー
      if (!currentMarker) {
        currentMarker = L.marker([lat, lng], {
          draggable: false,
          icon: redIcon,
        })
          .addTo(map)
          .bindPopup("現在地");
      } else {
        currentMarker.setLatLng([lat, lng]);
      }

      // 地図中央へ
      map.panTo([lat, lng]);

      // DB保存
      await autoSaveLocation(lat, lng, Date.now());

      // 地図へ追加
      addMarker(lat, lng, "自動記録", null);
    } catch (e) {
      console.log("初回GPS取得失敗", e);
    }

    const subscription = bg.onLocation(
      async (location) => {
        console.log("★★★★★ BG onLocation 発生 ★★★★★");

        const lat = location.coords.latitude;
        const lng = location.coords.longitude;
        if (lastGpsTime === location.timestamp) {
          console.log("重複GPSをスキップ");
          return;
        }

        lastGpsTime = location.timestamp;

        console.log("LOCATION", location);

        // ======================
        // 現在地マーカー更新
        // ======================

        if (!currentMarker) {
          currentMarker = L.marker([lat, lng], {
            draggable: false,
            icon: redIcon,
          })
            .addTo(map)
            .bindPopup("現在地");
        } else {
          currentMarker.setLatLng([lat, lng]);
        }

        // ======================
        // 地図を現在地へ移動
        // ======================

        map.panTo([lat, lng]);

        // ======================
        // 自動保存
        // ======================

        await autoSaveLocation(lat, lng, location.timestamp);
      },

      (error) => {
        alert("LOCATION ERROR\n" + JSON.stringify(error));

        console.error(error);
      },
    );

    alert("location listener登録完了");
  } catch (e) {
    alert("ERROR=\n" + e + "\n\nMESSAGE=\n" + e.message);

    console.error(e);
  }
}

async function autoSaveLocation(lat, lng, gpsTime) {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    console.log("BG保存失敗: sessionなし");
    return;
  }

  const { data, error } = await saveTravelLog({
    user_id: session.user.id,

    latitude: lat,

    longitude: lng,

    memo: "自動記録",

    gps_time: new Date(gpsTime).toISOString(),
  });

  if (error) {
    console.error("BG保存失敗", error);
  } else {
    console.log("BG保存成功", data);
    // ★ここを追加
    await window.loadLogs();
  }
}
/* ===========================
現在地取得
=========================== */
function getCurrentLocation() {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const lat = position.coords.latitude;

      const lng = position.coords.longitude;

      map.setView([lat, lng], 15);

      if (currentMarker) {
        map.removeLayer(currentMarker);
      }

      currentMarker = L.marker([lat, lng], {
        draggable: false,
        icon: redIcon,
      })
        .addTo(map)
        .bindPopup("現在地")
        .openPopup();
    },

    function (error) {
      alert("GPS取得失敗 : " + error.message);
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
async function startTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }

  // ==========================
  // 前回保存地点を取得
  // ==========================

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    const { data: lastLog } = await supabaseClient
      .from("travel_logs")
      .select("latitude, longitude")
      .eq("user_id", session.user.id)
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .single();

    if (lastLog) {
      lastSavedLat = lastLog.latitude;
      lastSavedLng = lastLog.longitude;

      console.log("前回地点読込", lastSavedLat, lastSavedLng);
    }
  }

  watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      if (!currentMarker) {
        currentMarker = L.marker([lat, lng], {
          icon: redIcon,
        })
          .addTo(map)
          .bindPopup("現在地");
      } else {
        currentMarker.setLatLng([lat, lng]);
      }

      if (map) {
        map.panTo([lat, lng]);
      }
      console.log(
        "GPS受信",
        new Date().toLocaleTimeString(),
        lat,
        lng,
        "精度=" + position.coords.accuracy,
      );
      if (position.coords.accuracy > 200) {
        console.log("GPS精度悪いため無視", position.coords.accuracy);

        return;
      }

      console.log("追跡:", lat, lng);

      if (lastSavedLat === null || lastSavedLng === null) {
        lastSavedLat = lat;
        lastSavedLng = lng;

        await autoSaveLocation(lat, lng);

        addMarker(lat, lng, "自動記録", null);

        console.log("初回保存");

        return;
      }

      const distance = getDistance(lastSavedLat, lastSavedLng, lat, lng);

      console.log("移動距離:", Math.round(distance), "m");

      if (distance >= 10) {
        // 保存中は無視
        if (isSaving) {
          return;
        }

        // 10秒以内の連続保存防止
        if (Date.now() - lastSaveTime < 10000) {
          return;
        }

        isSaving = true;

        try {
          await autoSaveLocation(lat, lng);

          lastSaveTime = Date.now();

          addMarker(lat, lng, "自動記録", null);

          lastSavedLat = lat;
          lastSavedLng = lng;
        } finally {
          isSaving = false;
        }

        console.log(Math.round(distance) + "m移動したので自動記録しました");
      }
    },

    (error) => {
      console.error(error);
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
}

/* ===========================
現在地保存
=========================== */
async function saveLocation() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      alert("ログインしてください");
      return;
    }

    // ドラッグ後のマーカー位置取得
    let lat;
    let lng;

    if (currentMarker) {
      const pos = currentMarker.getLatLng();

      lat = pos.lat;
      lng = pos.lng;
    } else {
      alert("現在地マーカーがありません");
      return;
    }

    const memo = document.getElementById("memo").value;

    let imageUrl = null;
    let fileName = null;

    const file = document.getElementById("photo").files[0];

    /* ===================
               Storage保存
          ==================== */

    if (file) {
      const compressedFile = await window.compressImage(file);

      fileName = Date.now() + "_" + compressedFile.name;

      const { error: uploadError } = await supabaseClient.storage
        .from("travel-images")
        .upload(fileName, compressedFile, {
          contentType: "image/jpeg",
        });

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data: urlData } = supabaseClient.storage
        .from("travel-images")
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
    }

    /* ===================
               DB保存
          ==================== */

    const { error } = await supabaseClient.from("travel_logs").insert({
      user_id: session.user.id,
      latitude: lat,
      longitude: lng,
      memo: memo,
      image_url: imageUrl,
      file_name: fileName || null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    addMarker(lat, lng, memo, imageUrl);

    document.getElementById("memo").value = "";
    document.getElementById("photo").value = "";

    alert("保存しました");

    // 履歴と地図だけ再読み込み
    await window.loadLogs();
  } catch (error) {
    alert(error.message);
  }
}

window.initBackgroundGPS = initBackgroundGPS;
window.autoSaveLocation = autoSaveLocation;
window.getCurrentLocation = getCurrentLocation;
window.getDistanceMeters = getDistanceMeters;
window.startTracking = startTracking;
window.saveLocation = saveLocation;
