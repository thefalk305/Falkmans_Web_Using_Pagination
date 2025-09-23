export function mapBuilder(jsonFile, currentTraveler) {
  fetch(jsonFile)
    .then(res => res.json())
    .then(data => {
      const tripData = data[currentTraveler];
      const name = tripData.name;
      const waypoints = tripData.waypoints;

      document.querySelector('#heading-row h1').textContent = `${name}'s Journey`;
      const tourBtn = document.getElementById('tour-btn');
      if (tourBtn) tourBtn.textContent = `Click to Start ${name}'s Journey`;

      if (window.activeMap) window.activeMap.remove();
      const map = L.map('map');
      window.activeMap = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const wagonIcon = L.icon({
        iconUrl: '../images/stagecoach.svg',
        iconSize: [40, 40],
        // iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });

      const audio = document.getElementById('ambient-audio');
      audio.volume = 0.5;
      audio.muted = false;
      audio.loop = true;

      const pauseAtIndices = [];
      let cumulativeIndex = 0;
      waypoints.forEach(wp => {
        pauseAtIndices.push(cumulativeIndex);
        cumulativeIndex += wp.route.length;
      });

      const allPoints = waypoints.flatMap(wp => wp.route);
      const segmentTypes = waypoints.flatMap(wp => Array(wp.route.length).fill(wp.mode));
      map.fitBounds(L.polyline(allPoints).getBounds());

      waypoints.forEach((wp, i) => {
        const color = wp.mode === 'wagon' ? 'blue' :
          wp.mode === 'boat'  ? 'green' : wp.mode === 'train' ? (i === 4 ? 'red' : 'blue') : 'gray';
        const dashArray = wp.mode === 'wagon' || wp.mode === 'train' ? '10,5' : null;
        L.polyline(wp.route, { color, weight: 2, opacity: 0.8, dashArray }).addTo(map);

        const marker = L.marker(wp.route[0]).addTo(map).bindPopup(wp.popup);
        // if (i === 0) marker.openPopup();
      });

      let movingMarker = L.marker(allPoints[0]).addTo(map);
      // let movingMarker = L.marker(allPoints[0], { icon: wagonIcon }).addTo(map);
      let currentIndex = 0;
      let isPaused = true;
      let animationTimeout = null;
      let userHasInteracted = false;
      let tourStarted = false;
      let lastPointReached = false;
      let skipNextPause = false;
      let updateIcon = false;


      function initMapAndVariables() {
      tourBtn.style.visibility = 'visible';
        movingMarker = L.marker(allPoints[0]).addTo(map);
        currentIndex = 0;
        isPaused = true;
        tourStarted = false;
        lastPointReached = false;
        animationTimeout = null;
        userHasInteracted = false;
        skipNextPause = false;
        updateIcon = false;
        map.fitBounds(L.polyline(allPoints).getBounds());

      }
      // provide overlay to identify geography (land and water)
      L.tileLayer.provider('Esri.NatGeoWorldMap').addTo(map);

      document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
      document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });

      function clearTimer() {
        if (animationTimeout) {
          clearTimeout(animationTimeout);
          animationTimeout = null;
        }
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
        const resolvedSrc = new URL(src, window.location.href).href;

          // Fit bounds between current and next segment
          const pauseIndex = pauseAtIndices.indexOf(currentIndex - 1);
          const nextPauseIndex = pauseAtIndices[pauseIndex + 1];
        // Only swap source when it changes
        // if (audio.src !== resolvedSrc) {
          audio.pause();
          audio.src = src;
          audio.load();
          audio.play();


          if (pauseIndex !== -1 && nextPauseIndex !== undefined) {
            const segmentBounds = L.latLngBounds([
              allPoints[currentIndex],
              allPoints[nextPauseIndex]
            ]);
            map.fitBounds(segmentBounds, { padding: [20, 20] });
          }
        // }

      }

      function setIcon(index) {
        const type = segmentTypes[index];
        playAmbientSound(type);
        if (type === 'boat') {
          return L.divIcon({ html: '<div style="font-size: 32px;">🚢</div>', iconSize: [0, 0]
            , iconAnchor: [32, 32]
           });
        } else if (type === 'train') {
          return L.divIcon({ html: '<div style="font-size: 32px;">🚂</div>', iconSize: [0, 0], iconAnchor: [32, 32] });
        } else {
          return wagonIcon;
        }
      }

function dispatchEvent(type) {
  switch (type) {
    case "pausePointReached":
      const pauseIndex = pauseAtIndices.indexOf(currentIndex);
      const pausePoint = waypoints[pauseIndex];
      map.setView(allPoints[currentIndex], 10);
      audio.pause();
      movingMarker.bindPopup(pausePoint.popup, {offset: L.point(0, -15)}).openPopup();
      tourBtn.style.visibility = 'visible';
      isPaused = true;
      currentIndex++;
      break;

    case "moveToNextPoint":
      if(isPaused) {
        isPaused = false;
        setIcon(currentIndex);
      }
      movingMarker.closePopup();
      movingMarker.setLatLng(allPoints[currentIndex]);
      // setIcon(currentIndex);
      animationTimeout = setTimeout(() => {
      currentIndex++;
      moveMarker();
      }, 1000);

    if (currentIndex === allPoints.length - 1) {
      tourBtn.textContent = "Click to Restart Journey";
      lastPointReached = true;
    }  

      break;

    case "journeyComplete":
      initMapAndVariables();
      break;
  }
}

function moveMarker() {
  // if (!tourStarted || isPaused) return;

  if (currentIndex >= allPoints.length) {
    tourBtn.textContent = "Click to Restart Journey";
    dispatchEvent("journeyComplete");
    return;
  }

  // ✅ Move first, then check pause
  movingMarker.setLatLng(allPoints[currentIndex]);
  map.setView(allPoints[currentIndex], 10);

  if (pauseAtIndices.includes(currentIndex)) {
    dispatchEvent("pausePointReached");
    currentIndex++; // ✅ Advance so we don’t loop
    return;
  }

  animationTimeout = setTimeout(() => {
    currentIndex++;
    moveMarker();
  }, 1000);

}

tourBtn.addEventListener('click', () => {
  // if (!tourStarted) {
  //   tourStarted = true; // ✅ Start the journey
  //   tourBtn.textContent = `Click to Continue ${name}'s Journey`;
  // }
  
  // tourBtn.style.visibility = 'hidden';
  // // isPaused = false;
  // skipNextPause = true;
  //   movingMarker.setIcon(setIcon(currentIndex));

  tourBtn.style.visibility = 'hidden';
  isPaused = false;

  // ✅ Set icon only when resuming
  movingMarker.setIcon(setIcon(currentIndex));

  moveMarker();

});
  // find out where you are on the map
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