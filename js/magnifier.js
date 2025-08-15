let attachedImages = new WeakMap();
let magnifierGlasses = new Map();
let resizeObserver = null;

export const defaultMagConfig = {
  checkboxID: 'mag-checkbox',
  zoomInputID: 'mag',
  defaultZoom: 2
};

export function setupMagnifier({
  checkboxID = 'mag-checkbox',
  zoomInputID = 'mag',
  defaultZoom = 2
} = {}) {
  document.querySelectorAll('.img-magnifier-glass').forEach(glass => glass.remove());
  magnifierGlasses.clear();

  const checkbox = document.getElementById(checkboxID);
  const zoomInput = document.getElementById(zoomInputID);
  const images = document.querySelectorAll('.magImage');

  let magnifierActive = checkbox?.checked;
  let currentZoom = parseFloat(zoomInput?.value) || defaultZoom;

  if (!magnifierActive) return;

  images.forEach(img => {
    const oldHandlers = attachedImages.get(img);
    if (oldHandlers) {
      img.removeEventListener('mousemove', oldHandlers.mouse);
      img.removeEventListener('touchmove', oldHandlers.touch);
    }

    const glass = document.createElement('div');
    glass.className = 'img-magnifier-glass';
    glass.style.pointerEvents = 'none';
    glass.style.opacity = '0';
    img.parentElement.insertBefore(glass, img);

    const updateBackgroundSize = () => {
      const rect = img.getBoundingClientRect();
      glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;
    };

    glass.style.backgroundImage = `url('${img.src}')`;
    glass.style.backgroundRepeat = 'no-repeat';
    updateBackgroundSize();

    magnifierGlasses.set(img, glass);

    const moveMagnifier = (e) => {
      e.preventDefault();

      const rect = img.getBoundingClientRect();
      const containerRect = img.parentElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        glass.style.opacity = '0';
        img.classList.remove('hide-cursor');
        img.parentElement.classList.remove('hide-cursor');
        return;
      }

      glass.style.opacity = '1';
      img.classList.add('hide-cursor');
      img.parentElement.classList.add('hide-cursor');

      const w = glass.offsetWidth / 2;
      const h = glass.offsetHeight / 2;

      const clampedX = Math.max(w / currentZoom, Math.min(x, rect.width - w / currentZoom));
      const clampedY = Math.max(h / currentZoom, Math.min(y, rect.height - h / currentZoom));

      // Position glass relative to its container
      glass.style.left = `${e.clientX - containerRect.left - w}px`;
      glass.style.top = `${e.clientY - containerRect.top - h}px`;

      const bgX = (clampedX / rect.width) * (rect.width * currentZoom) - w;
      const bgY = (clampedY / rect.height) * (rect.height * currentZoom) - h;

      glass.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    img.addEventListener('mousemove', moveMagnifier);
    img.addEventListener('touchmove', moveMagnifier, { passive: false });
    
    img.addEventListener('mouseleave', () => {
      const glass = magnifierGlasses.get(img);
      if (glass) {
        glass.style.opacity = '0';
      }
      img.classList.remove('hide-cursor');
      img.parentElement.classList.remove('hide-cursor');
    });

    attachedImages.set(img, {
      mouse: moveMagnifier,
      touch: moveMagnifier
    });

    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        magnifierGlasses.forEach((glass, img) => {
          const rect = img.getBoundingClientRect();
          glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;
        });
      });
    }
    resizeObserver.observe(img);
  });

  zoomInput?.addEventListener('input', (e) => {
    currentZoom = parseFloat(e.target.value) || defaultZoom;

    magnifierGlasses.forEach((glass, img) => {
      const rect = img.getBoundingClientRect();
      glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;
    });
  });
}

export function removeMagnifiers() {
  document.querySelectorAll('.img-magnifier-glass').forEach(glass => glass.remove());
  magnifierGlasses.clear();

  document.querySelectorAll('.magImage').forEach(img => {
    img.classList.remove('hide-cursor');
    img.parentElement.classList.remove('hide-cursor');
  });

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

export function toggleMagnifier(enabled, config = defaultMagConfig) {
  if (enabled) {
    setupMagnifier(config);
  } else {
    removeMagnifiers();
  }
}