console.log("photo.js 読み込み成功");
/* ===========================
             イメージ表示
          =========================== */
function showImage(url) {
  const modal = document.createElement("div");

  modal.style.position = "fixed";
  modal.style.left = "0";
  modal.style.top = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.8)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
        <img
            src="${url}"
            style="
                max-width:95%;
                max-height:95%;
                border-radius:10px;
            ">
    `;

  modal.onclick = () => {
    document.body.removeChild(modal);
  };

  document.body.appendChild(modal);
}

/* ===========================
画像をBase64へ変換
=========================== */
async function imageToBase64(url) {
  try {
    const response = await fetch(url);

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(error);

    return null;
  }
}

/* ===========================
   画像圧縮
=========================== */
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        const maxSize = 800;

        // 長辺を1600pxに縮小
        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              {
                type: "image/jpeg",
              },
            );

            resolve(compressedFile);
          },

          "image/jpeg",

          0.3, // 品質50%
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}
function getDistance(lat1, lng1, lat2, lng2) {
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
/* ===========================
写真プレビュー
=========================== */

document.getElementById("photo").addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const preview = document.getElementById("preview");

    preview.src = e.target.result;
    preview.style.display = "block";
  };

  reader.readAsDataURL(file);
});

window.showImage = showImage;
window.imageToBase64 = imageToBase64;
window.compressImage = compressImage;
window.getDistance = getDistance;
