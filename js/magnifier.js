// =======================
// Magnifier Module
// =======================

// Tracks which images have magnifier event listeners attached
let attachedImages = new WeakMap();

// Maps each image to its corresponding magnifier glass element
let magnifierGlasses = new Map();

// ResizeObserver instance to track image resizing
let resizeObserver = null;

// Default configuration for magnifier controls
export const defaultMagConfig = {
  checkboxID: 'mag-checkbox',     // ID of checkbox that toggles magnifier
  zoomInputID: 'mag',             // ID of input controlling zoom level
  defaultZoom: 2                  // Default zoom factor
};

/**
 * Initializes magnifier glasses for all .magImage 
 * elements when enabled is toggled ON.
 * Dynamically scales glass size based on zoom level and CSS-defined defaults.
 */
export function setupMagnifier({
  checkboxID = 'mag-checkbox',
  zoomInputID = 'mag',
  defaultZoom = 2
} = {}) {
  // Remove any existing magnifier glasses from previous sessions
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

  // Create (then remove) a temporary glass element to read default size from CSS
  const tempGlass = document.createElement('div');
  tempGlass.className = 'img-magnifier-glass';
  tempGlass.style.position = 'absolute';
  tempGlass.style.visibility = 'hidden';
  document.body.appendChild(tempGlass);

  const computedStyle = window.getComputedStyle(tempGlass);
  const baseGlassWidth = parseFloat(computedStyle.width);
  const baseGlassHeight = parseFloat(computedStyle.height);

  document.body.removeChild(tempGlass);

  // Loop through each image to attach magnifier logic
  // there may be several images ona page
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

    // Scale glass size based on zoom level
    const scale = getGlassScale(currentZoom, defaultZoom);
    const scaledWidth = baseGlassWidth * scale;
    const scaledHeight = baseGlassHeight * scale;
    glass.style.width = `${scaledWidth}px`;
    glass.style.height = `${scaledHeight}px`;

    // Insert glass into DOM before the image
    img.parentElement.insertBefore(glass, img);

    // Set background image and size for zoom effect
    const updateBackgroundSize = () => {
      const rect = img.getBoundingClientRect();
      glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;
    };

    glass.style.backgroundImage = `url('${img.src}')`;
    // glass.style.backgroundRepeat = 'no-repeat';
    updateBackgroundSize();

    // Store reference to glass
    magnifierGlasses.set(img, glass);

    /**
     * Handles cursor movement to position magnifier and update zoomed view
     */
    const moveMagnifier = (e) => {
      e.preventDefault();

      const rect = img.getBoundingClientRect();
      const containerRect = img.parentElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Hide glass and show cursor if cursor is outside image bounds
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

    // Observe image resizing to update background size
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

  /**
   * Updates zoom level and resizes magnifier glass when zoom input changes
   */
  zoomInput?.addEventListener('input', (e) => {
    currentZoom = parseFloat(e.target.value) || defaultZoom;

    magnifierGlasses.forEach((glass, img) => {
      const rect = img.getBoundingClientRect();
      glass.style.backgroundSize = `${rect.width * currentZoom}px ${rect.height * currentZoom}px`;

      const scale = getGlassScale(currentZoom, defaultZoom);
      const scaledWidth = baseGlassWidth * scale;
      const scaledHeight = baseGlassHeight * scale;    
      glass.style.width = `${scaledWidth}px`;
      glass.style.height = `${scaledHeight}px`;

    });
  });
}

/**
 * Removes all magnifier glasses and resets styles 
 * and event listeners when enable is toggled OFF
 */
export function removeMagnifiers() {
  document.querySelectorAll('.img-magnifier-glass').forEach(glass => glass.remove());
  magnifierGlasses.clear();

  document.querySelectorAll('.magImage').forEach(img => {
    img.classList.remove('hide-cursor');
    img.parentElement.classList.remove('hide-cursor');

    const handlers = attachedImages.get(img);
    if (handlers) {
      img.removeEventListener('mousemove', handlers.mouse);
      img.removeEventListener('touchmove', handlers.touch);
    }

    attachedImages.delete(img);
  });

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

/**
 * Toggles magnifier ON or OFF based on a boolean flag
 * @param {boolean} enabled - Whether magnifier should be active
 * @param {object} config - Optional configuration overrides
 */
export function toggleMagnifier(enabled, config = defaultMagConfig) {
  if (enabled) {
    setupMagnifier(config);
  } else {
    removeMagnifiers();
  }
}

/**
 * Initializes magnifier controls (checkbox + zoom input)
 * Automatically sets up or removes magnifier based on checkbox state
 */
import { initPhotoCollage, removePhotoCollageListeners } from './photoCollage.js';

export function initMagnifierControls(config = defaultMagConfig) {
  const checkbox = document.getElementById(config.checkboxID);
  const zoomInput = document.getElementById(config.zoomInputID);

  if (!checkbox || !zoomInput) return;

  const updateMagnifier = () => {
    const enabled = checkbox.checked;
    zoomInput.style.display = enabled ? 'block' : 'none';
    toggleMagnifier(enabled, config);

    if (enabled) {
      removePhotoCollageListeners();
      document.querySelectorAll('.highlight-box.area').forEach(box => {
        box.style.pointerEvents = 'none';
      });
    } else {
      document.querySelectorAll('.highlight-box.area').forEach(box => {
        box.style.pointerEvents = 'auto';
      });

      initPhotoCollage(); // ✅ Let it handle deduplication internally
    }  };

    checkbox.addEventListener('change', updateMagnifier);
    zoomInput.addEventListener('input', updateMagnifier);

}

// scale glass size with zoom so we don't loose much area when zoomed.
  function getGlassScale(zoom) {
    return Math.max(1.0, 0.375 * zoom + 0.25);
  }
