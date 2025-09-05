export function initPhotoCollage(zoom) {
  console.log(zoom)
  const img = document.getElementById('doc-image');
  if (!img) return;

  const imgSrc = img.src;
  const ENLARGED_WIDTH_PERCENT = 60;

  // Cache original dimensions for each highlight box
  document.querySelectorAll('.highlight-box.area').forEach(box => {
    box.dataset.originalWidth = box.style.width;
    box.dataset.originalHeight = box.style.height;
    box.dataset.originalLeft = box.style.left;
    box.dataset.originalTop = box.style.top;
    box.dataset.originalTransform = box.style.transform || '';
  });

  // Add click event to each highlight box
  document.querySelectorAll('.highlight-box.area').forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();

      const isAlreadyEnlarged = box.classList.contains('enlarged');

      // Remove all captions
      document.querySelectorAll('.zoom-caption').forEach(caption => caption.remove());

      // Reset all boxes
      document.querySelectorAll('.highlight-box.enlarged').forEach(el => {
        el.classList.remove('enlarged');
        el.style.width = el.dataset.originalWidth;
        el.style.height = el.dataset.originalHeight;
        el.style.left = el.dataset.originalLeft;
        el.style.top = el.dataset.originalTop;
        el.style.transform = el.dataset.originalTransform;
        el.style.backgroundImage = '';
        el.style.backgroundSize = '';
        el.style.backgroundPosition = '';
      });
      // ✅ Re-enable all boxes
      document.querySelectorAll('.highlight-box.area').forEach(el => {
        el.style.pointerEvents = 'auto';
      });

      if (!isAlreadyEnlarged) {
        // ✅ Disable other boxes
        document.querySelectorAll('.highlight-box.area').forEach(el => {
          if (el !== box) el.style.pointerEvents = 'none';
        });

        const originalWidthPercent = parseFloat(box.dataset.originalWidth);
        const originalHeightPercent = parseFloat(box.dataset.originalHeight);
        const originalLeftPercent = parseFloat(box.dataset.originalLeft);
        const originalTopPercent = parseFloat(box.dataset.originalTop);
        const zoom = parseFloat(box.dataset.zoom);

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

        // Remove any existing captions
        document.querySelectorAll('.zoom-caption').forEach(caption => caption.remove());

        // Add caption below the enlarged box
        const caption = document.createElement('div');
        caption.className = 'zoom-caption';
        caption.textContent = box.dataset.caption || 'zoomed image';
        box.appendChild(caption);
        box.classList.add('enlarged');
      }
    });
  });
}