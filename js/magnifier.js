// =======================
// magnifier.js 
// Magnifier Module
// magnifier.js controls the magnifier glass that is used 
// to enlarge an area of an image to show greater detail.
// =======================
  const baseGlassWidth = 250;
  const baseGlassHeight = 150;

// Tracks which images have magnifier event listeners attached
let attachedImages = new WeakMap();

// Maps each image to its corresponding magnifier glass element
let magnifierGlasses = new Map();

// ResizeObserver instance to track image resizing
let resizeObserver = null;

// Default configuration for magnifier controls
export const defaultMagConfig = {
  checkboxID: 'mag-checkbox',     // ID of checkbox that toggles magnifier
  strengthInputID: 'mag-strength',// ID of input controlling mag-strength level
  defaultMagStrength: 2                  // Default mag-strength factor
};

/**
 * Initializes magnifier glasses for all .magImage 
 * elements when enabled is toggled ON.
 * Dynamically scales glass size based on mag-strength level and CSS-defined defaults.
 */
export function setupMagnifier({
  checkboxID = 'mag-checkbox',
  strengthInputID = 'mag-strength',
  defaultMagStrength = 2
} = {}) {
  // Remove any existing magnifier glasses from previous sessions
  document.querySelectorAll('.img-magnifier-glass').forEach(glass => glass.remove());
  magnifierGlasses.clear();

  // Get control elements
  const checkbox = document.getElementById(checkboxID);
  const strengthInput = document.getElementById(strengthInputID);
  const images = document.querySelectorAll('.magGlass-container img');
  // Determine if magnifier is enabled and get current mag-strength level
  let magnifierActive = checkbox?.checked;
  let currentMagStrength = parseFloat(strengthInput?.value) || defaultMagStrength;

  // Exit early if magnifier is not enabled
  if (!magnifierActive) return;

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
    glass.className = 'img-magnifier-glass hide-cursor';
    glass.style.pointerEvents = 'none';
    glass.style.opacity = '0';
    glass.style.cursor = 'none';

    // Scale glass size based on mag-strength level
    const scale = getGlassScale(currentMagStrength, defaultMagStrength);
    glass.style.width = `${baseGlassWidth * scale}px`;
    glass.style.height = `${baseGlassHeight * scale}px`;

    // Insert glass into DOM before the image
    img.parentElement.insertBefore(glass, img);

    // Set background image and size for zoom effect
    const updateBackgroundSize = () => {
      updateGlassBackground(glass, img, currentMagStrength);
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
      if (x < -1 || y < -1 || x > rect.width || y > rect.height) {
        glass.style.opacity = '0';
        restoreCursor(img)
        return;
      }

      // Show glass and hide native cursor
      glass.style.opacity = '1';
      img.classList.add('hide-cursor');
      img.parentElement.classList.add('hide-cursor');

      // Clamp position to avoid edge overflow
      const w = glass.offsetWidth / 2;
      const h = glass.offsetHeight / 2;
      const clampedX = Math.max(w / currentMagStrength, Math.min(x, rect.width - w / currentMagStrength));
      const clampedY = Math.max(h / currentMagStrength, Math.min(y, rect.height - h / currentMagStrength));

      // Position glass relative to container
      glass.style.left = `${e.clientX - containerRect.left - w}px`;
      glass.style.top = `${e.clientY - containerRect.top - h}px`;

      // Adjust background position for zoom effect
      const bgX = (clampedX / rect.width) * (rect.width * currentMagStrength) - w;
      const bgY = (clampedY / rect.height) * (rect.height * currentMagStrength) - h;
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
      restoreCursor(img)
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
        updateGlassBackground(glass, img, currentMagStrength);
        });
      });
    }
    resizeObserver.observe(img);
  });

  /**
   * Updates mag-strength level and resizes magnifier glass when mag-strength input changes
   */
  strengthInput?.addEventListener('input', (e) => {
    currentMagStrength = parseFloat(e.target.value) || defaultMagStrength;

    magnifierGlasses.forEach((glass, img) => {
      updateGlassBackground(glass, img, currentMagStrength);
      const scale = getGlassScale(currentMagStrength, defaultMagStrength);
      glass.style.width = `${baseGlassWidth * scale}px`;
      glass.style.height = `${baseGlassHeight * scale}px`;
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

  document.querySelectorAll('.magGlass-container img').forEach(img => {
    restoreCursor(img)
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

// un-hide the cursor if outside img or mag is OFF
function restoreCursor(img) {
  img.classList.remove('hide-cursor');
  img.parentElement.classList.remove('hide-cursor');
}

// Updates the background size of the magnifier glass based on image size and strength
function updateGlassBackground(glass, img, strength) {
  const rect = img.getBoundingClientRect();
  glass.style.backgroundSize = `${rect.width * strength}px ${rect.height * strength}px`;
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
 * Initializes magnifier controls (checkbox + mag-strength input)
 * Automatically sets up or removes magnifier based on checkbox state
 */
import { zoomArea, removeZoomAreaListeners } from './zoomArea.js';

export function initMagnifierControls(config = defaultMagConfig) {
  const checkbox = document.getElementById(config.checkboxID);
  const strengthInput = document.getElementById(config.strengthInputID);

  if (!checkbox || !strengthInput) return;

  const updateMagnifier = () => {
    const enabled = checkbox.checked;
    strengthInput.style.display = enabled ? 'block' : 'none';
    toggleMagnifier(enabled, config);

    document.querySelectorAll('.highlight-box.area').forEach(box => {
      box.style.pointerEvents = enabled ? 'none' : 'auto';
    });

    // if (enabled) {
    //   removeZoomAreaListeners();
    //   // Magnifier is active — zoom boxes will ignore clicks via internal guard
    // } else {
    //   zoomArea(); // Reinitialize zoom logic
    // }  
  };
    checkbox.addEventListener('change', updateMagnifier);
    strengthInput.addEventListener('input', updateMagnifier);
}

// scale glass size with mag-strength so we don't loose much area when zoomed.
  function getGlassScale(magStrength) {
    return Math.max(1.0, 0.375 * magStrength + 0.25);
  }
