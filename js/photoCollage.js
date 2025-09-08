const highlightBoxHandlers = new WeakMap();

export function initPhotoCollage(defaultZoom = 60) {
  const img = document.getElementById('doc-image');
  if (!img) return;

  const imgSrc = img.src;
  const ENLARGED_WIDTH_PERCENT = defaultZoom;

  const boxes = document.querySelectorAll('.highlight-box.area');

  boxes.forEach(box => {
    // ✅ Skip if listener already attached
    if (highlightBoxHandlers.has(box)) return;

    // Cache original dimensions
    box.dataset.originalWidth = box.style.width;
    box.dataset.originalHeight = box.style.height;
    box.dataset.originalLeft = box.style.left;
    box.dataset.originalTop = box.style.top;
    box.dataset.originalTransform = box.style.transform || '';

    const clickHandler = (e) => {
      e.stopPropagation();

      const isAlreadyEnlarged = box.classList.contains('enlarged');

      if (isAlreadyEnlarged) {
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

      // Reset other boxes
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

      boxes.forEach(el => el.style.pointerEvents = 'auto');
      boxes.forEach(el => {
        if (el !== box) el.style.pointerEvents = 'none';
      });

      const originalWidthPercent = parseFloat(box.dataset.originalWidth);
      const originalHeightPercent = parseFloat(box.dataset.originalHeight);
      const originalLeftPercent = parseFloat(box.dataset.originalLeft);
      const originalTopPercent = parseFloat(box.dataset.originalTop);
      const zoom = parseFloat(box.dataset.zoom) || ENLARGED_WIDTH_PERCENT;

      const aspectRatio = originalHeightPercent / originalWidthPercent;
      const enlargedWidthPercent = Math.max(ENLARGED_WIDTH_PERCENT, zoom);
      const enlargedHeightPercent = enlargedWidthPercent * aspectRatio;

      box.style.width = `${enlargedWidthPercent}%`;
      box.style.height = `${enlargedHeightPercent}%`;
      box.style.left = '50%';
      box.style.top = '50%';
      box.style.transform = 'translate(-50%, -50%)';

      const imgWidth = img.width;
      const imgHeight = img.height;

      const boxLeftPx = imgWidth * (originalLeftPercent / 100);
      const boxTopPx = imgHeight * (originalTopPercent / 100);
      const boxWidthPx = imgWidth * (originalWidthPercent / 100);
      const boxHeightPx = imgHeight * (originalHeightPercent / 100);

      const enlargedBoxWidthPx = imgWidth * (enlargedWidthPercent / 100);
      const enlargedBoxHeightPx = imgHeight * (enlargedHeightPercent / 100);

      const zoomFactor = enlargedBoxWidthPx / boxWidthPx;

      box.style.backgroundImage = `url('${imgSrc}')`;
      box.style.backgroundSize = `${imgWidth * zoomFactor}px ${imgHeight * zoomFactor}px`;

      const centerX = boxLeftPx + boxWidthPx / 2;
      const centerY = boxTopPx + boxHeightPx / 2;

      const bgCenterX = centerX * zoomFactor;
      const bgCenterY = centerY * zoomFactor;

      const bgPosX = enlargedBoxWidthPx / 2 - bgCenterX;
      const bgPosY = enlargedBoxHeightPx / 2 - bgCenterY;
      box.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;

      const caption = document.createElement('div');
      caption.className = 'zoom-caption';
      caption.textContent = box.dataset.caption || 'zoomed image';
      box.appendChild(caption);

      box.classList.add('enlarged');
    };

    box.addEventListener('click', clickHandler);
    highlightBoxHandlers.set(box, clickHandler);
  });

  console.log('Highlight box listeners attached');
}


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