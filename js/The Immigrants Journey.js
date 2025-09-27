/* The Immigrants Journey.js *********************************

    This script builds a map from routes 
    and waypoints read from a json File.

    This is an event driven version of the script.
    Events are initiated by a tourBtn click.

    The first click starts the journey at the first waypoint.
    The next and subsequent clicks continue
    the journey to the next waypoint.
    
    A click at the last waypoint will restart the journey.

    The script uses the following functions:

    mapBuilder(jsonFile, currentTraveler)
    initMapAndVariables()
    pausePointReached()
    moveMarker()
    playAmbientSound(type)
    setIcon(index)
    clearTimer()

**************************************************************/
export function mapBuilder(jsonFile, currentTraveler) {
fetch(jsonFile)
.then(res => res.json())
.then(data => {

/*********************************************
      initialization starts here
**********************************************/
  // get trip data from json
  const tripData = data[currentTraveler];
  const name = tripData.name;
  const waypoints = tripData.waypoints;

  // init html elements 'heading-row h1' and 'tour-btn' and 'overlay-btn'
  document.querySelector('#heading-row h1').textContent = `${name}'s Journey`;
  const tourBtn = document.getElementById('tour-btn');
  tourBtn.textContent = `Click to Start ${name}'s Journey`;
  const personBtn = document.getElementById('toggleTravelerBtn');
  const overlayBtn = document.getElementById('overlay-btn');

  const restartText = "Click to Restart Journey";
  const continueText = "Click to Continue Journey";

  // remove any residual maps
  if (window.activeMap) window.activeMap.remove();
  const map = L.map('map');
  window.activeMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // provide overlay to identify geography (land and water)
  const natGeoOverlay = L.tileLayer.provider('Esri.NatGeoWorldMap').addTo(map);

  const wagonIcon = L.icon({
    iconUrl: '../images/stagecoach.svg',
    iconSize:  [50, 50],
    iconAnchor: null,
    popupAnchor: [0, -20]
  });

  const boatIcon = L.icon({
    iconUrl: '../images/passenger ship.png',
    iconSize:  [60, 60],
    iconAnchor: null,
    popupAnchor: [0, -20]
  });

  const trainIcon = L.icon({
    iconUrl: '../images/train.png',
    iconSize:  [60, 60],
    iconAnchor: null,
    popupAnchor: [0, -20]
  });

  const hiddenIcon = L.divIcon({
    html: '',          // no content
    className: '',     // no default styles
    iconSize: [0, 0]   // no visible box
  });

  // initialize audio
  const audio = document.getElementById('ambient-audio');
  audio.loop = true;
  audio.volume = 0.6;

  // create pause points --- first latlng in each leg
  const pausePoints = [];
  let cumulativeIndex = 0;
  waypoints.forEach(wp => {
    pausePoints.push(cumulativeIndex);
    cumulativeIndex += wp.route.length;
  });

  // array of all latlng values
  const allPoints = waypoints.flatMap(wp => wp.route);

  // array of modes (i.e. boat, train, wagon) for each latlng
  const segmentTypes = waypoints.flatMap(wp => Array(wp.route.length).fill(wp.mode));

  // zoom allPoints
  map.fitBounds(L.polyline(allPoints, {animate: true, padding: [20, 20] }).getBounds());

  // add routes and markers
  waypoints.forEach((wp, i) => {
    const color = wp.mode === 'wagon' ? 'blue' :
      wp.mode === 'boat'  ? 'green' : wp.mode === 'train' ? (i === 4 ? 'red' : 'blue') : 'gray';
    const dashArray = wp.mode === 'wagon' || wp.mode === 'train' ? '10,5' : null;
    L.polyline(wp.route, { color, weight: 2, opacity: 0.8, dashArray, smoothFactor: 0.8  }).addTo(map);

    L.marker(wp.route[0]).addTo(map).bindPopup(wp.popup);
  });

  // initialize variables
  let movingMarker = L.marker(allPoints[0]).addTo(map);
  let currentIndex = 0;
  let journeyPaused = true;
  let animationTimeout = null;
  let userHasInteracted = false;
  let lastPointReached = false;
  let overlayOn = true;

  // browsers block audio until user Has Interacted (i.e. clicked)
  document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
  document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });

/**********************************************  
      all initialization complete
**********************************************/

/**********************************************  
      functions start here
**********************************************/

  // re-init - only called after lastPointReached
  function initMapAndVariables() {
    // Remove the old marker if it exists
    if (movingMarker) {
      movingMarker.closePopup();
      map.removeLayer(movingMarker);
    }
    // Create a fresh marker
    movingMarker = L.marker(allPoints[0]).addTo(map);
    currentIndex = 0;
    journeyPaused = true;
    lastPointReached = false;
    animationTimeout = null;
    userHasInteracted = false;
    map.fitBounds(L.polyline(allPoints).getBounds());
    tourBtn.textContent = `Click to Start ${name}'s Journey`;
  }

  // only called when journey resuming (from pausePoint)
  function playAmbientSound() {
    const type = segmentTypes[currentIndex];
    // if (!userHasInteracted ) return;
    let src = '';
    if(type === 'wagon')
      src = '../assets/sounds/horse-gallop-loop2-103633.mp3';
    else if(type === 'boat')
      src = '../assets/sounds/ship-horn-distant-38390.mp3';
    else
      src = '../assets/sounds/train-whistle-306031-2sec.mp3';

    // pause when changing src
    audio.pause();
    audio.src = src;
    audio.load();
    audio.play();
  };

  // only called when journey resuming (from pausePoint)
  // fitBounds using current waypoint and next waypoint
  function fitBounds() {
    const segmentBounds = L.latLngBounds([allPoints[currentIndex],
      allPoints[pausePoints[pausePoints.indexOf(currentIndex) + 1]]]);
    map.flyToBounds(segmentBounds, {padding: [20, 20], duration: 2.0 });
  };

  // only called when journey resuming (from pausePoint)
  function setIcon(currentIndex) {
    const type = segmentTypes[currentIndex];
    if (type === 'boat') {
      return  boatIcon;
    } else if (type === 'train') { 
      return trainIcon
    } else {
      return wagonIcon;
    }
  }

  // we have reached a pause point
  function pausePointReached() {
    // reset journeyPaused
    lastPointReached = (currentIndex === allPoints.length - 1) 
    journeyPaused = false;
    movingMarker.setIcon(hiddenIcon);
    audio.pause();
    personBtn.disabled = false;
    tourBtn.style.visibility = 'visible';
    tourBtn.textContent = lastPointReached ? restartText : continueText;
    // zoom to current point
    map.flyTo(allPoints[currentIndex], 10, {duration: 1.5, easeLinearity: 0.25 });
    // map.setView(allPoints[currentIndex], 10);
    const pausePoint = waypoints[pausePoints.indexOf(currentIndex)];
    // open popup for current location
    movingMarker.bindPopup(pausePoint.popup, {offset: L.point(0, -15)}).openPopup();
    // end of tour?
  }

  // movingMarker to next pausePoint
  function moveMarker() {
    if (!journeyPaused) {
      // journey resuming
      // set journeyPaused for next tourBtn click
      journeyPaused = true;
      movingMarker.setIcon(setIcon(currentIndex));
      playAmbientSound();
      personBtn.disabled = true;
      tourBtn.style.visibility = 'hidden';
      movingMarker.closePopup();
      fitBounds();
    }

    // loop until next pausePoint is reached
    function step() {
      if (currentIndex >= allPoints.length) return;
      // move icon along
        movingMarker.setLatLng(allPoints[currentIndex]);
        currentIndex++;
        // Check if the index is a pause point
        if (pausePoints.includes(currentIndex)) {
          pausePointReached();
          return;         // stop looping here
        }
      // map.panTo(allPoints[currentIndex], {animate: true, duration: 5.0})
      animationTimeout = setTimeout(step, 1000);
    }
  step();
  }

  // all actions are triggered off the tourBtn overlay-btn
  tourBtn.addEventListener('click', () => {
    if (lastPointReached) {
      initMapAndVariables();
    }
    else if (journeyPaused) {
      pausePointReached();
    } else {
      moveMarker();
    }
  });

  overlayBtn.addEventListener('click', () => {
    overlayOn = !overlayOn;
    if (overlayOn) {
      map.addLayer(natGeoOverlay);
      overlayBtn.textContent = "Overlay OFF";
    } else {
      map.removeLayer(natGeoOverlay);
      overlayBtn.textContent = "Overlay ON";
    }
  });

/****************************************************************
  this code can assist in creating an array of latlngs
  to use for a new route that can be added to the json file
*****************************************************************/  
// const clickedPoints = []; // Global array to store latlngs
// function onMapClick(e) {
//   const lat = e.latlng.lat.toFixed(2);
//   const lng = e.latlng.lng.toFixed(2);
//   const point = `[ ${lat}, ${lng} ],`;
//   clickedPoints.push(point);
//   console.log("Clicked points:", clickedPoints);
//   // alert("You clicked the map at " + point);
// } 
//   map.on('click', onMapClick);
});
}