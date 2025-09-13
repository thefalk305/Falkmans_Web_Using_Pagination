
window.onload = function () {
 // alert("I'm Loaded");


  // Initialize the map
  var map = L.map('map');

  // Define migration route coordinates
 
 
 
/*
var migrationRoute = [
    [57.7, 11.9], // Göteborg
    [57.9, 9.8],   // Intermediate stop
    [56.4, 4.81],  // Intermediate stop
    [53.74, -0.33], // Hull
    [53.40, -2.99], // Liverpool
    [53.52, -3.14], // Way Point
    [53.52, -3.23], // Way Point
    [53.41, -5.22], // Way Point
    [52.06, -5.81], // Way Point
    [50.97, -9.58], // Way Point
    [45.27, -34.53], // Way Point
    [41.13, -66.86], // Way Point
    [40.40, -73.22], // Way Point
    [40.54, -73.99], // Way Point
    [40.56, -74.05], // Way Point
    [40.64, -74.05], // Way Point
    [40.69, -74.04] // New York
];
*/


// Over ocean segment
var oceanRoute1 = [
  [57.70, 11.94], // Göteborg
  [57.70, 11.93],
  [57.69, 11.89],
  [57.60, 11.65],
  [57.90, 10.78],
  [57.94, 10.71],
  [57.32, 8.53],
  [53.53, 0.19],
  [53.63, -0.17],
  [53.73, -0.28],
  [53.74, -0.31] // Hull
];

L.polyline(oceanRoute1, {
  color: 'blue',
  weight: 2,
  opacity: 0.8,
  dashArray: '10,5'
}).addTo(map);

// Over land segment
var landRoute1 = [
  [53.74, -0.33], // Hull
  [53.79, -1.54],
  [53.47, -2.25],
  [53.4, -3.0]  // Liverpool
];

L.polyline(landRoute1, {
  color: 'green',
  weight: 2,
  opacity: 0.8
}).addTo(map);

// Over ocean segment
var oceanRoute2 = [
  [53.4, -3.0], // Liverpool
  [53.52, -3.12],
  [53.47, -4.49],
  [53.37, -5.69],
  [52.01, -6.10],
  [51.70, -7.71],
  [51.78, -8.26],
  [51.81, -8.27],
  [51.84, -8.26],
  [51.84, -8.29],
  [51.84, -8.26],
  [51.81, -8.27],
  [51.78, -8.26],
  [51.54, -8.19],
  [51.22, -9.53],    
  [50.00, -15.00], 
  [48.00, -25.00], 
  [46.00, -35.00],  
  [44.00, -50.00],   
  [43.00, -58.00],   
  [42.73, -63.61],   
  [40.18, -70.22],
  [40.48, -73.88],
  [40.55, -74.04],
  [40.64, -74.05],
  [40.6985, -74.0405] // New York
];

L.polyline(oceanRoute2, {
  color: 'blue',
  weight: 2,
  opacity: 0.8,
  dashArray: '10,5'
}).addTo(map);


// Over land segment
var landRoute2 = [
  [40.6986, -74.0405], // New York USA
  [39.95, -75.16],
  [40.26, -76.88],
  [41.1169, -78.7644], // DuBois PA
];

L.polyline(landRoute2, {
  color: 'green',
  weight: 2,
  opacity: 0.8
}).addTo(map);


// Over land segment
var landRoute3 = [
  [41.1169, -78.7644], // DuBois PA
  [41.18, -80.44],
  [41.60, -87.59],
  [41.88, -87.65], // Chicago Illinois
];

L.polyline(landRoute3, {
  color: 'red',
  weight: 2,
  opacity: 0.8
}).addTo(map);




  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

/*
// Draw migration route as a polyline
var routeLine = L.polyline(migrationRoute, {
  color: 'blue',
  weight: 2,
  opacity: 0.7,
  dashArray: '10,5'
}).addTo(map);
*/



 

 // Fit map view to the route
 var allPoints = oceanRoute1.concat(landRoute1, oceanRoute2, landRoute2, landRoute3);
map.fitBounds(L.polyline(allPoints).getBounds());







var seaIcon = L.divIcon({
  className: 'custom-sea-icon',
  html: '🚢',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});




var travelerIcon = L.divIcon({
  className: 'custom-traveler-icon',
  html: '🚂',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});


var allPoints = oceanRoute1.concat(landRoute1, oceanRoute2, landRoute2, landRoute3);
var segmentTypes = [
  ...Array(oceanRoute1.length).fill('sea'),
  ...Array(landRoute1.length).fill('land'),
  ...Array(oceanRoute2.length).fill('sea'),
  ...Array(landRoute2.length).fill('land'),
  ...Array(landRoute3.length).fill('land')
];

var movingMarker = L.marker(allPoints[0], { icon: travelerIcon }).addTo(map);
let currentIndex = 0;

function moveMarker() {
  currentIndex++;
  if (currentIndex < allPoints.length) {
    let iconType = segmentTypes[currentIndex];
    let icon = iconType === 'sea' ? seaIcon : travelerIcon;
    movingMarker.setLatLng(allPoints[currentIndex]);
    movingMarker.setIcon(icon);
    setTimeout(moveMarker, 600); // adjust speed
  } else {
    currentIndex = 0; // reset to beginning
    setTimeout(moveMarker, 600); // restart loop
  }
}

moveMarker();



/*
L.polyline(oceanRoute1, { color: 'blue', weight: 2, opacity: 0.8, dashArray: '10,5' }).addTo(map);
L.polyline(landRoute1, { color: 'green', weight: 2, opacity: 0.8 }).addTo(map);
L.polyline(oceanRoute2, { color: 'blue', weight: 2, opacity: 0.8, dashArray: '10,5' }).addTo(map);
L.polyline(landRoute2, { color: 'green', weight: 2, opacity: 0.8 }).addTo(map);
L.polyline(landRoute3, { color: 'orange', weight: 2, opacity: 0.8 }).addTo(map);
*/



  // Add markers with popups
  L.marker([57.7, 11.9]).addTo(map)
    .bindPopup('<b>Göteborg</b><br>Departure: Gothenburg, Sweden');

  L.marker([53.7, -0.3]).addTo(map)
    .bindPopup('<b>Hull</b><br>Arrival: Hull, England');
    
    
  L.marker([53.4, -3.0]).addTo(map)
    .bindPopup('<b>Liverpool</b><br>Arrival: Liverpool, England');

 L.marker([40.6985, -74.0405]).addTo(map)
    .bindPopup('<b>New York</b><br>Arrival: New York, USA');


 L.marker([41.1169, -78.7644]).addTo(map)
    .bindPopup('<b>DuBois</b><br>Arrival: Dubois, Pennsylvania');

 L.marker([41.88, -87.65]).addTo(map)
    .bindPopup( '<b>Chicago</b><br>Arrival: Chicago, Illinois');    

};

