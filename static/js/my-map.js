// Google Maps APIを読み込むための関数
async function loadGoogleMapsAPI() {
  try {
    const response = await fetch('/google-map-key');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const googleMapKey = data.google_map_key;

    // Script to load Google Maps API
    let script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapKey}&v=weekly`;
    document.head.appendChild(script);

    // Initialize the myMap after the script is loaded
    script.onload = () => {
      initMap(mapParams.lat, mapParams.lng, mapParams.zoom);
    };
  } catch (error) {
    console.error('Error fetching Google Maps API key:', error);
  }
}

let myMap;

//プレビューするための関数
/**
 * @param {HTMLInputElement} obj 入力情報
 * @param {String} previewId プレビュー表示DOMのID
 */
function preview(obj, previewId) {
  previewFiles(obj.files, previewId);
}

/**
* @param {File} files 入力ファイル
* @param {String} previewId プレビュー表示DOMのID
*/
function previewFiles(files, previewId) {
  const previewContainer = document.getElementById(previewId);
  previewContainer.innerHTML = ''; // プレビューコンテナをクリア

  Array.from(files).forEach((file, index) => {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const img = document.createElement('img');
      img.src = fileReader.result;
      img.classList.add('preview-image');  // 画像にCSSクラスを追加
      previewContainer.appendChild(img);
    };
    fileReader.readAsDataURL(file);
  });

  document.getElementById(`${previewId}-file`).innerText = files.length > 1 ? `${files.length} files selected` : files[0].name;
}

/** 
 * @param {Event} event
 */
function dropHandler(event) {
  event.preventDefault();

  if (event.dataTransfer.files.length === 0) return false;
  const files = event.dataTransfer.files;
  const previewId = `preview-${event.currentTarget.id}`;
  previewFiles(files, previewId);
}

/**
 * @param {Event} event
 */
function dragOverHandler(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";  // ドラッグオーバー時のカーソルを変更
}

// Googleマップを初期化し、マーカーとインフォウィンドウを設定する関数
function initMap(lat, lng, zoom) {
  //地図のスタイリング
  const mapStyles= [
    {
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#e0efef"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "hue": "#1900ff"
            },
            {
                "color": "#c0e8e8"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": 100
            },
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "lightness": 700
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#7dcdcd"
            }
        ]
    }
 ]

  const createSVGIcon = (text) => {
    // Estimate the width based on the text length. Each character approximately 8px wide at 12px font size, plus padding
    const estimateTextWidth = (text) => {
        let width = 0;
        for (let char of text) {
          // Full-width characters (e.g., Japanese) are approximately 16px wide at 12px font size
          // Half-width characters (e.g., English) are approximately 8px wide
          width += (char.match(/[^\x00-\x7F]/) ? 17 : 10);
        }
        return width;
      };

      const estimatedTextWidth = Math.max(70, estimateTextWidth(text)); // Minimum width 60px
      const svgWidth = estimatedTextWidth + 20; // Add some padding to the width
      const svgHeight = 40; // Fixed height

      const svg = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="${estimatedTextWidth}" height="25"
          style="fill: #ffffff; stroke: #000000; stroke-width: 2;" />
      </svg>`;
      return 'data:image/svg+xml;base64,' + btoa(svg);
  };



  // Googleマップのインスタンスを作成。指定された緯度、経度、ズームレベルで中心を設定
  const center = new google.maps.LatLng(mapParams.lat, mapParams.lng);
  myMap = new google.maps.Map(document.getElementById("map"), {
    zoom: zoom,
    center: center,
    styles: mapStyles //地図のスタイリング
  });

  // マップマーカーの情報があれば、マーカーをマップに追加.
  // Initialize and add markers
  if (mapParams.mapMarkers) {
    mapParams.mapMarkers.forEach((mapMarker) => {
      let pinIcon = {
          url: createSVGIcon(mapMarker.label)
      };

      let marker = new google.maps.Marker({
        position: {lat: parseFloat(mapMarker.lat), lng: parseFloat(mapMarker.lng)},
        map: myMap,
        icon: pinIcon,
        label: {
            text: mapMarker.label ? "📌" + mapMarker.label : 'No Label',
            fontFamily: "'Courier New', Courier, monospace",
          }
      });

      // Add click listener to each marker
       marker.addListener('click', () => {
        const date = new Date(mapMarker.date*1000);
        // 画像のHTMLを組み立てる
        let imageHtml = '';
        if (mapMarker.image_urls && mapMarker.image_urls.length > 0) {
            imageHtml = '<p><strong>Images:</strong><div class="image-container" id="image">';
            mapMarker.image_urls.forEach(image_url => {
                imageHtml += `<img class="marker-image" src="${image_url}" alt="Marker Image">`;
            });
            imageHtml += '</div></p>';
        }
          const contentString = `<div>
              <p><strong>Name:</strong> ${mapMarker.label ? mapMarker.label : 'No Label'}</p>
              <p><strong>Description:</strong> ${mapMarker.description ? mapMarker.description : 'No Description'}</p>
              <p><strong>Date:</strong>${date ? date.toLocaleString() : 'No Description'}</p>
              ${imageHtml}
              <button onclick="deleteMarker('${mapMarker.locationid}')">Delete Marker</button>
          </div>`;

          infoWindow.setContent(contentString);
          infoWindow.open(myMap, marker);
          console.log(typeof(mapMarker.date))
      });
    });
  }


  // インフォウィンドウのインスタンスを作成
  let infoWindow = new google.maps.InfoWindow();

  // マップがクリックされた場合の処理。インフォウィンドウを新しい位置に表示し、フォームを含める
  myMap.addListener("click", (mapsMouseEvent) => {

    // 既存のインフォウィンドウがあれば閉じる
    if (infoWindow) infoWindow.close();

    // クリックされた位置の緯度経度を取得
    const latLng = mapsMouseEvent.latLng.toJSON();
    infoWindow = new google.maps.InfoWindow({
      position: latLng,
    });

    // インフォウィンドウに表示する内容を設定。場所の名前と説明を入力するフォーム
    infoWindow.setContent(
      `
      <form action="/my-map" method="post" enctype="multipart/form-data">
        <input type="hidden" name="form_type" value="submit_location">
        <input type="hidden" id="lat" name="lat" value="${latLng.lat}">
        <input type="hidden" id="lng" name="lng" value="${latLng.lng}">
        <label for="name">Name:</label>
        <input type="text" id="label" name="label"><br>
        <label for="description">Description:</label>
        <input type="text" id="description" name="description"><br>

        <label for="images">image:</label>
        <div class="filearea" id="image" ondrop="dropHandler(event);" ondragover="dragOverHandler(event);">
          <label>
            <input type="file" id="image_input" name="image_input" accept='image/*' multiple onchange="preview(this, 'preview-container');">ファイルをすべて選択
            <div id="preview-container"></div>
            <p class="select-file" id="preview-image-file"></p>
          </label>
        </div>

        <input type="submit" value="Submit">
      </form>
      `
    );

    // インフォウィンドウを開く
    infoWindow.open(myMap);
  });
}

function centerMapOnMarker(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  myMap.setCenter(center);
  myMap.setZoom(15);  // You can adjust the zoom level as needed
}

async function deleteMarker(locationid) {
  console.log(JSON.stringify({ locationid }))
  try {
    const response = await fetch('/delete-marker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locationid })
    });

    if (response.ok) {
      mapParams.mapMarkers = mapParams.mapMarkers.filter(marker => marker.locationid !== locationid);

      const rowElement = document.getElementById(`marker-row-${locationid}`);
      if (rowElement) {
        rowElement.remove();
      }

      initMap(mapParams.lat, mapParams.lng, mapParams.zoom); // Re-initialize the myMap
      alert('Marker deleted successfully.');
    } else {
      alert('Error communicating with the server.');
    }
  } catch (error) {
    console.error('Error deleting marker:', error);
    alert('Error deleting marker.');
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const linkBtn = document.getElementById("link-btn");
  const linkBtnPhone = document.getElementById("link-btn-phone");
  const userId = document.getElementById("user-id").textContent;

  if (userId) {
    linkBtn.addEventListener('click', async () => {
        try {
            const shareData = {
                title: document.title,
                url: `https://travel-recorder.onrender.com/view-map?user_id=${userId}`
            };
            await navigator.share(shareData);
            console.log('Sharing successful');
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Sharing failed: ' + error.message);
        }
    });
    linkBtnPhone.addEventListener('click', async () => {
      try {
          const shareData = {
              title: document.title,
              url: `https://travel-recorder.onrender.com/view-map?user_id=${userId}`
          };
          await navigator.share(shareData);
          console.log('Sharing successful');
      } catch (error) {
          console.error('Error sharing:', error);
          alert('Sharing failed: ' + error.message);
      }
    });
  } else {
      console.error('User ID not found or invalid.');
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const mapBtn = document.getElementById("map-btn");
  const tableBtn = document.getElementById("table-btn");
  const mapStyling = document.getElementById("mapstyling");
  const searchStyling = document.getElementById("searchstyling");

  mapBtn.addEventListener('click',function(){
    mapStyling.className = 'visible-element';
    searchStyling.className = 'invisible-element';
  });

  tableBtn.addEventListener('click',function(){
    mapStyling.className = 'invisible-element';
    searchStyling.className = 'visible-element';
  });
});


// Google Maps APIの読み込みを開始する
loadGoogleMapsAPI();