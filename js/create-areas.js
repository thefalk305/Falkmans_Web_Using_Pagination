// create-areas.js
// Documentation: createAreas will read jsonFile and 
// append a div for each area in the section.
// It also reads the url and notes from the jsonFile

// import in two helper functions from other files.
// These will be used later to set up the interactive features.
import { zoomArea } from './zoomArea.js';
import { initMagnifierControls } from './magnifier.js';

/**
 * Loads a collage viewer for a specific document ID from a JSON file.
 * @param {string} docId - The ID of the collage to display.
 * @param {string} jsonFile - The path to the JSON file containing collage data.
 */
export function createAreas(docId, jsonFile) {
  // Get references to important HTML elements on the page.
  const docContainer = document.getElementById('doc-container'); // Where highlight boxes will go
  const img = document.getElementById('doc-image'); // Where the image goes
  const notesEl = document.getElementById('doc-notes'); // Where the notes/caption area

  // If any required info or elements are missing, stop here.
  if (!docId || !docContainer || !img || !notesEl) return;

  // Fetch the JSON file containing all collage data.
  fetch(jsonFile)
    .then(res => res.json()) // Convert the response into a JavaScript object/array
    .then(data => {
      let foundDoc = null;

      // Loop through each person in the JSON data
      for (const person of data) {
        // Look for a document in their "links" array that matches the given docId
        foundDoc = person.links.find(doc => doc.id === docId);
        if (foundDoc) break; // Stop searching once found
      }

      // If no matching document was found, show an error message and stop.
      if (!foundDoc) {
        notesEl.textContent = 'Document not found.';
        return;
      }

      // Pull out the URL, notes, and highlight areas from the found document.
      const { url, notes, areas } = foundDoc;

      // Set the image source so it starts loading.
      img.src = url;

      // Display the notes text in the notes area.
      notesEl.textContent = notes;

      // For each highlight area in the JSON, create a clickable box.
      areas.forEach(areaData => {
        const area = document.createElement('div'); // Make a new <div>
        area.id = areaData.id; // Give it an ID from the JSON
        area.className = "highlight-box area"; // Apply CSS classes for styling
        // Position and size it using percentages from the JSON
        area.style.left = areaData.x + "%";
        area.style.top = areaData.y + "%";
        area.style.width = areaData.width + "%";
        area.style.height = areaData.height + "%";
        // Store extra info in data-* attributes for later use
        area.dataset.caption = areaData.caption;
        area.dataset.zoom = areaData.zoom;
        // Add the box to the container so it appears over the image
        docContainer.appendChild(area);
      });

      // Wait until the image is fully loaded before enabling interactivity.
      img.onload = () => {
        zoomArea();       // Make highlight boxes clickable/zoomable
        initMagnifierControls();  // Enable magnifier toggle and zoom controls
      };
    })
    .catch(err => {
      // If something goes wrong (e.g., file missing), show an error message.
      notesEl.textContent = 'Error loading document data.';
      console.error('Failed to load collage data:', err);
    });
}