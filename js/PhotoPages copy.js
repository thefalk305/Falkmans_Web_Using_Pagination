// PhotoPages.js
// This script dynamically loads photo data, renders paginated info-cards,
// and manages modal interactions for the Falkman Family Photo Gallery.
//
// ===============================
// BEGINNER-FRIENDLY DOCUMENTATION
// ===============================
//
// This file is written for people who are just starting to learn JavaScript.
// It shows how to:
//   - Wait for the page to load before running code
//   - Fetch (load) data from a JSON file
//   - Create and update HTML elements using JavaScript
//   - Handle user events (like button clicks)
//   - Show and hide a modal (popup) window
//   - Implement pagination (splitting content into pages)
//
// ===============================
// DOM MANIPULATION EXPLAINED
// ===============================
//
// The DOM (Document Object Model) is a way for JavaScript to interact with the HTML on your page.
// You can use JavaScript to find elements, change their content, add new elements, or remove them.
// This script uses DOM manipulation to build the photo gallery, pagination, and modal popup.
//
// Some key DOM methods used here:
//   - document.getElementById("id")         // Finds an element by its id
//   - document.querySelector(".class")      // Finds the first element with a class
//   - document.createElement("div")         // Creates a new HTML element (not yet on the page)
//   - element.appendChild(child)            // Adds a new child element to an existing element
//   - element.innerHTML = "..."             // Sets the HTML content inside an element
//   - element.textContent = "..."           // Sets the text content inside an element
//   - element.classList.add("class")        // Adds a CSS class to an element
//   - element.classList.remove("class")     // Removes a CSS class from an element
//   - element.style.display = "none"        // Hides an element (removes it from view)
//   - element.style.display = "block"       // Shows an element
//   - element.addEventListener("click", fn) // Runs a function when the element is clicked
//
// Read the comments throughout the code to understand what each part does!

// Wait until the HTML page is fully loaded before running the code inside
import { setupMagnifier, defaultMagConfig } from './magnifier.js';

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Load photo data from a JSON file using fetch.
  //    The JSON file contains an array of photo objects (name, pic, bioText, etc).
  const response = await fetch("./data/PhotoPagesData.json");
  const enrichedPhotos = await response.json();

  // 2. Get references to important HTML elements by their IDs or classes.
  //    These are used to display the gallery, pagination, modal, etc.
  //    These variables now point to real elements in your HTML.
  const gallery = document.getElementById("photoGallery");      // Where the photo cards will go
  const topPagination = document.getElementById("topPagination"); // Top page navigation
  const bottomPagination = document.getElementById("pagination"); // Bottom page navigation
  const perPageInput = document.getElementById("imagesPerPage");  // Input for images per page

  // Modal (popup) elements
  const modal = document.getElementById("bioModal");            // The modal popup itself
  const modalBio = document.querySelector(".modal-bio");        // Where the full bio will go
  const modalName = document.getElementById("modalName");       // Name in the modal
  const modalBorn = document.getElementById("modalBorn");       // Birth info in the modal
  const modalImage = document.getElementById("modalBioImage");  // Image in the modal
  const exitBtn = document.querySelector(".modal-exit-btn");    // "Exit" button in the modal
  const closeIcon = document.querySelector(".modal-close");     // "X" close icon in the modal

  // 3. Set up event listeners to close the modal (popup) window.
  //    When the user clicks the exit button or the close icon, hide the modal.
  //    This is DOM manipulation: changing the style to hide the modal.
  exitBtn.addEventListener("click", () => {
    modal.style.display = "none";
    // Remove the "expanded" class from any info-card (closes expanded cards)
    document.querySelectorAll(".info-card.expanded").forEach(c => c.classList.remove("expanded"));
  });

  closeIcon.addEventListener("click", () => {
    modal.style.display = "none";
    document.querySelectorAll(".info-card.expanded").forEach(c => c.classList.remove("expanded"));
  });

  // If the user clicks outside the modal content, close the modal.
  // e.target === modal means the user clicked the background, not the content.
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // 4. Set up pagination variables.
  //    imagesPerPage: how many images to show on each page (default from input)
  //    currentPage: which page is currently being shown
  let imagesPerPage = parseInt(perPageInput.value) || 12;
  let currentPage = 1;

  /**
   * Render a specific page of photo cards.
   * This function:
   *   - Clears the gallery
   *   - Adds info-cards for the photos on the current page
   *   - Adds fade-out and fade-in animation for smooth transitions
   *
   * DOM manipulation steps:
   *   - Remove all children from the gallery (gallery.innerHTML = "")
   *   - For each photo, create a new div (document.createElement)
   *   - Set its innerHTML to the card's HTML
   *   - Add event listeners to the card and its button
   *   - Add the card to the gallery (gallery.appendChild)
   */
  function renderPage(page) {
    // Add a fade-out effect before changing the gallery
    gallery.classList.add("fade-out");

    // Wait 300ms for the fade-out, then update the gallery
    setTimeout(() => {
      gallery.innerHTML = ""; // Remove all existing cards

      // Calculate which photos to show on this page
      const start = (page - 1) * imagesPerPage;
      const end = start + imagesPerPage;
      const pagePhotos = enrichedPhotos.slice(start, end);

      // For each photo, create an info-card and add it to the gallery
      pagePhotos.forEach((photo) => {
        // Create a div for each info-card
        const card = document.createElement("div"); // <div></div>
        card.className = "info-card"; // <div class="info-card"></div>

        // Set the HTML content of the card
        // This creates a "figure-card" element for each photo on the page with the details (pic, name, born, bioText) coming from PhotoPagesData.json (fetched above)
        card.innerHTML = `
          <div class="figure-card">
            <div class="image-wrapper">
              <div class="img-magnifier-container ">
                <img
                  class="magImage figure-img"
                  src="img/${photo.pic}" alt="${photo.name}"
                  style="width: 236px; box-shadow: none;"
                >
              </div>
              <div class="caption">${photo.name}</div>
            </div>
            <figcaption class="bio-text">
              <h2>${photo.name}</h2>
              <h3>Born ${photo.born}</h3>
              <h3>Family Search: ${photo.famSrchLink}</h3>
              <p class="bio-snippet">${photo.bioText.replace(/\r?\n/g, '<br>')}</p>
              <button class="toggle-bio">Read More</button>
            </figcaption>
          </div>
        `;

        // When the card is clicked, expand or collapse it
        card.addEventListener("click", () => {
          if (card.classList.contains("expanded")) {
            card.classList.remove("expanded");
          } else {
            // Collapse any other expanded cards first
            document.querySelectorAll(".info-card.expanded").forEach(c => c.classList.remove("expanded"));
            card.classList.add("expanded");
          }
        });

        // When the "Read More" button is clicked, show the modal with full bio
        // e.stopPropagation() prevents the card's click event from firing
        card.querySelector(".toggle-bio").addEventListener("click", (e) => {
          e.stopPropagation();
          // Fill in the modal with the photo's info
          modalName.textContent = photo.name;
          modalBorn.textContent = `Born ${photo.born}`;
          modalImage.src = `img/${photo.pic}`;
          modalImage.alt = photo.name;
          // Replace line breaks in bioText with <br> for HTML display
          modalBio.innerHTML = `<p>${photo.bioText.replace(/\r?\n/g, '<br>')}</p>`;
          modal.style.display = "flex"; // Show the modal (display: flex)
        });

        // Add the card to the gallery (the main photo area)
        gallery.appendChild(card);
      });

      // Re-bind magnifier to newly added images
      setupMagnifier(defaultMagConfig);

      // Add fade-in effect after updating the gallery
      gallery.classList.remove("fade-out");
      gallery.classList.add("fade-in");
      setTimeout(() => {
        gallery.classList.remove("fade-in");
      }, 400);
    }, 300);
  }

  /**
   * Create a pagination control (the row of page number buttons).
   * Returns a div element containing the pagination buttons.
   *
   * DOM manipulation steps:
   *   - Create a div for the pagination container
   *   - For each page, create a button and add it to the container
   *   - Add event listeners to the buttons to change the page
   */
  function generatePaginationElement() {
    const container = document.createElement("div");
    container.className = "pagination";

    // Calculate the total number of pages
    const totalPages = Math.ceil(enrichedPhotos.length / imagesPerPage);

    // Create the "Prev" button
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "← Prev";
    prevBtn.className = "nav-btn";
    prevBtn.disabled = currentPage === 1; // Disable if on first page
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
        updatePagination();
      }
    });
    container.appendChild(prevBtn);

    // Create a button for each page number
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = "page-btn";
      if (i === currentPage) btn.classList.add("active"); // Highlight current page

      btn.addEventListener("click", () => {
        currentPage = i;
        renderPage(currentPage);
        updatePagination();
      });

      container.appendChild(btn);
    }

    // Create the "Next" button
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next →";
    nextBtn.className = "nav-btn";
    nextBtn.disabled = currentPage === totalPages; // Disable if on last page
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
        updatePagination();
      }
    });
    container.appendChild(nextBtn);

    return container;
  }

  /**
   * Update both the top and bottom pagination controls.
   * This function clears the old controls and adds new ones.
   *
   * DOM manipulation steps:
   *   - Remove all children from the pagination containers
   *   - Add new pagination controls by calling generatePaginationElement()
   */
  function updatePagination() {
    if (topPagination) {
      topPagination.innerHTML = "";
      topPagination.appendChild(generatePaginationElement());
    }

    if (bottomPagination) {
      bottomPagination.innerHTML = "";
      bottomPagination.appendChild(generatePaginationElement());
    }
  }

  /**
   * Handle user input for images per page.
   * When the user types a new number, update the gallery and pagination.
   * Uses a debounce timer to avoid updating too often while typing.
   *
   * DOM manipulation steps:
   *   - Listen for input events on the perPageInput element
   *   - When the value changes, update imagesPerPage and re-render the gallery
   */
  let debounceTimer;
  perPageInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const value = parseInt(e.target.value);
      // Only update if the value is a valid number between 1 and 100
      if (!isNaN(value) && value >= 1 && value <= 100) {
        imagesPerPage = value;
        currentPage = 1; // Go back to the first page
        renderPage(currentPage);
        updatePagination();
      }
    }, 300); // Wait 300ms after the last keystroke
  });

  // 5. Initial load: show the first page and set up pagination controls
  renderPage(currentPage);
  updatePagination();
});