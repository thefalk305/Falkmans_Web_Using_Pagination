# loadCollageViewer.js — Code vs. Plain English

| **Code** | **Plain English Explanation** |
|----------|--------------------------------|
| `import { initPhotoCollage } from './photoCollage.js';` | Bring in the function that sets up clickable highlight boxes. |
| `import { initMagnifierControls } from './magnifier.js';` | Bring in the function that sets up the magnifier toggle and zoom controls. |
| `export function loadCollageViewer(docId, jsonFile) {` | Define a function to load and display a specific collage from a JSON file. |
| `const docContainer = document.getElementsByClassName('doc-container')[0];` | Find the container element where highlight boxes will be placed. |
| `const img = document.getElementById('doc-image');` | Find the main collage image element. |
| `const notesEl = document.getElementById('doc-notes');` | Find the element where notes/captions will be shown. |
| `if (!docId || !docContainer || !img || !notesEl) return;` | Stop if required info or elements are missing. |
| `fetch(jsonFile)` | Request the JSON file from the server. |
| `.then(res => res.json())` | Convert the server’s response into a JavaScript object/array. |
| `let foundDoc = null;` | Prepare a variable to store the matching document. |
| `for (const person of data) { ... }` | Loop through each person in the JSON data. |
| `foundDoc = person.links.find(doc => doc.id === docId);` | Look for a document with the matching ID. |
| `if (foundDoc) break;` | Stop searching once found. |
| `if (!foundDoc) { ... return; }` | If no match, show “Document not found” and stop. |
| `const { url, notes, areas } = foundDoc;` | Extract the image URL, notes, and highlight areas from the found document. |
| `img.src = url;` | Set the image’s source so it loads. |
| `notesEl.textContent = notes;` | Display the notes text. |
| `areas.forEach(areaData => { ... });` | Loop through each highlight area and create a clickable box. |
| `const area = document.createElement('div');` | Make a new `<div>` for the highlight box. |
| `area.id = areaData.id;` | Give the box an ID. |
| `area.className = "highlight-box area";` | Apply CSS classes for styling. |
| `area.style.left = areaData.x + "%";` *(and similar lines)* | Position and size the box using percentages from the JSON. |
| `area.dataset.caption = areaData.caption;` | Store the caption text in a data attribute. |
| `area.dataset.zoom = areaData.zoom;` | Store the zoom level in a data attribute. |
| `docContainer.appendChild(area);` | Add the box to the container so it appears over the image. |
| `img.onload = () => { ... };` | Wait until the image is fully loaded before enabling interactivity. |
| `initPhotoCollage();` | Set up click-to-zoom highlight boxes. |
| `initMagnifierControls();` | Set up the magnifier toggle and zoom controls. |
| `.catch(err => { ... });` | If something goes wrong, show an error message and log details. |