// photoCollage.js

// A WeakMap is like a special object for storing key/value pairs,
// but the keys must be objects. Here, we use it to remember which
// highlight boxes already have click listeners attached.
const highlightBoxHandlers = new WeakMap();

// This function sets up the click-to-zoom behavior for highlight boxes.
export function initPhotoCollage(defaultZoom = 60) {
  // Get the main collage image from the page.
  const img = document.getElementById('doc-image');
  if (!img) return; // If there's no image, stop.

  const imgSrc = img.src; // Save the image's URL for later use.
  const ENLARGED_WIDTH_PERCENT = defaultZoom; // Default zoom size.

  // Get all the clickable highlight boxes.
  const boxes = document.querySelectorAll('.highlight-box.area');

  boxes.forEach(box => {
    // Skip this box if we've already attached a listener to it.
    if (highlightBoxHandlers.has(box)) return;

    // Store the box's original size and position in data-* attributes.
    box.dataset.originalWidth = box.style.width;
    box.dataset.originalHeight = box.style.height;
    box.dataset.originalLeft = box.style.left;
    box.dataset.originalTop = box.style.top;
    box.dataset.originalTransform = box.style.transform || '';

    // Define what happens when the box is clicked.
    const clickHandler = (e) => {
      e.stopPropagation(); // Prevent the click from affecting other elements.

      const isAlreadyEnlarged = box.classList.contains('enlarged');

      if (isAlreadyEnlarged) {
        // If it's already enlarged, reset it to its original state.
        box.classList.remove('enlarged');
        box.style.width = box.dataset.originalWidth;
        box.style.height = box.dataset.originalHeight;
        box.style.left = box.dataset.originalLeft;
        box.style.top = box.dataset.originalTop;
        box.style.transform = box.dataset.originalTransform;
        box.style.backgroundImage = '';
        box.style.backgroundSize = '';
        box.style.backgroundPosition = '';
        document.querySelectorAll('.zoom-caption').forEach(caption => caption.remove());
        boxes.forEach(el => el.style.pointerEvents = 'auto');
        return;
      }

      // Reset any other enlarged boxes.
      document.querySelectorAll('.highlight-box.enlarged').forEach(el => {
        if (el !== box) {
          el.classList.remove('enlarged');
          el.style.width = el.dataset.originalWidth;
          el.style.height = el.dataset.originalHeight;
          el.style.left = el.dataset.originalLeft;
          el.style.top = el.dataset.originalTop;
          el.style.transform = el.dataset.originalTransform;
          el.style.backgroundImage = '';
          el.style.backgroundSize = '';
          el.style.backgroundPosition = '';
        }
      });

      // Enable all boxes, then disable all except the one clicked.
      boxes.forEach(el => el.style.pointerEvents = 'auto');
      boxes.forEach(el => {
        if (el !== box) el.style.pointerEvents = 'none';
      });

      // Read original (box) size/position from data attributes.
      const originalWidthPercent = parseFloat(box.dataset.originalWidth);
      const originalHeightPercent = parseFloat(box.dataset.originalHeight);
      const originalLeftPercent = parseFloat(box.dataset.originalLeft);
      const originalTopPercent = parseFloat(box.dataset.originalTop);
      const zoom = parseFloat(box.dataset.zoom) || ENLARGED_WIDTH_PERCENT;

      // Calculate new size while keeping the same aspect ratio.
      const aspectRatio = originalHeightPercent / originalWidthPercent;
      const enlargedWidthPercent = Math.max(ENLARGED_WIDTH_PERCENT, zoom);
      const enlargedHeightPercent = enlargedWidthPercent * aspectRatio;

      // Center the enlarged box.
      box.style.width = `${enlargedWidthPercent}%`;
      box.style.height = `${enlargedHeightPercent}%`;
      box.style.left = '50%';
      box.style.top = '50%';
      // box.style.transform = 'translate(-50%, -50%)';

      // Get the image's pixel dimensions.
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Convert original box position/size from % to pixels.
      const boxLeftPx = imgWidth * (originalLeftPercent / 100);
      const boxTopPx = imgHeight * (originalTopPercent / 100);
      const boxWidthPx = imgWidth * (originalWidthPercent / 100);
      const boxHeightPx = imgHeight * (originalHeightPercent / 100);

      // Calculate enlarged box size in pixels.
      const enlargedBoxWidthPx = imgWidth * (enlargedWidthPercent / 100);
      const enlargedBoxHeightPx = imgHeight * (enlargedHeightPercent / 100);

      // How much bigger is the enlarged box compared to the original?
      const zoomFactor = enlargedBoxWidthPx / boxWidthPx;

      // Set the background image and size for the zoom effect.
      box.style.backgroundImage = `url('${imgSrc}')`;
      box.style.backgroundSize = `${imgWidth * zoomFactor}px ${imgHeight * zoomFactor}px`;

      // Find the center of the original box in pixels.
      const centerX = boxLeftPx + boxWidthPx / 2;
      const centerY = boxTopPx + boxHeightPx / 2;

      // Adjust background position so the zoomed area is centered.
      const bgCenterX = centerX * zoomFactor;
      const bgCenterY = centerY * zoomFactor;
      const bgPosX = enlargedBoxWidthPx / 2 - bgCenterX;
      const bgPosY = enlargedBoxHeightPx / 2 - bgCenterY;
      box.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;

      // Add a caption inside the box.
      const caption = document.createElement('div');
      caption.className = 'zoom-caption';
      caption.textContent = box.dataset.caption || 'zoomed image';
      box.appendChild(caption);

      // Mark this box as enlarged.
      box.classList.add('enlarged');
    };

    // Attach the click handler to the box and remember it in the WeakMap.
    box.addEventListener('click', clickHandler);
    highlightBoxHandlers.set(box, clickHandler);
  });

  console.log('Highlight box listeners attached');
}

// Removes all click listeners from highlight boxes.
export function removePhotoCollageListeners() {
  document.querySelectorAll('.highlight-box.area').forEach(box => {
    const handler = highlightBoxHandlers.get(box);
    if (handler) {
      box.removeEventListener('click', handler);
      highlightBoxHandlers.delete(box);
    }
  });
  console.log('Highlight box listeners removed');
}