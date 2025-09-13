window.onload = function () {
 // alert("I'm Loaded");

  // Initialize the map
  const map = L.map('map');

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Define migration route segments
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

  // Combine all points
  const allPoints = oceanRoute1.concat(landRoute1, oceanRoute2, landRoute2, landRoute3);
  map.fitBounds(L.polyline(allPoints).getBounds());

  // Segment types
  const segmentTypes = [
    ...Array(oceanRoute1.length).fill('sea'),
    ...Array(landRoute1.length).fill('land'),
    ...Array(oceanRoute2.length).fill('sea'),
    ...Array(landRoute2.length).fill('land'),
    ...Array(landRoute3.length).fill('land')
  ];

  // Icons
  const seaIcon = L.divIcon({ className: 'custom-sea-icon', html: '🚢', iconSize: [24, 24], iconAnchor: [12, 12] });
  const travelerIcon = L.divIcon({ className: 'custom-traveler-icon', html: '🚂', iconSize: [24, 24], iconAnchor: [12, 12] });

  // Index markers
  const pauseIndexDuBois = allPoints.findIndex(p => p[0] === 41.1169 && p[1] === -78.7644);
  const finalIndexChicago = allPoints.findIndex(p => p[0] === 41.88 && p[1] === -87.65);
  const startIndexGoteborg = allPoints.findIndex(p => p[0] === 57.7 && p[1] === 11.9);
  const hullIndex = allPoints.findIndex(p => p[0] === 53.74 && p[1] === -0.33);
  const liverpoolIndex = allPoints.findIndex(p => p[0] === 53.4 && p[1] === -3.0);


  // Moving marker
  let currentIndex = 0;
  let movingMarker = L.marker(allPoints[0], { icon: travelerIcon }).addTo(map);

  function moveMarker() {
  if (currentIndex === 0) {
    movingMarker.setLatLng(allPoints[currentIndex]);
    movingMarker.setIcon(travelerIcon);
    movingMarker.bindPopup('<b>Göteborg</b><br>Most Swedish Emigrant left from here').openPopup();
    setTimeout(() => {
      movingMarker.closePopup();
      currentIndex++;
      moveMarker();
    }, 3000);
    return;
  }

  if (currentIndex < allPoints.length) {
    const iconType = segmentTypes[currentIndex];
    const icon = L.divIcon({
      className: iconType === 'sea' ? 'custom-sea-icon' : 'custom-traveler-icon',
      html: iconType === 'sea' ? '🚢' : '🚂',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    movingMarker.setLatLng(allPoints[currentIndex]);
    movingMarker.setIcon(icon);

    if (currentIndex === pauseIndexDuBois) {
      movingMarker.bindPopup('<b>DuBois, PA</b><br>Here is where N.P. Falkman met up with his brother Johan').openPopup();
      setTimeout(() => {
        movingMarker.closePopup();
        currentIndex++;
        moveMarker();
      }, 3000);
    } 
      else if (currentIndex === hullIndex) {
    movingMarker.bindPopup('<b>Hull, England</b><br>Here we transfer to a train for Liverpool').openPopup();
    setTimeout(() => {
    movingMarker.closePopup();
    currentIndex++;
    moveMarker();
  }, 3000);
}

 else if (currentIndex === liverpoolIndex) {
  movingMarker.bindPopup('<b>Liverpool, England</b><br>Where we board a trans-Atlantic steamer for New York').openPopup();
  setTimeout(() => {
    movingMarker.closePopup();
    currentIndex++;
    moveMarker();
  }, 3000);
}
     
     else if (currentIndex === finalIndexChicago) {
  movingMarker.bindPopup('<b>Chicago, IL</b><br>Finally settling in a new home.').openPopup();
  setTimeout(() => {
    movingMarker.closePopup();
    currentIndex = 0;
    moveMarker();
      }, 4000);
    } else {
      currentIndex++;
      setTimeout(moveMarker, 600);
    }
  }
}

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
