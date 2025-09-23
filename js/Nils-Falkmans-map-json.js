// window.onload = function () {
// import * as icon from 'vue-svgicon'
const jsonFile = "journeys.json"

export function mapBuilder( jsonFile, currentTraveler ) {
  // Fetch the file containing the json data
  fetch(jsonFile)
    .then(res => res.json())
    .then(data => {

  // get trip data for currentTraveler
  const tripData = data[currentTraveler];
  const name = tripData.name

  //set page heading and tour button text
  document.querySelector('#heading-row h1').textContent = `${name}'s Journey`;
  const tourBtn = document.getElementById('tour-btn');
  if (tourBtn) tourBtn.textContent = `Click to Start ${name}'s Journey's` 

  if (window.activeMap) {
    window.activeMap.remove(); // Cleanly destroy the previous map
  }

  const map = L.map('map'); // Create new map instance
  window.activeMap = map;   // Store reference globally  // Base layer

  // Base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // get waypoint data
  const waypoints = tripData.waypoints;
  console.log("waypoints = ", waypoints)


  const staticMarkers = Object.values(waypoints).map((waypointData, index) => ({
    coords: waypointData.route[0],       // first point of the route
    popup: waypointData.popup,           // popup HTML from JSON
    open: index === 0                  // open only the first waypoint
  }));

  staticMarkers.forEach(({ coords, popup, open }) => {
    const waypoint = L.marker(coords).addTo(map).bindPopup(popup);
    if (open) waypoint.openPopup();
  });



   // Initialize State
  let skipNextPause = false;  // find out where you are on the
  let currentIndex = 0;
  let isPaused = false;
  let isMuted = false;
  let animationTimeout = null;
  let tourStarted = false;
  let pendingResetAtChicago = false;
  let waypointIndex = 0;

  //create wagon icon
  const wagonIcon = L.icon({
    iconUrl: '../images/stagecoach.svg', // adjust path as needed
    iconSize: [40, 40],       // size of the icon in pixels
    iconAnchor: [20, 20],     // point of the icon which corresponds to waypoint's location
    popupAnchor: [0, -20]     // where the popup opens relative to the iconAnchor
  });
  
  // Init Ambient audio Note: can't start audio until user Has Interacted
  const audio = document.getElementById('ambient-audio');
  audio.volume = 0.5; // 50% volume
  audio.muted = false;

// let cumulativeIndex = 0;
// const pauseAtIndices = waypoints.map(wp => {
//   const entry = { index: cumulativeIndex, data: wp };
//   cumulativeIndex += wp.route.length;
//   return entry;
// });
  let cumulativeIndex = 0;
  const pauseAtIndices = [];
  waypoints.forEach((waypoint) => {
  pauseAtIndices.push(cumulativeIndex); // store the starting index of this waypoint
  cumulativeIndex += waypoint.route.length; // advance by the number of points in this segment
});

// Draw polylines for the entire journey
  // red = wagon, blue = train, green = boat
  Object.values(waypoints).forEach((waypointData, i) => {
    const route = waypointData.route;
    const mode = waypointData.mode;

    // Determine color based on mode or index
    const color = mode === 'wagon' ? 'blue'
                : mode === 'boat'  ? 'green'
                : mode === 'train' ? (i === 4 ? 'red' : 'blue')
                : 'gray';
    const dashArray = mode === 'wagon' || mode === 'train' ? '10,5' : null;
    L.polyline(route, {color, weight: 2, opacity: 0.8, dashArray
    }).addTo(map);
  });

  // Build points from waypoints (concat waypoint.route's and flatten)
  const allPoints = Object.values(waypoints)
    .map(waypoint => waypoint.route)
    .flat();

  // set maps initial bounds
  map.fitBounds(L.polyline(allPoints).getBounds());

  // specify type (wagon, boat, train) for each route point
  const segmentTypes = Object.values(waypoints).flatMap(waypoint =>
    Array(waypoint.route.length).fill(waypoint.mode)
  );

  const lastMarker = Object.values(waypoints).at(-1);
  const ChicagoIndex = allPoints.findIndex(p =>
    p[0] === lastMarker.route.at(-1)[0] &&
    p[1] === lastMarker.route.at(-1)[1]
  );

  const movingMarker = L.marker(allPoints[waypoints[0].waypoint], {
    icon: wagonIcon
  }).addTo(map);

// This completes the state and map initialization.

  // Animation control
  function clearTimer() {
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      animationTimeout = null;
    }
  }

  function setIcon(currentIndex) {
    const iconType = segmentTypes[currentIndex];
    let icon;
    if (iconType === 'boat') {
      icon = L.divIcon({
        html: '<div style="font-size: 32px;">🚢</div>',
        iconSize: [0, 0],
        iconAnchor: [16, 16]
      });
    } else if (iconType === 'train') {
      icon = L.divIcon({
        html: '<div style="font-size: 32px;">🚂</div>',
        iconSize: [0, 0],
        iconAnchor: [16, 16]
      });
    } else if (iconType === 'wagon') {
      icon = L.icon({
        iconUrl: '../images/stagecoach.svg', // adjust path as needed
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    }
  }

  function playAmbientSound(type) {
    if (!userHasInteracted || isMuted) return;

    let src = '';
    switch (type) {
      case 'wagon':
        src = '../assets/sounds/horse-gallop-loop2-103633.mp3';
        audio.volume = 0.3;
        audio.playbackRate = 1.0;
        break;
      case 'boat':
        src = '../assets/sounds/ship-horn-distant-38390.mp3';
        audio.volume = 0.4;
        audio.playbackRate = 1.0;
        break;
      case 'train':
        src = '../assets/sounds/train-whistle-306031-2sec.mp3';
        audio.volume = 0.2;
        audio.playbackRate = 1.0;
        break;
      default:
        src = '../assets/sounds/firetruck-w-horns-0415-70775.mp3';
        audio.volume = 0.5;
        audio.playbackRate = 1.0;
        break;
    }
  }
    function moveMarker() {
    if (!tourStarted || isPaused) return;

    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= allPoints.length) currentIndex = 0;

    tourBtn.style.visibility = 'hidden';

    // are we at a pausePoint?
    const pausePoint = waypoints.find(p => p.waypoint === currentIndex);
    if (pausePoint) {
      tourBtn.style.visibility = 'visible';
      pendingResetAtChicago = pausePoint.url.includes("Chicago");

      // const popupContent = pausePoint.popup;
      movingMarker.bindPopup(pausePoint.popup).openPopup();

      isPaused = true;
      // update waypoint
      waypointIndex++;
      return;
    }

  // Move the waypoint
    setLatLng(allPoints[currentIndex]);

  // Play ambient based on segment type
    // playAmbientSound(segmentTypes[currentIndex]);
    playAmbientSound(iconType);
    movingMarker.setIcon(icon);
    // Continue animation
    animationTimeout = setTimeout(() => {
      currentIndex++;
      moveMarker();
    }, 1000); // Adjust speed as needed
  }

  // Tour button click to start/resume
  tourBtn.addEventListener('click', () => {
    if (!tourStarted) {
      tourStarted = true;
      currentIndex = 0;
      isPaused = false;
      moveMarker();
    } else if (pendingResetAtChicago) {
      currentIndex = 0;
      pendingResetAtChicago = false;
      isPaused = false;
      moveMarker();
    } else {
      isPaused = false;
      moveMarker();
    }
  });
  
  // Utility to generate route points on the map
  // const clickedPoints = []; // Global array to store latlngs
  // function onMapClick(e) {
  //   const lat = e.latlng.lat.toFixed(2);
  //   const lng = e.latlng.lng.toFixed(2);
  //   const point = `[ ${lat}, ${lng} ],`;
  //   clickedPoints.push(point);
  //   // console.log("Clicked points:", clickedPoints);
  //   // alert("You clicked the map at " + point);
  // } 
  // map.on('click', onMapClick);

  // User interaction unlock for audio
  let userHasInteracted = false;
  document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
  document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });
  }); // closes .then(data => { ...
}       // closes export function mapBuilder ...