// =======================
// Magnifier Module
// =======================

// Tracks which images have event listeners attached
let attachedImages = new WeakMap();

// Maps each image to its corresponding magnifier glass element
let magnifierGlasses = new Map();

// Observes image resizing to update magnifier scaling
let resizeObserver = null;

// Default configuration for magnifier controls
export const defaultMagConfig = {
  checkboxID: 'mag-checkbox',     // ID of the checkbox that toggles magnifier
  zoomInputID: 'mag',             // ID of the input controlling zoom level
  defaultZoom: 2                  // Fallback zoom level
};

// Initializes magnifier glasses for all .magImage elements
export function setupMagnifier({
  checkboxID = 'mag-checkbox',
  zoomInputID = 'mag',
  defaultZoom = 2
} = {}) {
  // Remove any existing magnifier glasses
  document.querySelectorAll('.img-magnifier-glass').forEach(glass => glass.remove());
  magnifierGlasses.clear();

  // Get control elements
  const checkbox = document.getElementById(checkboxID);
  const zoomInput = document.getElementById(zoomInputID);
  const images = document.querySelectorAll('.magImage');

  // Determine if magnifier is enabled and get current zoom level
  let magnifierActive = checkbox?.checked;
  let currentZoom = parseFloat(zoomInput?.value) || defaultZoom;

  // Exit early if magnifier is not enabled
  if (!magnifierActive) return;

  // Loop through each image to attach magnifier logic
  images.forEach(img => {
    // Remove old event listeners if they exist
    const oldHandlers = attachedImages.get(img);
    if (oldHandlers) {
      img.removeEventListener('mousemove', oldHandlers.mouse);
      img.removeEventListener('touchmove', oldHandlers.touch);
    }

    // Create magnifier glass element
    const glass = document.createElement('div');
    glass.className = 'img-magnifier-glass';
    glass.style.pointerEvents = 'none';
    glass.style.opacity = '0';
    img.parentElement.insertBefore(glass, img);

    // Function to update background size based on zoom
    const updateBackgroundSize = () => {
      const rect = img.getBoundingClientRect();
      glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;
    };

    // Set background image and initial size
    glass.style.backgroundImage = `url('${img.src}')`;
    glass.style.backgroundRepeat = 'no-repeat';
    updateBackgroundSize();

    // Store reference to glass
    magnifierGlasses.set(img, glass);

    // Cursor tracking logic
    const moveMagnifier = (e) => {
      e.preventDefault();

      const rect = img.getBoundingClientRect();
      const containerRect = img.parentElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Hide glass if cursor is outside image bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        glass.style.opacity = '0';
        img.classList.remove('hide-cursor');
        img.parentElement.classList.remove('hide-cursor');
        return;
      }

      // Show glass and hide native cursor
      glass.style.opacity = '1';
      img.classList.add('hide-cursor');
      img.parentElement.classList.add('hide-cursor');

      // Clamp position to avoid edge overflow
      const w = glass.offsetWidth / 2;
      const h = glass.offsetHeight / 2;
      const clampedX = Math.max(w / currentZoom, Math.min(x, rect.width - w / currentZoom));
      const clampedY = Math.max(h / currentZoom, Math.min(y, rect.height - h / currentZoom));

      // Position glass relative to container
      glass.style.left = `${e.clientX - containerRect.left - w}px`;
      glass.style.top = `${e.clientY - containerRect.top - h}px`;

      // Adjust background position for zoom effect
      const bgX = (clampedX / rect.width) * (rect.width * currentZoom) - w;
      const bgY = (clampedY / rect.height) * (rect.height * currentZoom) - h;
      glass.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    // Attach event listeners for mouse and touch movement
    img.addEventListener('mousemove', moveMagnifier);
    img.addEventListener('touchmove', moveMagnifier, { passive: false });

    // Hide magnifier when cursor leaves image
    img.addEventListener('mouseleave', () => {
      const glass = magnifierGlasses.get(img);
      if (glass) {
        glass.style.opacity = '0';
      }
      img.classList.remove('hide-cursor');
      img.parentElement.classList.remove('hide-cursor');
    });

    // Store event handlers for cleanup
    attachedImages.set(img, {
      mouse: moveMagnifier,
      touch: moveMagnifier
    });

    // Setup resize observer to update magnifier size on image resize
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

  // Update zoom level dynamically when input changes
  zoomInput?.addEventListener('input', (e) => {
    currentZoom = parseFloat(e.target.value) || defaultZoom;

    magnifierGlasses.forEach((glass, img) => {
      const rect = img.getBoundingClientRect();
      glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;
    });
  });
}

// Removes all magnifier glasses and resets styles
export function removeMagnifiers() {
  // Remove all magnifier glass elements
  document.querySelectorAll('.img-magnifier-glass').forEach(glass => glass.remove());
  magnifierGlasses.clear();

  // Reset styles and remove event listeners from each image
  document.querySelectorAll('.magImage').forEach(img => {
    img.classList.remove('hide-cursor');
    img.parentElement.classList.remove('hide-cursor');

    const handlers = attachedImages.get(img);
    if (handlers) {
      img.removeEventListener('mousemove', handlers.mouse);
      img.removeEventListener('touchmove', handlers.touch);
    }

    attachedImages.delete(img); // Clean up the WeakMap reference
  });

  // Disconnect the resize observer
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

// Toggles magnifier on or off based on a boolean flag
export function toggleMagnifier(enabled, config = defaultMagConfig) {
  if (enabled) {
    setupMagnifier(config);
  } else {
    removeMagnifiers();
  }
}

// Initializes magnifier controls (checkbox + zoom input)
export function initMagnifierControls(config = defaultMagConfig) {
  const checkbox = document.getElementById(config.checkboxID);
  const zoomInput = document.getElementById(config.zoomInputID);

  if (!checkbox || !zoomInput) return;

  const updateMagnifier = () => {
    zoomInput.style.display = checkbox.checked ? 'block' : 'none';
    toggleMagnifier(checkbox.checked, config);
  };

  checkbox.addEventListener('change', updateMagnifier);
  zoomInput.addEventListener('input', updateMagnifier);

  updateMagnifier(); // Set initial state
}