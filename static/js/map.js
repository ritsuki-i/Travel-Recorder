// Google Maps APIを読み込むための関数
function loadGoogleMapsAPI() {
  // script要素を作成
  let script = document.createElement('script');
  // APIのURLを設定。APIキーとバージョン情報を含む
  script.src = `https://maps.googleapis.com/maps/api/js?key=${mapParams.googleMapKey}&v=weekly`;
  // script要素をdocumentのheadに追加
  document.head.appendChild(script);
  // スクリプトが読み込まれたら、マップを初期化する関数を実行
  script.onload = () => {
    initMap(mapParams.lat, mapParams.lng, mapParams.zoom);
  };
}

let map;

/**
 * @param {HTMLInputElement} obj 入力情報
 * @param {String} previewId プレビュー表示DOMのID
 */
function preview(obj, previewId) {
  console.log("preview");
  previewFile(obj.files, previewId);
}

/**
* @param {File} files 入力ファイル
* @param {String} previewId プレビュー表示DOMのID
*/
function previewFile(files, previewId) {
  console.log("previewFile");
  let fileReader = new FileReader();
  fileReader.onload = (function () {
      document.getElementById(previewId).src = fileReader.result;
      document.getElementById(`${previewId}-file`).innerText = files[0].name;
  });
  fileReader.readAsDataURL(files[0]);
}

/**
* @param {Event} event
*/
function dropHandler(event) {
  console.log("dropHandler");

  event.preventDefault();

  if (event.dataTransfer.files.length === 0) return false;
  const files = event.dataTransfer.files;
  const previewId = `preview-${event.currentTarget.id}`;
  previewFile(files, previewId);
}

/**
* @param {Event} event
*/
function dragOverHandler(event) {
  console.log("dragOverHandler");
  event.preventDefault();
}





// Googleマップを初期化し、マーカーとインフォウィンドウを設定する関数
function initMap(lat, lng, zoom) {
  //地図のスタイリング
  const mapStyles=[
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
    const estimatedTextWidth = Math.max(60, text.length * 8 ); // Minimum width 100px
    const svgWidth = estimatedTextWidth + 20; // Add some padding to the width
    const svgHeight = 40; // Fixed height
    const borderRadius = 10;

    const svg = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="${estimatedTextWidth}" height="25" rx="${borderRadius}" ry="${borderRadius}"
        style="fill: #ffffff; stroke: #000000; stroke-width: 2;" />
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  };



  // Googleマップのインスタンスを作成。指定された緯度、経度、ズームレベルで中心を設定
  const center = new google.maps.LatLng(mapParams.lat, mapParams.lng);
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: zoom,
    center: center,
    styles: mapStyles//地図のスタイリングapril4th
  });

  // マップマーカーの情報があれば、マーカーをマップに追加. List 対応 6 april Ian
  // Initialize and add markers
    if (mapParams.mapMarkers) {
      mapParams.mapMarkers.forEach((mapMarker) => {
        let pinIcon = {
            url: createSVGIcon(mapMarker.label)
        };

        let marker = new google.maps.Marker({
          position: {lat: parseFloat(mapMarker.lat), lng: parseFloat(mapMarker.lng)},
          map: map,
          icon: pinIcon,
          label: mapMarker.label ? mapMarker.label : 'No Label'
        });

        // Add click listener to each marker
         marker.addListener('click', () => {
            const contentString = `<div>
                <p><strong>Name:</strong> ${mapMarker.label ? mapMarker.label : 'No Label'}</p>
                <p><strong>Description:</strong> ${mapMarker.description ? mapMarker.description : 'No Description'}</p>
                <button onclick="deleteMarker('${mapMarker.locationid}')">Delete Marker</button>
            </div>`;

            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
        });
      });
  }


  // インフォウィンドウのインスタンスを作成
  let infoWindow = new google.maps.InfoWindow();

  // マップがクリックされた場合の処理。インフォウィンドウを新しい位置に表示し、フォームを含める
  map.addListener("click", (mapsMouseEvent) => {

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
      <form action="/my-map" method="post">
        <input type="hidden" name="form_type" value="submit_location">
        <input type="hidden" id="lat" name="lat" value="${latLng.lat}">
        <input type="hidden" id="lng" name="lng" value="${latLng.lng}">
        <label for="name">Name:</label>
        <input type="text" id="label" name="label"><br>
        <label for="description">Description:</label>
        <input type="text" id="description" name="description"><br>

        <label for="image">image:</label>
        <div class="filearea" id="image" ondrop="dropHandler(event);" ondragover="dragOverHandler(event);">
          <label>
            <img class="preview pre-select" id="preview-image">
            <input type="file" accept='image/*' onchange="preview(this, 'preview-image');">
            <p class="select-file" id="preview-image-file">選択されてません</p>

          </label>
        </div>

        <input type="submit" value="Submit">
      </form>


      `
    );

    // インフォウィンドウを開く
    infoWindow.open(map);
  });
}

function centerMapOnMarker(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  map.setCenter(center);
  map.setZoom(15);  // You can adjust the zoom level as needed
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

      initMap(mapParams.lat, mapParams.lng, mapParams.zoom); // Re-initialize the map
      alert('Marker deleted successfully.');
    } else {
      alert('Error communicating with the server.');
    }
  } catch (error) {
    console.error('Error deleting marker:', error);
    alert('Error deleting marker.');
  }
}




// Google Maps APIの読み込みを開始する
loadGoogleMapsAPI();