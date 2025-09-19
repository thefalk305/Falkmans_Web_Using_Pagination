window.onload = function () {
  const map = L.map('map');
  // Base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const tourBtn = document.getElementById('tour-btn');

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
  const departingArbrå =  `<b>Arbrå</b>`

  const departingGothenburg =  `<b>Göteborg</b>`

  const arrivalHamburg  = `<b>Kingston on Hamburg, England</b>`

  const arrivalBrenem  = `<b>Brenem</b>`

  const arrivalNewYork  = `<b>New York, New York</b>`

  const arrivalDuBois  = `<b>DuBois</b>`

  const arrivalChicago  = `A city `

  // text for each waypoint
  const departingArbrå =  `<b>Arbrå</b><br>Departing Arbrå, Sweden.  This is where Nil's journey begins. And so it was that on Tuesday, the 6th of October 1891. Nils shook his father's hand and gave his mother one last hug. Then said 'Good Bye' to the rest of the family members present. And off he would go to start his journey. He left from Arbrå (See the link under Places) on the eastern coast of Sweden. It would have been a cool, crisp morning and Nils would have been anxious to start. For this would be a long journey. A journey of a life time. He wouldn't have a chance to see Karin. Nils would have either traveled by train or coach (stage coach). Had he traveled by train it would have been an all day excursion, arriving in Göteborg later that evening.  Travel by coach would have been even longer.`

  const departingGothenburg =  `<b>Göteborg</b><br>Upon arrival in <a href="Goteborg.html" target="_blank">Göteborg</a>, Sweden, Nil's set sail for Kingston on Hamburg on the 9th of October upon the <a href="S S Romeo.html" target="_blank">S S Romeo</a>, a steamship built and owned by the Wilson Steamship Line.`

  const arrivalHamburg  = `<b>Kingston on Hamburg, England</b><br>Upon arriving in <a href="Kingston on Hamburg, England.html" target="_blank">Hamburg</a>, Nils would have more than likely stayed on board the ship until transportation was available for the trip to Brenem (See Kingston on Hamburg, under Travel Notes) Once transportation was available, Nils would have boarded a train. Along with the other passengers headed to Brenem. And the second leg of his journey would begin.`

  const arrivalBrenem  = `<b>Brenem</b><br>Upon arrival in <a href="Brenem, England.html" target="_blank">Brenem</a>, he would have headed down to the docks.  Here, in Brenem, is where the second leg of his journey would begin. On the 14<sup>th</sup> of October, he boarded the <a href="R M S Britannic.html" target="_blank">RMS Britannic</a>, the ship that would take him across the Atlantic and into New York City on October 23, 1889.`

  const arrivalNewYork  = `<b>New York, New York</b><br>Upon arrival in <a href="New York.html" target="_blank">New York</a> his ship would have docked at Castle Garden. This is where all of the immigrants came through prior to Ellis Island. From there he would have boarded a train at Grand Central Depot. And headed to DuBois Pennsylvania. Where his brother would be waiting.`

  const arrivalDuBois  = `<b>DuBois</b><br>It wasn't clear why Peter had decided to go to <a href="DuBois, Pennsylvania.html" target="_blank">DuBois</a>, Pa. But I recently found out that he had a brother living in DuBois, John Löfgren. John being more than ten years older then Peter had traveled to America some five or six years earlier. And settled in DuBois, Pa. Once Peter settled in, he plied his trade as a shoemaker and waited for his fiancé to arrive. The following year his future wife Katherine (Corine Norén as stated on their marriage license) arrived from Sweden. They applied for a marriage license in the county court house on May 25, 1892. And three days later they had a church wedding. While in DuBois his first child, a son, was born, Herman. Shortly after Herman was born Peter decided to have the family moved to Chicago.`

  const arrivalChicago  = `A city with the representation of literally hundreds of ethnic groups, <a href="Chicago, Illinois.html" target="_blank">Chicago, Illinois</a> has rightfully earned its nickname as "The Melting Pot of America". This is where, in the early 1890's, Nils Falkman and his family finally settled. Here is were they set down their roots. Many generations of Falkman's were born here and still live in and around the Chicagoland area.`

  // define Static markers
  const staticMarkers = [
    { coords: [61.5, 16.01], label: departingArbrå, open: true },
    { coords: [57.70, 11.98], label: departingGothenburg },
    { coords: [53.74, -0.33], label: arrivalHamburg },
    { coords: [53.40, -3.0], label: arrivalBrenem },
    { coords: [40.6986, -74.0405], label: arrivalNewYork },
    { coords: [41.1169, -78.7644], label: arrivalDuBois},
    { coords: [41.88, -87.65], label: arrivalChicago}
  ];

  // Routes
  // Arbrå to Göteborg
  const landRoute0 = [
    [61.5, 16.01], [60.7, 17.0], [59.8, 17.5], [59.3, 18.0], [59, 16.15], [58.9, 14.42], [58.4,13.8], [58.03, 12.77], [57.7, 11.97]];

  // Göteborg to Hamburg, Germany
  const oceanRoute1 = [
    [57.70, 11.98], [57.70, 11.93], [57.69, 11.89], [57.60, 11.65],
    [57.90, 10.78], [57.94, 10.71], [57.32, 8.53], [53.53, 0.19],
    [53.63, -0.17], [53.73, -0.28], [53.74, -0.33]];

  // Hamburg to to Bremen
  const landRoute1 = [
    [53.74, -0.33], [53.79, -1.54], [53.47, -2.25], [53.4, -3.0]];

    // Bremen to New York City
    const oceanRoute2 = [
    [53.4, -3.0], [53.52, -3.12], [53.47, -4.49], [53.37, -5.69],
    [52.01, -6.10], [51.70, -7.71], [51.78, -8.26], [51.81, -8.27],
    [51.84, -8.26], [51.84, -8.29], [51.84, -8.26], [51.81, -8.27],
    [51.78, -8.26], [51.54, -8.19], [51.22, -9.53], [50.00, -15.00],
    [48.00, -25.00], [46.00, -35.00], [44.00, -45.00], [43.00, -55.00],
    [42.73, -63.61], [40.18, -70.22], [40.48, -73.88], [40.55, -74.04],
    [40.64, -74.05], [40.6986, -74.0405]];

  // New York City to DuBois
  const landRoute2 = [
    [40.6986, -74.0405], [39.95, -75.16], [40.26, -76.88], [41.1169, -78.7644]];
  // DuBois to Chicago
  const landRoute3 = [
    [41.1169, -78.7644], [41.18, -80.44], [41.60, -87.59], [41.88, -87.65]];

  // Draw polylines for the entire journey
  // red = wagon, blue = train, green = boat
  [landRoute0, oceanRoute1, landRoute1, oceanRoute2, landRoute2, landRoute3].forEach((route, i) => {
    L.polyline(route, {
      color: i === 0 ? 'red' : (i === 1 || i === 3) ? 'blue' : 'green',
      weight: 2,
      opacity: 0.8,
      dashArray: i % 2 === 1 ? '10,5' : null
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
  const ArbråIndex = allPoints.findIndex(p => p[0] === 61.5 && p[1] === 16.01);
  const GöteborgIndex = allPoints.findIndex(p => p[0] === 57.70 && p[1] === 11.98);
  const HamburgIndex = allPoints.findIndex(p => p[0] === 53.74 && p[1] === -0.33);
  const BrenemIndex = allPoints.findIndex(p => p[0] === 53.4 && p[1] === -3.0);
  const NewYorkIndex = allPoints.findIndex(p => p[0] === 40.6986 && p[1] === -74.0405);
  const DuBoisIndex = allPoints.findIndex(p => p[0] === 41.1169 && p[1] === -78.7644);
  const ChicagoIndex = allPoints.findIndex(p => p[0] === 41.88 && p[1] === -87.65);

  const pauseAtIndices = [ArbråIndex, GöteborgIndex, HamburgIndex, BrenemIndex, NewYorkIndex, DuBoisIndex, ChicagoIndex];

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

  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= allPoints.length) currentIndex = 0;

  // Pause at key waypoints BEFORE updating icon/sound
  if (pauseAtIndices.includes(currentIndex)) {
    let popupContent = '';
    pendingResetAtChicago = false;

    switch (currentIndex) {
      case ArbråIndex: popupContent = departingArbrå; break;
      case GöteborgIndex: popupContent = departingGothenburg; break;
      case HamburgIndex: popupContent = arrivalHamburg; break;
      case BrenemIndex: popupContent = arrivalBrenem; break;
      case NewYorkIndex: popupContent = arrivalNewYork; break;
      case DuBoisIndex: popupContent = arrivalDuBois; break;
      case ChicagoIndex:
        popupContent = arrivalChicago;
        pendingResetAtChicago = true;
        break;
    }

    movingMarker.bindPopup(popupContent).openPopup();
    isPaused = true;
    if (tourBtn) tourBtn.textContent = 'Click to Continue';
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
    currentIndex++;
    moveMarker();
  }, 600);
}

function playAmbientSound(type) {
  if (!userHasInteracted || isMuted) return;

  let src = '';
  switch (type) {
    case 'wagon':
      src = '../assets/sounds/horse-gallop-loop2-103633.mp3';
      audio.volume = 0.3;
      audio.playbackRate = 1.4;
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
    if (tourBtn) tourBtn.textContent = "Click to Start Karin Noréns Journey";
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
};