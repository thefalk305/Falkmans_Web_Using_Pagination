window.onload = function () {
  const map = L.map('map');
  let userHasInteracted = false;

  // Base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const tourBtn = document.getElementById('tour-btn');


  // Routes
  const oceanRoute1 = [
    [57.70, 11.94], [57.70, 11.93], [57.69, 11.89], [57.60, 11.65],
    [57.90, 10.78], [57.94, 10.71], [57.32, 8.53], [53.53, 0.19],
    [53.63, -0.17], [53.73, -0.28], [53.74, -0.33]
  ];

  const landRoute1 = [
    [53.74, -0.33], [53.79, -1.54], [53.47, -2.25], [53.4, -3.0]
  ];

  const oceanRoute2 = [
    [53.4, -3.0], [53.52, -3.12], [53.47, -4.49], [53.37, -5.69],
    [52.01, -6.10], [51.70, -7.71], [51.78, -8.26], [51.81, -8.27],
    [51.84, -8.26], [51.84, -8.29], [51.84, -8.26], [51.81, -8.27],
    [51.78, -8.26], [51.54, -8.19], [51.22, -9.53], [50.00, -15.00],
    [48.00, -25.00], [46.00, -35.00], [44.00, -45.00], [43.00, -55.00],
    [42.73, -63.61], [40.18, -70.22], [40.48, -73.88], [40.55, -74.04],
    [40.64, -74.05], [40.6985, -74.0405]
  ];

  const landRoute2 = [
    [40.6986, -74.0405], [39.95, -75.16], [40.26, -76.88], [41.1169, -78.7644]
  ];
  const landRoute3 = [
    [41.1169, -78.7644], [41.18, -80.44], [41.60, -87.59], [41.88, -87.65]
  ];

  // Draw polylines
  [oceanRoute1, landRoute1, oceanRoute2, landRoute2, landRoute3].forEach((route, i) => {
    L.polyline(route, {
      color: i === 4 ? 'red' : (i % 2 === 0 ? 'blue' : 'green'),
      weight: 2,
      opacity: 0.8,
      dashArray: i % 2 === 0 ? '10,5' : null
    }).addTo(map);
  });

  // All points and viewport
  const allPoints = oceanRoute1.concat( landRoute1,  landRoute1, oceanRoute2, landRoute2, landRoute3);
  map.fitBounds(L.polyline(allPoints).getBounds());

  // Segment types for audio/icon
  const segmentTypes = [
    ...Array(oceanRoute1.length).fill('sea'),
    ...Array(landRoute1.length).fill('land'),
    ...Array(oceanRoute2.length).fill('sea'),
    ...Array(landRoute2.length).fill('land'),
    ...Array(landRoute3.length).fill('land')
  ];

  // Key indices
  const DuBoisIndex = allPoints.findIndex(p => p[0] === 41.1169 && p[1] === -78.7644);
  const ChicagoIndex = allPoints.findIndex(p => p[0] === 41.88 && p[1] === -87.65);
  const HullIndex = allPoints.findIndex(p => p[0] === 53.74 && p[1] === -0.33);
  const LiverpoolIndex = allPoints.findIndex(p => p[0] === 53.4 && p[1] === -3.0);
  const NewYorkIndex = allPoints.findIndex(p => p[0] === 40.6985 && p[1] === -74.0405);
  const GöteborgIndex = allPoints.findIndex(p => p[0] === 57.7 && p[1] === 11.9);

  // State
  let currentIndex = 0;
  let isPaused = false;
  let isMuted = false;
  let animationTimeout = null;
  let tourStarted = false;
  let pendingResetAtChicago = false;
  const pauseAtIndices = [GöteborgIndex, DuBoisIndex, ChicagoIndex, HullIndex, LiverpoolIndex, NewYorkIndex];

  // Moving marker
  const movingMarker = L.marker(allPoints[0], {
    icon: L.divIcon({ html: '🚂', iconSize: [24, 24], iconAnchor: [12, 12] })
  }).addTo(map);

  function clearTimer() {
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      animationTimeout = null;
    }
  }

  const departingGothenburg =  "<b>Göteborg</b><br>Departing Gothenburg, Sweden.  This is where Nil's journey begins. And so it was that on Tuesday, the 6th of October 1891. Nils shook his father's hand and gave his mother one last hug. Then said 'Good Bye' to the rest of the family members present. And off he would go to start his journey. He left from Svenshult (See the link under Places) on the eastern coast of Sweden. It would have been a cool, crisp morning and Nils would have been anxious to start. For this would be a long journey. A journey of a life time. He wouldn't have a chance to see Karin. As she lived over 40 miles away and had to attend to her family choirs. Nils would have either traveled by train or coach (stage coach). Had he traveled by train it would have been an all day excursion, arriving in Göteborg later that evening. "


const arrivalHullEngland  = "<b>Hull</b><br>Upon arriving in Hull, Nils would have more than likely stayed on board the ship until transportation was available for the trip to Liverpool (See Kingston on Hull, under Travel Notes) Once transportation was available, Nils would have boarded a train. Along with the other passengers headed to Liverpool. And the second leg of his journey would begin. "
const arrivalLiverpoolEngland  = "<b>Liverpool</b><br>Upon arrival in Liverpool, he would have headed down to the docks. And boarded the RMS Britannic. Which would take him across the Atlantic and in to New York City"
const arrivalNewYork  = "<b>New York</b><br>Upon arrival in New York his ship would have docked at Castle Garden. This is where all of the immigrants came through prior to Ellis Island. From there he would have boarded a train at Grand Central Depot. And headed to DuBois Pennsylvania. Where his brother would be waiting."
const arrivalDuBois  = "<b>DuBois</b><br>It wasn't clear why Peter had decided to go to DuBois, Pa. But I recently found out that he had a brother living in DuBois, John Löfgren. John being more than ten years older then Peter had traveled to America some five or six years earlier. And settled in DuBois, Pa. Once Peter settled in, he plied his trade as a shoemaker and waited for his fiancé to arrive. The following year his future wife Katherine (Corine Norén as stated on their marriage license) arrived from Sweden. They applied for a marriage license in the county court house on May 25, 1892. And three days later they had a church wedding. While in DuBois his first child, a son, was born, Herman. Shortly after Herman was born Peter decided to have the family moved to Chicago."
const arrivalChicago  = "<b>Chicago</b><br>Arrival: Chicago, Illinois"



  function moveMarker() {
    if (!tourStarted) return;
    // if (isPaused) return;

    // Ensure index stays in bounds
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= allPoints.length) currentIndex = 0;

    // Play ambient based on segment type
    playAmbientSound(segmentTypes[currentIndex]);

    // First point special intro
    // if (currentIndex === 0) {
    //   movingMarker.setLatLng(allPoints[currentIndex]);
    //   movingMarker.setIcon(L.divIcon({ html: '🚂', iconSize: [24, 24], iconAnchor: [12, 12] }));
    //   movingMarker.bindPopup('<b>Göteborg</b><br>Most Swedish Emigrant left from Göteborg by ship. Nils boarded the ship on the 8th of October, 1891. And set sail for Kingston on Hull on the 9th. Nils traveled on the SS Romeo. A steamship built and owned by the Wilson Steamship Line.').openPopup();

    //   clearTimer();
    //   animationTimeout = setTimeout(() => {
    //     if (isPaused) return;
    //     movingMarker.closePopup();
    //     currentIndex++;
    //     moveMarker();
    //   }, 3000);
    //   return;
    // }

    // Set icon for current segment
    const iconType = segmentTypes[currentIndex];
    const icon = L.divIcon({
      html: iconType === 'sea' ? '<div style="font-size: 32px;" >🚢</div>' : '<div style="font-size: 32px;" >🚂</div>',
      iconSize: [0, 0],
      iconAnchor: [16, 16]
    });
    movingMarker.setLatLng(allPoints[currentIndex]);
    movingMarker.setIcon(icon);

    // Pause at key waypoints
    if (pauseAtIndices.includes(currentIndex)) {
      let popupContent = '';
      pendingResetAtChicago = false;

      switch (currentIndex) {
        case GöteborgIndex:
          popupContent = departingGothenburg;
          break;
        case DuBoisIndex:
          popupContent = arrivalDuBois;
          break;
        case ChicagoIndex:
          popupContent = '<b>Chicago, IL</b><br>Finally settling in a new home about four years later.';
          // After Chicago, original logic loops back to start. We'll set a pending reset
          pendingResetAtChicago = true;
          break;
        case HullIndex:
          popupContent = arrivalHullEngland;
          break;
        case LiverpoolIndex:
          popupContent = arrivalLiverpoolEngland;
          break;
        case NewYorkIndex:
          popupContent = arrivalNewYork;
          break;
      }

      movingMarker.bindPopup(popupContent).openPopup();
      // isPaused = true;
      if (tourBtn) tourBtn.textContent = 'Continue';
      clearTimer();
      return; // Wait for user to click Continue
    }

    // Advance through non-waypoint points
    clearTimer();
    animationTimeout = setTimeout(() => {
      // if (isPaused) return;
      movingMarker.closePopup();
      currentIndex++;
      moveMarker();
    }, 600);
  }

  // Pause/Resume button
  // document.getElementById('pause-btn').addEventListener('click', () => {
  //   isPaused = !isPaused;
  //   const btn = document.getElementById('pause-btn');
  //   btn.textContent = isPaused ? 'Resume' : 'Pause';

  //   if (isPaused) {
  //     clearTimer();
  //     audio.pause();
  //   } else {
  //     if (!isMuted) audio.play().catch(() => {});
  //     moveMarker();
  //   }
  // });

  // Mute/Unmute button
  document.getElementById('mute-btn').addEventListener('click', () => {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    btn.textContent = isMuted ? 'UnMute' : 'Mute';
    audio.muted = isMuted;

    if (isMuted) {
      audio.pause();
    } else if (!isPaused) {
      audio.play().catch(() => {});
    }
  });

  // Start/Continue tour button
  tourBtn.addEventListener('click', () => {
    // Mark as interacted for audio policies
    userHasInteracted = true;

    // First click: start tour
    if (!tourStarted) {
      tourStarted = true;
      isPaused = false;
      if (tourBtn) tourBtn.textContent = 'Continue';
      moveMarker();
      return;
    }

    // Continue from a paused waypoint
    if (isPaused) {
      isPaused = false;
      movingMarker.closePopup();

      // If we paused at Chicago, reset to start to keep original looping behavior
      if (pendingResetAtChicago) {
        pendingResetAtChicago = false;
        currentIndex = 0;
      } else {
        // Otherwise step forward to keep motion
        currentIndex = (currentIndex + 1) % allPoints.length;
      }

      moveMarker();
    } else {
      // If not paused but user taps Continue, just keep it moving
      moveMarker();
    }
  });

  // Ambient audio
  const audio = document.getElementById('ambient-audio');
  audio.volume = 0.5; // 50% volume
  audio.muted = false;

  function playAmbientSound(type) {
    if (!userHasInteracted || isMuted) return;

    let src = '';
    switch (type) {
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

  // User interaction unlock for audio
  document.addEventListener('click', () => { userHasInteracted = true; }, { once: false });
  document.addEventListener('keydown', () => { userHasInteracted = true; }, { once: false });

  // Static markers
  const staticMarkers = [
    { coords: [57.7, 11.9], label: departingGothenburg, open: true },
    { coords: [53.7, -0.3], label: arrivalHullEngland },
    { coords: [53.4, -3.0], label: arrivalLiverpoolEngland },
    { coords: [40.6985, -74.0405], label: arrivalNewYork },
    { coords: [41.1169, -78.7644], label: arrivalDuBois},
    { coords: [41.88, -87.65], label: arrivalChicago}
  ];

  staticMarkers.forEach(({ coords, label, open }) => {
    const marker = L.marker(coords).addTo(map).bindPopup(label);
    if (open) marker.openPopup();
  });

  // Do not auto-start; wait for "Start/Continue" button
};