# photoCollage.js — Code vs. Plain English

| **Code** | **Plain English Explanation** |
|----------|--------------------------------|
| `const highlightBoxHandlers = new WeakMap();` | Create a special storage (WeakMap) to remember which highlight boxes already have click listeners, so we don’t add them twice. |
| `export function initPhotoCollage(defaultZoom = 60) {` | Define a function called `initPhotoCollage` that sets up the click‑to‑zoom feature. If no zoom is given, use 60% as the default. |
| `const img = document.getElementById('doc-image');` | Find the main collage image in the page. |
| `if (!img) return;` | If the image isn’t found, stop running the function. |
| `const imgSrc = img.src;` | Save the image’s URL so we can use it later for the zoom background. |
| `const ENLARGED_WIDTH_PERCENT = defaultZoom;` | Store the default zoom size in a variable. |
| `const boxes = document.querySelectorAll('.highlight-box.area');` | Find all clickable highlight boxes on the image. |
| `if (highlightBoxHandlers.has(box)) return;` | Skip this box if we’ve already set it up before. |
| `box.dataset.originalWidth = box.style.width;` *(and similar lines)* | Save the box’s original size and position into `data-*` attributes so we can restore them later. |
| `const clickHandler = (e) => { ... }` | Define what happens when someone clicks a highlight box. |
| `e.stopPropagation();` | Stop the click from affecting other elements on the page. |
| `const isAlreadyEnlarged = box.classList.contains('enlarged');` | Check if the box is already zoomed in. |
| **If enlarged:** reset size, position, background, remove caption, re‑enable all boxes. | This is the “shrink back to normal” path. |
| **Else:** reset other boxes, disable pointer events on them, then enlarge the clicked box. | This is the “zoom in” path. |
| `const aspectRatio = originalHeightPercent / originalWidthPercent;` | Keep the same shape when resizing by calculating the aspect ratio. |
| `box.style.width = ...; box.style.height = ...;` | Set the new enlarged size. |
| `box.style.left = '50%'; box.style.top = '50%'; box.style.transform = 'translate(-50%, -50%)';` | Center the enlarged box on the image. |
| **Pixel math section** | Convert percentages to pixels, figure out how much to zoom, and adjust the background image so the zoomed area is centered. |
| `const caption = document.createElement('div');` | Make a new caption element. |
| `caption.className = 'zoom-caption';` | Give it a CSS class for styling. |
| `caption.textContent = box.dataset.caption || 'zoomed image';` | Set the caption text from the data attribute, or use a default. |
| `box.appendChild(caption);` | Add the caption inside the box. |
| `box.classList.add('enlarged');` | Mark the box as enlarged so we can detect it later. |
| `box.addEventListener('click', clickHandler);` | Attach the click behavior to the box. |
| `highlightBoxHandlers.set(box, clickHandler);` | Remember this box’s click handler in the WeakMap. |
| `console.log('Highlight box listeners attached');` | Log a message for debugging. |
| `export function removePhotoCollageListeners() { ... }` | Define another function to remove all click listeners from highlight boxes. |
| `box.removeEventListener('click', handler);` | Detach the click behavior from the box. |
| `highlightBoxHandlers.delete(box);` | Remove the box from our WeakMap so it can be re‑initialized later. |
| `console.log('Highlight box listeners removed');` | Log a message for debugging. |
