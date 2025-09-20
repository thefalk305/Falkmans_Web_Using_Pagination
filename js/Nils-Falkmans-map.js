// window.onload = function () {
(function () {

  if (window.activeMap) {
    window.activeMap.remove(); // Cleanly destroy the previous map
  }
  const map = L.map('map'); // Create new map instance
  window.activeMap = map;   // Store reference globally  // Base layer

let skipNextPause = false;  // find out where you are on the map

// const clickedPoints = []; // Global array to store latlngs

// function onMapClick(e) {
//   const lat = e.latlng.lat.toFixed(2);
//   const lng = e.latlng.lng.toFixed(2);
//   const point = `[ ${lat}, ${lng} ],`;
//   clickedPoints.push(point);
//   console.log("Clicked points:", clickedPoints);
//   // alert("You clicked the map at " + point);
// } 

// map.on('click', onMapClick);

  // Base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  document.querySelector('#heading-row h1').textContent = "Nils Falkman's Journey";

  const tourBtn = document.getElementById('tour-btn');
  if (tourBtn) tourBtn.textContent = "Click to Start Nils Falkman's Journey";

   // Initialize State
  let currentIndex = 0;
  let isPaused = false;
  let isMuted = false;
  let animationTimeout = null;
  let tourStarted = false;
  let pendingResetAtChicago = false;

  const wagonIcon = L.icon({
    iconUrl: '../images/stagecoach.svg', // adjust path as needed
    iconSize: [40, 40],       // size of the icon in pixels
    iconAnchor: [20, 20],     // point of the icon which corresponds to marker's location
    popupAnchor: [0, -20]     // where the popup opens relative to the iconAnchor
  });
  
  // can't start audio until user Has Interacted
  let userHasInteracted = false;

  // Ambient audio
  const audio = document.getElementById('ambient-audio');
  audio.volume = 0.5; // 50% volume
  audio.muted = false;

  // text for each waypoint
  const departingSvenshult =  `<b><a href="Svenshult.html" target="_blank">Svenshult, Sweden</a></b><br> Nil's journey begins in Svenshult, Sweden. And so it was that on Tuesday, the 6th of October 1891. Nils shook his father's hand and gave his mother one last hug. Then said 'Good Bye' to the rest of the family members present. And off he would go to start his journey. He left from Svenshult (See the link under Places) on the eastern coast of Sweden. It would have been a cool, crisp morning and Nils would have been anxious to start. For this would be a long journey. A journey of a life time. He wouldn't have a chance to see Karin. Nils would have either traveled by train or coach (stage coach). Had he traveled by train it would have been an all day excursion, arriving in Göteborg later that evening.  Travel by coach would have been even longer.`

  const departingGothenburg =  `<b><a href="Goteborg.html" target="_blank">Göteborg, Sweden</a></b><br> Upon arrival in Göteborg, Sweden, Nils set sail for Kingston on Hull on the 9th of October upon the <a href="S S Romeo.html" target="_blank">S S Romeo</a>, a steamship built and owned by the Wilson Steamship Line.`

  const arrivalHullEngland  = `<b><a href="Kingston on Hull, England.html" target="_blank">Kingston on Hull, England</a></b><br>Upon arriving in Hull, Nils would have more than likely stayed on board the S S Romeo until transportation was available for the trip to Liverpool (See Kingston on Hull, under Travel Notes) Once transportation was available, Nils would have boarded a train along with the other passengers headed to Liverpool.`

  const arrivalLiverpoolEngland  = `<b><a href="Liverpool, England.html" target="_blank">Liverpool, England</a></b><br>Upon arrival in Liverpool, Nils would have headed down to the docks.  Here, in Liverpool, is where the second leg of his journey would begin. On the 14<sup>th</sup> of October, 1891, Nils boarded the <a href="R M S Britannic.html" target="_blank">RMS Britannic</a>; the ship that would take him across the Atlantic and into New York City on October 23.`

  const arrivalNewYork  = `<b><a href="New York.html" target="_blank">New York, New York</a></b><br>Arrival New York City. In October 1891, immigrants arriving in New York were processed at the Barge Office which was located at the Battery in Lower Manhattan. This facility served as a temporary immigration station between the closure of Castle Garden and the opening of Ellis Island.  From there he would have boarded a train at Grand Central Depot. And headed to DuBois Pennsylvania. Where his brother would be waiting.`

  const arrivalDuBois  = `<b><a href="DuBois, Pennsylvania.html" target="_blank">DuBois, Pennsylvania</a></b><br>It wasn't clear why Peter had decided to go to DuBois, Pennsylvania., but I recently found out that he had a brother living in DuBois, John Löfgren. John, being more than ten years older then Peter, had traveled to America some five or six years earlier. John settled in DuBois, Pa. Once Peter settled in, he plied his trade as a shoemaker and waited for his fiancé to arrive. The following year his future wife Katherine (Corine Norén as stated on their marriage license), arrived from Sweden. Nils and Karin applied for a marriage license in the county court house on May 25, 1892. Three days later they had a church wedding. It was in DuBois on September 1<sup>st</sup>, 1893, that their first child, Herman (my grandfather), was born. Shortly after Herman's birth, Nils and Karin decided to leave DuBois and relocate to Chicago, Illinois.`

  const arrivalChicago  = `<b><a href="Chicago, Illinois.html" target="_blank">Chicago, Illinois</a></b><br>A city with the representation of literally hundreds of ethnic groups, has rightfully earned its nickname as "The Melting Pot of America". Perhaps this is why Nils and Karin, being new immigrants from Sweden, decided to relocate there. This is where, in the early 1890's, Nils and Karin Falkman finally settled. This is where they set down their roots. This is where many generations of Falkman's were born, with many still living in and around the Chicagoland area.`

  // Routes
  // Svenshult to Göteborg
  const landRoute0 = [[56.60, 13.50], [56.51, 13.35], [56.55, 13.02], [56.75, 12.85], [56.91, 12.54], [57.11, 12.33], [57.31, 12.22], [57.46, 12.10], [57.71, 11.98], [57.70, 11.94]];

  // Göteborg to Hull England
  const oceanRoute1 = [
    [57.70, 11.93], [57.62, 11.72], [57.61, 11.54], [57.74, 11.20], [57.87, 10.85],
    [57.89, 10.59], [57.82, 9.85], [57.58, 8.87], [57.05, 6.82], [56.65, 5.99],
    [56.16, 4.76], [55.04, 2.76], [53.59, 0.37], [53.54, 0.19], [53.63, -0.16],
    [53.74, -0.32]];

    // Hull to Liverpool England
  // const landRoute0_5 = [
  //   [53.74, -0.32], [53.74, -0.33], [53.79, -1.54], [53.47, -2.25], [53.4, -3.0],
  //   [53.4, -3.0], [53.60, -3.30], [53.60, -4.70], [53.37, -5.00], [52.01, -5.70],
  //   [51.00, -7.51], [50.00, -15.00], [48.00, -25.00], [46.00, -35.00], [44.00, -45.00],
  //   [43.00, -55.00], [42.73, -63.61], [40.18, -70.22], [40.48, -73.88], [40.55, -74.04],
  //   [40.64, -74.05], [40.6986, -74.0405]];

  // Hull to Liverpool 
  const landRoute1 = [
[53.74, -0.35],
[53.72, -0.47],
[53.72, -0.56],
[53.74, -0.71],
[53.79, -1.04],
[53.79, -1.35],
[53.81, -1.45],
[53.79, -1.56],
[53.77, -1.59],
[53.75, -1.58],
[53.72, -1.63],
[53.67, -1.66],
[53.68, -1.71],
[53.70, -1.79],
[53.69, -1.83],
[53.71, -1.90],
[53.73, -1.95],
[53.74, -2.02],
[53.72, -2.09],
[53.59, -2.18],
[53.49, -2.23],
[53.46, -2.48],
[53.43, -2.69],
[53.41, -2.82],
[53.40, -2.98],
[53.40, -3.04],
];

    // Liverpool to New York City
    const oceanRoute2 = [
    [53.4, -3.0], [53.60, -3.30], [53.60, -4.70], [53.37, -5.00],
    [52.01, -5.70], [51.00, -7.51], [50.00, -15.00],
    [48.00, -25.00], [46.00, -35.00], [44.00, -45.00], [43.00, -55.00],
    [42.73, -63.61], [40.18, -70.22], [40.48, -73.88], [40.55, -74.04],
    [40.64, -74.05], [40.6986, -74.0405]];

  // New York City to DuBois
  const landRoute2 = [[40.70, -74.10],[40.59, -74.75],[40.58, -75.41],[40.52, -76.20],
  [40.40, -76.56],[40.55, -77.21],[40.76, -77.64],[40.95, -78.10],[41.01, -78.40], [ 41.12, -78.78 ]];

  // DuBois to Chicago
  // // DuBois to Chicago
  const landRoute3 = [[41.11, -78.83], [41.18, -80.21], [41.06, -80.81], [41.22, -81.45],
  [41.33, -82.56], [41.56, -83.64], [41.64, -84.81], [41.74, -86.21], [41.56, -86.90], 
  [41.56, -87.52], [41.90, -87.65]];

  // Static markers
  const staticMarkers = [
    { coords: landRoute0[0], label: departingSvenshult, open: true },
    { coords: oceanRoute1[0], label: departingGothenburg },
    { coords: landRoute1[0], label: arrivalHullEngland },
    { coords: oceanRoute2[0], label: arrivalLiverpoolEngland },
    { coords: landRoute2[0], label: arrivalNewYork },
    { coords: landRoute3[0], label: arrivalDuBois},
    { coords: landRoute3[10], label: arrivalChicago}
  ];

  // Draw polylines for the entire journey
  // red = wagon, blue = train, green = boat
  [landRoute0, oceanRoute1, landRoute1, oceanRoute2, landRoute2, landRoute3].forEach((route, i) => {
    L.polyline(route, {
      color: i === 4 ? 'red' : (i % 2 === 0 ? 'blue' : 'green'),
      weight: 2,
      opacity: 0.8,
      dashArray: i % 2 === 0 ? '10,5' : null
    }).addTo(map);
  });

  // All points and viewport
  const allPoints = landRoute0.concat( oceanRoute1, landRoute1, oceanRoute2, landRoute2, landRoute3);

  // After map is fitted
  map.fitBounds(L.polyline(allPoints).getBounds());

  // place Static markers on map
  staticMarkers.forEach(({ coords, label, open }) => {
    const marker = L.marker(coords).addTo(map).bindPopup(label);
    if (open) marker.openPopup();
  });

  // Segment types for audio/icon
  const segmentTypes = [
    ...Array(landRoute0.length).fill('wagon'),
    ...Array(oceanRoute1.length).fill('boat'),
    ...Array(landRoute1.length).fill('train'),
    ...Array(oceanRoute2.length).fill('boat'),
    ...Array(landRoute2.length).fill('train'),
    ...Array(landRoute3.length).fill('train')
  ];

  // Key indices
  const SvenshultIndex = allPoints.findIndex(p => p[0] === landRoute0[0][0] && p[1] === landRoute0[0][1]);
  const GöteborgIndex = allPoints.findIndex(p => p[0] === oceanRoute1[0][0] && p[1] === oceanRoute1[0][1]);
  const HullIndex = allPoints.findIndex(p => p[0] === landRoute1[0][0] && p[1] === landRoute1[0][1]);
  const LiverpoolIndex = allPoints.findIndex(p => p[0] === oceanRoute2[0][0] && p[1] === oceanRoute2[0][1]);
  const NewYorkIndex = allPoints.findIndex(p => p[0] === landRoute2[0][0] && p[1] === landRoute2[0][1]);
  const DuBoisIndex = allPoints.findIndex(p => p[0] === landRoute3[0][0] && p[1] === landRoute3[0][1]);
  // ChicagoIndex is last point in landRoute3
  const ChicagoIndex = allPoints.findIndex(p => p[0] === landRoute3[10][0] && p[1] === landRoute3[10][1]);


  const pauseAtIndices = [SvenshultIndex, GöteborgIndex,  HullIndex, LiverpoolIndex, NewYorkIndex, DuBoisIndex];

  // put 'wagon' icon at Svenshult
  const movingMarker = L.marker(allPoints[0], {
    icon: wagonIcon
  }).addTo(map);

  function clearTimer() {
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      animationTimeout = null;
    }
  }

  function moveMarker() {
    if (!tourStarted) return;
    if (isPaused) return;

    // Ensure index stays in bounds
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= allPoints.length) currentIndex = 0;

    tourBtn.style.visibility = 'hidden';

  // Pause at key waypoints BEFORE updating icon/sound
  if (skipNextPause) {
    skipNextPause = false; // reset immediately
    console.log("Skipping pause at index", currentIndex);

  } else if (pauseAtIndices.includes(currentIndex)) {
    audio.pause(); // ✅ Stop ambient sound immediately
    let popupContent = '';
    pendingResetAtChicago = false;

    tourBtn.style.visibility = 'visible';

    switch (currentIndex) {
      case SvenshultIndex: popupContent = departingSvenshult; break;
      case GöteborgIndex: popupContent = departingGothenburg; break;
      case HullIndex: popupContent = arrivalHullEngland; break;
      case LiverpoolIndex: popupContent = arrivalLiverpoolEngland; break;
      case NewYorkIndex: popupContent = arrivalNewYork; break;
      case DuBoisIndex: popupContent = arrivalDuBois; break;
      case ChicagoIndex:
        popupContent = arrivalChicago;
        pendingResetAtChicago = true;
        break;
    }

    movingMarker.bindPopup(popupContent).openPopup();
    isPaused = true;
    if (tourBtn) tourBtn.textContent = ChicagoIndex === currentIndex ? 'Click to Restart' : 'Click to Continue';
    clearTimer();
    return;
  }


    // Set icon for current segment
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

    movingMarker.setLatLng(allPoints[currentIndex]);
    movingMarker.setIcon(icon);
  // Play ambient based on segment type
    // playAmbientSound(segmentTypes[currentIndex]);
    playAmbientSound(iconType);

    // Pause at key waypoints
    // Advance through non-waypoint points
    clearTimer();

    animationTimeout = setTimeout(() => {
      if (isPaused) return;
      movingMarker.closePopup();

    if (currentIndex < allPoints.length - 1) {
      currentIndex++;
      moveMarker();
    } else {
      // Final point reached — pause and show Chicago popup
      const popupContent = arrivalChicago;
      movingMarker.bindPopup(popupContent).openPopup();
      isPaused = true;
      pendingResetAtChicago = true;

      tourBtn.style.visibility = 'visible'; // ← make sure it's visible
      if (tourBtn) tourBtn.textContent = 'Click to Restart';
      clearTimer();
    }    
  }, 600);
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

    const resolvedSrc = new URL(src, window.location.href).href;

    // Only swap source when it changes
    if (audio.src !== resolvedSrc) {
      audio.pause();
      audio.src = src;
      audio.load();
    }

    if (!isPaused && !audio.paused && audio.src === resolvedSrc) {
      // already playing the right thing
      return;
    }

    if (!isPaused) {
      audio.play().catch(err => console.warn('Audio play failed:', err));
    }
  }

  // Start/Continue tour button
  tourBtn.addEventListener('click', () => {
    userHasInteracted = true;
    movingMarker.closePopup(); // Always close popup immediately


  // ✅ Close any lingering popups, including static markers
  movingMarker.closePopup();
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && layer.getPopup()) {
      layer.closePopup();
    }
  });




  if (!tourStarted) {
    tourStarted = true;
    isPaused = false;

    if (currentIndex === SvenshultIndex) {
      currentIndex++;           // Skip first pause
      skipNextPause = true;     // Prevent popup from reopening
    }

    moveMarker();
    return;
  }  
  if (isPaused) {
    isPaused = false;
    currentIndex++;

    if (pendingResetAtChicago) {
      pendingResetAtChicago = false;
      currentIndex = 0;
      movingMarker.closePopup();

      const popupContent = departingSvenshult;
      movingMarker.setLatLng(allPoints[currentIndex]);
      movingMarker.setIcon(wagonIcon);
      movingMarker.bindPopup(popupContent).openPopup();
      isPaused = true;
      if (tourBtn) tourBtn.textContent = "Click to Start Nils Falkman's Journey";
      return;
    }

    moveMarker();
  } else {
    moveMarker();
  }
});

  // User interaction unlock for audio
  document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
  document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });

  // Do not auto-start; wait for "Start/Continue" button
})();