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

      // init html elements 'heading-row h1' and 'tour-btn'
      document.querySelector('#heading-row h1').textContent = `${name}'s Journey`;
      const tourBtn = document.getElementById('tour-btn');
      tourBtn.textContent = `Click to Start ${name}'s Journey`;
      const personBtn = document.getElementById('togglePersonBtn');

      // remove any residual maps
      if (window.activeMap) window.activeMap.remove();
      const map = L.map('map');
      window.activeMap = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const wagonIcon = L.icon({
        iconUrl: '../images/stagecoach.svg',
        iconSize:  [50, 50],
        iconAnchor: null,
        popupAnchor: [0, -20]
      });

      // initialize audio
      const audio = document.getElementById('ambient-audio');
      audio.muted = false;
      audio.loop = true;

      // create pause points
      const pausePoints = [];
      let cumulativeIndex = 0;
      waypoints.forEach(wp => {
        pausePoints.push(cumulativeIndex);
        cumulativeIndex += wp.route.length;
      });

      // array of all latlng values
      const allPoints = waypoints.flatMap(wp => wp.route);

      // array of all modes (i.e. boat, train, wagon)
      const segmentTypes = waypoints.flatMap(wp => Array(wp.route.length).fill(wp.mode));

      // zoom allPoints
      map.fitBounds(L.polyline(allPoints).getBounds());

      // add routes and markers
      waypoints.forEach((wp, i) => {
        const color = wp.mode === 'wagon' ? 'blue' :
          wp.mode === 'boat'  ? 'green' : wp.mode === 'train' ? (i === 4 ? 'red' : 'blue') : 'gray';
        const dashArray = wp.mode === 'wagon' || wp.mode === 'train' ? '10,5' : null;
        L.polyline(wp.route, { color, weight: 2, opacity: 0.8, dashArray }).addTo(map);

        L.marker(wp.route[0]).addTo(map).bindPopup(wp.popup);
      });

      // initialize variables
      let movingMarker = L.marker(allPoints[0]).addTo(map);
      let currentIndex = 0;
      let isPaused = true;
      let animationTimeout = null;
      let userHasInteracted = false;
      let lastPointReached = false;

      // provide overlay to identify geography (land and water)
      L.tileLayer.provider('Esri.NatGeoWorldMap').addTo(map);

      // browsers block audio until user Has Interacted (i.e. clicked)
      document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
      document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });

/**********************************************  
          all initialization complete
**********************************************/

      // re-init - called when lastPointReached
      function initMapAndVariables() {
        // Remove the old marker if it exists
        if (movingMarker) {
          movingMarker.closePopup();
          map.removeLayer(movingMarker);
        }
        // Create a fresh marker
        movingMarker = L.marker(allPoints[0]).addTo(map);
        currentIndex = 0;
        isPaused = true;
        lastPointReached = false;
        animationTimeout = null;
        userHasInteracted = false;
        map.fitBounds(L.polyline(allPoints).getBounds());
        movingMarker.closePopup();
        tourBtn.textContent = "Click to Restart Journey";
      }

      // play audio and zoom bounds
      function playAmbientSound(type) {
        if (!userHasInteracted || audio.muted) return;
        let src = '';
        switch (type) {
          case 'wagon':
            src = '../assets/sounds/horse-gallop-loop2-103633.mp3';
            audio.volume = 0.4;
            break;
          case 'boat':
            src = '../assets/sounds/ship-horn-distant-38390.mp3';
            audio.volume = 0.4;
            break;
          case 'train':
            src = '../assets/sounds/train-whistle-306031-2sec.mp3';
            audio.volume = 0.3;
            break;
          default:
            // src = '../assets/sounds/firetruck-w-horns-0415-70775.mp3';
            // audio.volume = 0.2;
        }
        // pause when changing src
        audio.pause();
        audio.src = src;
        audio.load();
        audio.play();

        // fits bounds between current and next pausePoint
        const pauseIndex = pausePoints.indexOf(currentIndex);
        const nextPauseIndex = pausePoints[pauseIndex + 1];
        const segmentBounds = L.latLngBounds([
          allPoints[currentIndex],
          allPoints[nextPauseIndex]
        ]);
        map.fitBounds(segmentBounds, { padding: [20, 20] });
      }

      // sets icon, plays audio and fits bounds
      // (could be split into three functions)
      function setIcon(index) {
        const type = segmentTypes[index];
        playAmbientSound(type);
        if (type === 'boat') {
          return L.divIcon({ html: '<div style="font-size: 32px;">🚢</div>', iconSize: [0, 0], iconAnchor: [32, 32] });
        } else if (type === 'train') {
          return L.divIcon({ html: '<div style="font-size: 32px;">🚂</div>', iconSize: [0, 0], iconAnchor: [32, 32] });
        } else {
          return wagonIcon;
        }
      }

      // we have reached a pause point
      function pausePointReached() {
        // reset isPaused
        isPaused = false;
        personBtn.disabled = false;
        tourBtn.style.visibility = 'visible';
        tourBtn.textContent = "Click to Continue Journey";
        audio.pause();
        // zoom to current point
        map.setView(allPoints[currentIndex], 10);
        const pauseIndex = pausePoints.indexOf(currentIndex);
        const pausePoint = waypoints[pauseIndex];
        // open popup for current location
        movingMarker.bindPopup(pausePoint.popup, {offset: L.point(0, -15)}).openPopup();
        // end of tour?
        lastPointReached = (currentIndex === allPoints.length - 1) 
      }

      // movingMarker to next pausePoint
      function moveMarker() {
        if (!isPaused) {
          // set isPaused for next tourBtn click
          isPaused = true;
          personBtn.disabled = true;
          clearTimeout(animationTimeout);
          movingMarker.setIcon(setIcon(currentIndex));
          movingMarker.closePopup();
          tourBtn.style.visibility = 'hidden';
        }

        // loop until next pausePoint is reached
        function step() {
          if (currentIndex >= allPoints.length) return;
          movingMarker.setLatLng(allPoints[currentIndex]);
          currentIndex++;
          // Check if the NEXT index is a pause point
          if (pausePoints.includes(currentIndex )) {
            pausePointReached();
            return;         // stop looping here
          }
          animationTimeout = setTimeout(step, 1000);
        }
      step();
      }

      // all actions are triggered off the tourBtn
      tourBtn.addEventListener('click', () => {
        if (lastPointReached) {
          initMapAndVariables();
          return;
        }
        if(isPaused) {
          pausePointReached();
          return;
        }
        // else
        moveMarker();
        return;
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