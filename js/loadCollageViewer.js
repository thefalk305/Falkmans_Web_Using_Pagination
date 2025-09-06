import { initPhotoCollage } from './photoCollage.js';
import { initMagnifierControls } from './magnifier.js';

export function loadCollageViewer(docId, jsonFile) {
  const docContainer = document.getElementsByClassName('doc-container')[0];
  const img = document.getElementById('doc-image');
  const notesEl = document.getElementById('doc-notes');

  if (!docId || !docContainer || !img || !notesEl) return;

  fetch(jsonFile)
    .then(res => res.json())
    .then(data => {
      let foundDoc = null;

      for (const person of data) {
        foundDoc = person.links.find(doc => doc.id === docId);
        if (foundDoc) break;
      }

      if (!foundDoc) {
        notesEl.textContent = 'Document not found.';
        return;
      }

      const { url, areas, notes } = foundDoc;
      img.src = url;
      notesEl.textContent = notes;

      areas.forEach(areaData => {
        const area = document.createElement('div');
        area.id = areaData.id;
        area.className = "highlight-box area";
        area.style.left = areaData.x + "%";
        area.style.top = areaData.y + "%";
        area.style.width = areaData.width + "%";
        area.style.height = areaData.height + "%";
        area.dataset.caption = areaData.caption;
        area.dataset.zoom = areaData.zoom;
        docContainer.appendChild(area);
      });

      img.onload = () => {
        initMagnifierControls();
        initPhotoCollage();
      };
    })
    .catch(err => {
      notesEl.textContent = 'Error loading document data.';
      console.error('Failed to load collage data:', err);
    });
}