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
/* The Immigrants Journey.js *********************************

    This script builds a map from routes 
    and waypoints read from a json File.

    This is an event driven version of the script.
    Events are initiated by a tourBtn click.

    The first click starts the journey at the first waypoint.
    The next and subsequent clicks continue
    the journey to the next waypoint.
    
    A click at the last waypoint will restart the journey.

**************************************************************/
export function mapBuilder(jsonFile, currentTraveler) {
  fetch(jsonFile)
    .then(res => res.json())
    .then(data => {

      /*********************************************
                initialization starts here
      **********************************************/
      const tripData = data[currentTraveler];
      const name = tripData.name;
      const waypoints = tripData.waypoints;

      // init html elements
      document.querySelector('#heading-row h1').textContent = `${name}'s Journey`;
      const tourBtn = document.getElementById('tour-btn');
      tourBtn.textContent = `Click to Start ${name}'s Journey`;
      const personBtn = document.getElementById('toggleTravelerBtn');
      const overlayBtn = document.getElementById('overlay-btn');

      // remove any residual maps
      if (window.activeMap) window.activeMap.remove();
      const map = L.map('map');
      window.activeMap = map;

      const allPoints = waypoints.flatMap(wp => wp.route);

map.fitBounds(L.polyline(allPoints).getBounds());


      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // overlay layer
      const natGeoOverlay = L.tileLayer.provider('Esri.NatGeoWorldMap');
      map.addLayer(natGeoOverlay);

      // icons
      const wagonIcon = L.icon({
        iconUrl: '../images/stagecoach.svg',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -20]
      });

      const boatIcon = L.icon({
        iconUrl: '../images/passenger ship.png',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        popupAnchor: [0, -20]
      });

      const trainIcon = L.icon({
        iconUrl: '../images/train.png',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        popupAnchor: [0, -20]
      });

      const hiddenIcon = L.divIcon({
        html: '',
        className: '',
        iconSize: [0, 0]
      });

      // audio
      const audio = document.getElementById('ambient-audio');
      audio.muted = false;
      audio.loop = true;
      audio.volume = 0.6;

      // pause points
      const pausePoints = [];
      let cumulativeIndex = 0;
      waypoints.forEach(wp => {
        pausePoints.push(cumulativeIndex);
        cumulativeIndex += wp.route.length;
      });

      // const allPoints = waypoints.flatMap(wp => wp.route);
      const segmentTypes = waypoints.flatMap(wp => Array(wp.route.length).fill(wp.mode));

      // zoom to all points
      map.flyToBounds(L.polyline(allPoints).getBounds(), {
        duration: 1.5,
        padding: [20, 20]
      });

      // add routes and markers
      waypoints.forEach((wp, i) => {
        const color = wp.mode === 'wagon' ? 'blue' :
          wp.mode === 'boat' ? 'green' :
          wp.mode === 'train' ? (i === 4 ? 'red' : 'blue') : 'gray';
        const dashArray = wp.mode === 'wagon' || wp.mode === 'train' ? '10,5' : null;
        L.polyline(wp.route, { color, weight: 2, opacity: 0.8, dashArray }).addTo(map);
        L.marker(wp.route[0]).addTo(map).bindPopup(wp.popup);
      });

      // state
      let movingMarker = L.marker(allPoints[0]).addTo(map);
      let currentIndex = 0;
      let journeyPaused = true;
      let animationTimeout = null;
      let userHasInteracted = false;
      let lastPointReached = false;
      let overlayOn = true;

      // user interaction unlocks audio
      document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
      document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });

      /**********************************************
                initialization complete
      **********************************************/

      function initMapAndVariables() {
        if (movingMarker) {
          movingMarker.closePopup();
          map.removeLayer(movingMarker);
        }
        movingMarker = L.marker(allPoints[0]).addTo(map);
        currentIndex = 0;
        journeyPaused = true;
        lastPointReached = false;
        animationTimeout = null;
        userHasInteracted = false;
        map.flyToBounds(L.polyline(allPoints).getBounds(), {
          duration: 1.5,
          padding: [20, 20]
        });
        movingMarker.closePopup();
        tourBtn.textContent = `Click to Start ${name}'s Journey`;
      }

      function playAmbientSound(type) {
        if (!userHasInteracted || audio.muted) return;
        let src = '';
        switch (type) {
          case 'wagon':
            src = '../assets/sounds/horse-gallop-loop2-103633.mp3';
            break;
          case 'boat':
            src = '../assets/sounds/ship-horn-distant-38390.mp3';
            break;
          case 'train':
            src = '../assets/sounds/train-whistle-306031-2sec.mp3';
            break;
        }
        audio.pause();
        audio.src = src;
        audio.load();
        audio.play();

        const pauseIndex = pausePoints.indexOf(currentIndex);
        const nextPauseIndex = pausePoints[pauseIndex + 1];
        if (nextPauseIndex) {
          const segmentBounds = L.latLngBounds([
            allPoints[currentIndex],
            allPoints[nextPauseIndex]
          ]);
          map.flyToBounds(segmentBounds, {
            padding: [20, 20],
            duration: 2.0
          });
        }
      }

      function setIcon(index) {
        const type = segmentTypes[index];
        playAmbientSound(type);
        if (type === 'boat') {
          return boatIcon;
        } else if (type === 'train') {
          return trainIcon;
        } else {
          return wagonIcon;
        }
      }

      function pausePointReached() {
        lastPointReached = (currentIndex === allPoints.length - 1);
        journeyPaused = false;
        movingMarker.setIcon(hiddenIcon);
        personBtn.disabled = false;
        tourBtn.style.visibility = 'visible';
        tourBtn.textContent = lastPointReached ? "Click to Restart Journey" : "Click to Continue Journey";
        audio.pause();
        map.flyTo(allPoints[currentIndex], 10, {
          duration: 1.5,
          easeLinearity: 0.25
        });
        const pauseIndex = pausePoints.indexOf(currentIndex);
        const pausePoint = waypoints[pauseIndex];
        movingMarker.bindPopup(pausePoint.popup, { offset: L.point(0, -15) }).openPopup();
      }

      function moveMarker() {
        if (!journeyPaused) {
          journeyPaused = true;
          personBtn.disabled = true;
          clearTimeout(animationTimeout);
          movingMarker.setIcon(setIcon(currentIndex));
          movingMarker.closePopup();
          tourBtn.style.visibility = 'hidden';
        }

        function step() {
          if (currentIndex >= allPoints.length) return;
          movingMarker.setLatLng(allPoints[currentIndex]);
          currentIndex++;
          if (pausePoints.includes(currentIndex)) {
            pausePointReached();
            return;
          }
          map.panTo(allPoints[currentIndex], { animate: true });
          animationTimeout = setTimeout(step, 1000);
        }
        step();
      }

      tourBtn.addEventListener('click', () => {
        if (lastPointReached) {
          initMapAndVariables();
          return;
        }
        if (journeyPaused) {
          pausePointReached();
          return;
        }
        moveMarker();
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
          helper code for capturing lat/lngs for new routes
      *****************************************************************/
      // const clickedPoints = [];
      // function onMapClick(e) {
      //   const lat = e.latlng.lat.toFixed(2);
      //   const lng = e.latlng.lng.toFixed(2);
      //   const point = `[ ${lat}, ${lng} ],`;
      //   clickedPoints.push(point);
      //   console.log("Clicked points:", clickedPoints);
      // }
      // map.on('click', onMapClick);
});
}