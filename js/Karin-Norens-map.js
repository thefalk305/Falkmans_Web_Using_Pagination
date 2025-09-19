// window.onload = function () {
(function () {

console.log("Script A loaded"); // in Karin-Norens-map-A.js


  if (window.activeMap) {
    window.activeMap.remove(); // Cleanly destroy the previous map
  }
  const map = L.map('map'); // Create new map instance
  window.activeMap = map;   // Store reference globally  // Base layer

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  document.querySelector('#heading-row h1').textContent = "Karin Noren's Journey";
  const tourBtn = document.getElementById('tour-btn');
  if (tourBtn) tourBtn.textContent = "Click to Start Karin Norén's Journey";

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
  const departingArbrå =  `<b><a href="Arbrå, Sweden.html" target="_blank">Arbrå, Sweden</a></b><br> Karin Norén's Journey begins in the small town of Arbrå, Sweden, centrally located near the eastern coast of Sweden. It is situated about 42 miles south-west of <a href="Hudiksvall, Sweden.html" target="_blank">Hudiksvall</a>, the same town where Nils was doing his apprenticeship. She left her home in early May of 1892 and traveled to Göteborg, as did Nils.`

  const departingGothenburg =  `<b><a href="Goteborg.html" target="_blank">Göteborg</a></b><br>Upon arrival in Göteborg, Sweden, Karin boarded the <a href="S S Norden.html" target="_blank">S.S. Norden</a>, a steamship built and owned by the Wilson Steamship Line which took her to Hamburg, Germany</a>.`

  const arrivalHamburg  = `<b><a href="Hamburg, Germany.html" target="_blank">Hamburg, Germany</a></b><br>Upon arriving in Hamburg, Germany, Karin boarded a train for the short trip to Bremen, Germany, which is located about 80 miles (127 km) to the went of Hamburg.`

  const arrivalBremen  = `<b><a href="Bremen, Germany.html" target="_blank">Bremen, Germany</a>, </b><br>Upon arrival in Bremen, Karin made her way down to the docks. It was in Bremen, Germany that she boarded the <a href="S S Trave.html" target="_blank">SS Trave</a>, the ship that would take her all the way across the Atlantic Ocean to New York City. This voyage lasted about nine days.`

  const arrivalNewYork  = `<b><a href="New York.html" target="_blank">New York City</a> </b><br>Karin Norén arrived in New York City on <span class="date">📅 Friday, May 21<sup>st</sup>, 1892</span>. She had turned 24 years old the previous December. Upon arrival in New York, her ship would have docked at Ellis Island which had started operation in January of that year. From here she would have boarded a train at Grand Central Depot. The train was heading to DuBois, Pennsylvania where her fiancé, Nil's had arrived six months earlier.`

  const arrivalDuBois  = `<b><a href="DuBois, Pennsylvania.html" target="_blank">DuBois, Pennsylvania</a> </b><br>After leaving New York Karin would have arrived in DuBois the following day, meeting up with her fiancé, Nil's whom she hadn't seen for over six months. On May 25, 1892, three days after arriving in DuBois, Nil's and Karin applied for a marriage license at the county court house and three days later they had a church wedding. It was in DuBois on September 1<sup>st</sup>, 1893, that their first child, Herman (my grandfather), was born. Shortly after Herman's birth, Nil's and Karin decided to leave DuBois and relocate to Chicago, Illinois.`

  const arrivalChicago  = `<b><a href="Chicago, Illinois.html" target="_blank">Chicago, Illinois</a></b><br>A city with the representation of literally hundreds of ethnic groups, has rightfully earned its nickname as "The Melting Pot of America". Perhaps this is why Nil's and Karin, being new immigrants from Sweden, decided to relocate there. This is where, in the early 1890's, Nils and Karin Falkman finally settled. This is where they set down their roots. This is where many generations of Falkman's were born, with many still living in and around the Chicagoland area.`

  // Routes
  // Arbrå to Göteborg
  const landRoute0 = [
    [61.5, 16.01], [60.7, 17.0], [59.8, 17.5], [59.3, 18.0], [59, 16.15], [58.9, 14.42], [58.4,13.8], [58.03, 12.77], [57.7, 11.97]];

  // Göteborg to Hamburg, Germany
  const oceanRoute1 = [
    [57.70, 11.98], [56.50,11.43], [56.034672,12.65],
    [55.59,12.79], [54.96,12.50], [54.36,11.92], [53.96,10.81],
    [53.55,9.88]];

  // Hamburg to to Bremen
  const landRoute1 = [
    [53.55, 9.90], [53.36,9.66], [53.21,9.21], [53.07, 8.78]];

  // Bremen to New York City (over water)
  const oceanRoute2 = [
    [53.08, 8.80], [53.79, 7.85], [54.20, 5.50], [53.60, 3.50], [51.00, 1.50], 
    [50.10, -1.50], [49.49, -5.83], [48.88, -10.16], [48.27, -14.49], [47.66, -18.82],
    [47.05, -23.15], [46.44, -27.48], [45.83, -31.81], [45.22, -36.14], [44.61, -40.47],
    [44.00, -45.00], [43.00, -55.00], [42.73, -63.61], [40.18, -70.22], [40.48, -73.88], 
    [40.55, -74.04], [40.64, -74.05], [40.6986, -74.0405]];

    // New York City to DuBois
  const landRoute2 = [
    [40.6986, -74.0405], [40.80, -75.16], [40.90, -76.88], [41.1169, -78.7644]];

  // DuBois to Chicago
  const landRoute3 = [[41.117, -78.77],[41.2876, -80.798],[41.2876, -82.826],
    [41.2876, -84.854],[41.40, -87.00],[41.88,  -87.65]];

    // define Static markers
  const staticMarkers = [
    { coords: landRoute0[0], label: departingArbrå, open: true },
    { coords: oceanRoute1[0], label: departingGothenburg },
    { coords: landRoute1[0], label: arrivalHamburg },
    { coords: oceanRoute2[0], label: arrivalBremen },
    { coords: landRoute2[0], label: arrivalNewYork },
    { coords: landRoute3[0], label: arrivalDuBois},
    { coords: landRoute3[5], label: arrivalChicago}
  ];

  // Draw polylines for the entire journey
  // red = wagon, blue = train, green = boat
  [landRoute0, oceanRoute1, landRoute1, oceanRoute2, landRoute2, landRoute3].forEach((route, i) => {
    L.polyline(route, {
      // color: !(i % 2) ? 'red' : 'blue',
      color: (i === 1 || i === 3) ? 'blue' : 'red',
      weight: 2,
      opacity: 0.8,
      // dashArray: i % 2 === 1 ? '10,5' : null
      dashArray: i = '10,5'
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

  // Key indices (are the first points in each 'route')
  const ArbråIndex = allPoints.findIndex(p => p[0] === landRoute0[0][0] && p[1] === landRoute0[0][1]);
  const GöteborgIndex = allPoints.findIndex(p => p[0] === oceanRoute1[0][0] && p[1] === oceanRoute1[0][1]);
  const HamburgIndex = allPoints.findIndex(p => p[0] === landRoute1[0][0] && p[1] === landRoute1[0][1]);
  const BremenIndex = allPoints.findIndex(p => p[0] === oceanRoute2[0][0] && p[1] === oceanRoute2[0][1]);
  const NewYorkIndex = allPoints.findIndex(p => p[0] === landRoute2[0][0] && p[1] === landRoute2[0][1]);
  const DuBoisIndex = allPoints.findIndex(p => p[0] === landRoute3[0][0] && p[1] === landRoute3[0][1]);
  // ChicagoIndex is last point in landRoute3
  const ChicagoIndex = allPoints.findIndex(p => p[0] === landRoute3[5][0] && p[1] === landRoute3[5][1]);

  const pauseAtIndices = [ArbråIndex, GöteborgIndex, HamburgIndex, BremenIndex, NewYorkIndex, DuBoisIndex];

  // put 'wagon' icon at Start (Arbrå)
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

    tourBtn.style.visibility = 'hidden'; // ← make sure it's visible

    // Pause at key waypoints BEFORE updating icon/sound
    if (pauseAtIndices.includes(currentIndex)) {
      let popupContent = '';
      pendingResetAtChicago = false;

      tourBtn.style.visibility = 'visible'; // ← make sure it's visible
      switch (currentIndex) {
        case ArbråIndex: popupContent = departingArbrå; break;
        case GöteborgIndex: popupContent = departingGothenburg; break;
        case HamburgIndex: popupContent = arrivalHamburg; break;
        case BremenIndex: popupContent = arrivalBremen; break;
        case NewYorkIndex: popupContent = arrivalNewYork; break;
        case DuBoisIndex: popupContent = arrivalDuBois; break;
        case ChicagoIndex:popupContent = arrivalChicago; pendingResetAtChicago = true; break;
      }

      movingMarker.bindPopup(popupContent).openPopup();
      isPaused = true;
      if (tourBtn) tourBtn.textContent = ChicagoIndex === currentIndex ? 'Click to Restart' : 'Click to Continue';
      clearTimer();
      return; // Stop here until user clicks
    }

    // Only runs if not paused
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
        iconUrl: '../images/stagecoach.svg',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    }

    movingMarker.setLatLng(allPoints[currentIndex]);
    movingMarker.setIcon(icon);
    playAmbientSound(iconType);

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
        audio.playbackRate = 1.2;
        break;
      case 'boat':
        src = '../assets/sounds/ship-horn-distant-38390.mp3';
        audio.volume = 0.4;
        audio.playbackRate = 1.4;
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

    if (audio.src !== resolvedSrc) {
      audio.pause();
      audio.src = src;
      audio.load();
    }

    if (!isPaused && !audio.paused && audio.src === resolvedSrc) return;

    if (!isPaused) {
      audio.play().catch(err => console.warn('Audio play failed:', err));
    }
  }

// Start/Continue tour button
  tourBtn.addEventListener('click', () => {
    userHasInteracted = true;

  if (!tourStarted) {
    tourStarted = true;
    isPaused = false;

    // Skip pause at Arbrå on first click
    if (currentIndex === ArbråIndex) {
      currentIndex++;
    }

    moveMarker();
    return;
  }

  if (isPaused) {
    isPaused = false;
    movingMarker.closePopup();
    currentIndex++;
    if (pendingResetAtChicago) {
      pendingResetAtChicago = false;
      currentIndex = 0;

      // Clear any lingering popup
      movingMarker.closePopup();

      // Immediately show Arbrå popup again
      const popupContent = departingArbrå;
      movingMarker.setLatLng(allPoints[currentIndex]);
      movingMarker.setIcon(wagonIcon); // optional: reset icon
      movingMarker.bindPopup(popupContent).openPopup();
      isPaused = true;
      if (tourBtn) tourBtn.textContent = "Click to Start Karin Norén's Journey";
      return; // wait for user to click again
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