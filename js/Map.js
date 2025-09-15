window.onload = function () {
  const map = L.map('map');
  let userHasInteracted = false;
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const oceanRoute1 = [[57.70, 11.94], [57.70, 11.93], [57.69, 11.89], [57.60, 11.65],
    [57.90, 10.78], [57.94, 10.71], [57.32, 8.53], [53.53, 0.19],
    [53.63, -0.17], [53.73, -0.28], [53.74, -0.33]];

  const landRoute1 = [[53.74, -0.33], [53.79, -1.54], [53.47, -2.25], [53.4, -3.0]];

  const oceanRoute2 = [[53.4, -3.0], [53.52, -3.12], [53.47, -4.49], [53.37, -5.69],
    [52.01, -6.10], [51.70, -7.71], [51.78, -8.26], [51.81, -8.27],
    [51.84, -8.26], [51.84, -8.29], [51.84, -8.26], [51.81, -8.27],
    [51.78, -8.26], [51.54, -8.19], [51.22, -9.53], [50.00, -15.00],
    [48.00, -25.00], [46.00, -35.00], [44.00, -45.00], [43.00, -55.00],
    [42.73, -63.61], [40.18, -70.22], [40.48, -73.88], [40.55, -74.04],
    [40.64, -74.05], [40.6985, -74.0405]];

  const landRoute2 = [[40.6986, -74.0405], [39.95, -75.16], [40.26, -76.88], [41.1169, -78.7644]];
  const landRoute3 = [[41.1169, -78.7644], [41.18, -80.44], [41.60, -87.59], [41.88, -87.65]];

  [oceanRoute1, landRoute1, oceanRoute2, landRoute2, landRoute3].forEach((route, i) => {
    L.polyline(route, {
      color: i === 4 ? 'red' : (i % 2 === 0 ? 'blue' : 'green'),
      weight: 2,
      opacity: 0.8,
      dashArray: i % 2 === 0 ? '10,5' : null
    }).addTo(map);
  });

  const allPoints = oceanRoute1.concat(landRoute1, oceanRoute2, landRoute2, landRoute3);
  map.fitBounds(L.polyline(allPoints).getBounds());

  const segmentTypes = [
    ...Array(oceanRoute1.length).fill('sea'),
    ...Array(landRoute1.length).fill('land'),
    ...Array(oceanRoute2.length).fill('sea'),
    ...Array(landRoute2.length).fill('land'),
    ...Array(landRoute3.length).fill('land')
  ];

  const DuBoisIndex = allPoints.findIndex(p => p[0] === 41.1169 && p[1] === -78.7644);
  const ChicagoIndex = allPoints.findIndex(p => p[0] === 41.88 && p[1] === -87.65);
  const HullIndex = allPoints.findIndex(p => p[0] === 53.74 && p[1] === -0.33);
  const LiverpoolIndex = allPoints.findIndex(p => p[0] === 53.4 && p[1] === -3.0);
  const NewYorkIndex = allPoints.findIndex(p => p[0] === 40.6985 && p[1] === -74.0405);
  
// DuBoisIndex 
// ChicagoIndex
// HullIndex
// LiverpoolIndex
// NewYorkIndex
  

  let currentIndex = 0;
  let isPaused = false;
  let ismuted = false;
  let animationTimeout = null;

  const movingMarker = L.marker(allPoints[0], {
    icon: L.divIcon({ html: '🚂', iconSize: [24, 24], iconAnchor: [12, 12] })
  }).addTo(map);

  function moveMarker() {
    if (isPaused) return;
    playAmbientSound(segmentTypes[currentIndex]);
    if (currentIndex === 0) {
      movingMarker.setLatLng(allPoints[currentIndex]);
      movingMarker.setIcon(L.divIcon({ html: '🚂', iconSize: [24, 24], iconAnchor: [12, 12] }));
      movingMarker.bindPopup('<b>Göteborg</b><br>Most Swedish Emigrant left from here by ship').openPopup();
      animationTimeout = setTimeout(() => {
        movingMarker.closePopup();
        currentIndex++;
        moveMarker();
      }, 3000);
      return;
    }

    if (currentIndex < allPoints.length) {
      const iconType = segmentTypes[currentIndex];
      const icon = L.divIcon({
      html: iconType === 'sea' ? '<div style="font-size: 32px;">🚢</div>' : '<div style="font-size: 32px;">🚂</div>',
        iconSize: [0, 0],
        iconAnchor: [16, 16]
      });

      movingMarker.setLatLng(allPoints[currentIndex]);
      movingMarker.setIcon(icon);

      let popupDelay = 600;

      if (currentIndex === DuBoisIndex) {
        movingMarker.bindPopup('<b>DuBois, PA</b><br>Here is where N.P. Falkman met up with his brother Johan').openPopup();
        popupDelay = 3000;
        currentIndex++;      
      } else if (currentIndex === NewYorkIndex) {
        movingMarker.bindPopup('<b>New Your, New York</b><br>Here we transfer to a train for the trip to DuBois, PA').openPopup();
        popupDelay = 3000;
        currentIndex++;      
      } else if (currentIndex === HullIndex) {
        movingMarker.bindPopup('<b>Hull, England</b><br>Here we transfer to a train for Liverpool').openPopup();
        popupDelay = 3000;
        currentIndex++;      
      } else if (currentIndex === LiverpoolIndex) {
        movingMarker.bindPopup('<b>Liverpool, England</b><br>Where we board a trans-Atlantic steamer for New York').openPopup();
        popupDelay = 3000;
        currentIndex++;      
      } else if (currentIndex === ChicagoIndex) {
        movingMarker.bindPopup('<b>Chicago, IL</b><br>Finally settling in a new home about four years later.').openPopup();
        popupDelay = 4000;
        currentIndex = 0;
      } else {
        currentIndex++;
      }

      animationTimeout = setTimeout(() => {
        movingMarker.closePopup();
        moveMarker();
      }, popupDelay);
    }
  }

  // Add a pause button to the map
  document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) {
      audio.play();
      moveMarker();
    } else {
      audio.pause();
      clearTimeout(animationTimeout);
    }
  });

  // Add a 'mute' button to the map
  document.getElementById('mute-btn').addEventListener('click', () => {
    ismuted = !ismuted;
    const btn = document.getElementById('mute-btn');
    btn.textContent = ismuted ? 'UnMute' : 'Mute';
    if (!ismuted) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  // Add sounds to the voyage
const audio = document.getElementById('ambient-audio');
audio.volume = 0.5; // 50% volume
audio.muted = false;

function playAmbientSound(type) {
  if (!userHasInteracted) {
  console.warn('Audio blocked until user interacts with the page.');
  return;
}

  let src = '';
  switch(type) {
    case 'sea':
      src = '../assets/sounds/ship-horn-distant-38390.mp3';
      audio.volume = 0.2;
      audio.playbackRate = 0.5;
      break;
    case 'land':
      src = '../assets/sounds/train-whistle-306031-2sec.mp3';
      audio.volume = 0.2;
      audio.playbackRate = 1.0;
      break;
    default:
      src = '../assets/sounds/firetruck-w-horns-0415-70775.mp3';
      audio.volume = 0.5;
      audio.playbackRate = 1.0;
  } 

  const resolvedSrc = new URL(src, window.location.href).href;

  if (audio.src != resolvedSrc) {
    audio.pause();
    audio.src = src;
    audio.load();
    if (!ismuted) {
      audio.play().catch(err => console.warn('Audio play failed:', err));
    } 
  }
}
 
document.addEventListener('click', () => {
  userHasInteracted = true;
});
document.addEventListener('keydown', () => {
  userHasInteracted = true;
});
  // Static markers
  const staticMarkers = [
    { coords: [57.7, 11.9], label: '<b>Göteborg</b><br>Departing Gothenburg, Sweden', open: true },
    { coords: [53.7, -0.3], label: '<b>Hull</b><br>Arrival: Hull, England' },
    { coords: [53.4, -3.0], label: '<b>Liverpool</b><br>Arrival: Liverpool, England' },
    { coords: [40.6985, -74.0405], label: '<b>New York</b><br>Arrival: New York, USA' },
    { coords: [41.1169, -78.7644], label: '<b>DuBois</b><br>Arriving in: Dubois, Pennsylvania' },
    { coords: [41.88, -87.65], label: '<b>Chicago</b><br>Arrival: Chicago, Illinois' }
  ];

  staticMarkers.forEach(({ coords, label, open }) => {
    const marker = L.marker(coords).addTo(map).bindPopup(label);
    if (open) marker.openPopup();
  });

  // Start animation
  moveMarker();
};
