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
          </div>`;

          infoWindow.setContent(contentString);
          infoWindow.open(myMap, marker);
      });
    });
  }

  // インフォウィンドウのインスタンスを作成
  let infoWindow = new google.maps.InfoWindow();
}

function centerMapOnMarker(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  myMap.setCenter(center);
  myMap.setZoom(15);  // You can adjust the zoom level as needed
}

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

  function toggleImages(imageContainerId) {
    const imageContainer = document.getElementById(imageContainerId);
    if (imageContainer.style.display === "none" || imageContainer.style.display === "") {
      imageContainer.style.display = "block";
    } else {
      imageContainer.style.display = "none";
    }
  }

// Google Maps APIの読み込みを開始する
loadGoogleMapsAPI();