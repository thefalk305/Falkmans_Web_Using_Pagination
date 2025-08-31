// =======================
// Load Footer Dynamically
// =======================

// This script fetches footer.html from an external file ("./html/footer.html")
// and injects it into the page at the element with id="footer".
// This allows for easy updates to the footer without modifying the main HTML files.

fetch("/html/footer.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("footer").innerHTML = html;

    // Do not display 'Return' from footer.html if filename === index.html
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    if (filename === "index.html" || filename === "") {
      const returnLink = document.getElementById("return");
      if (returnLink) {
        returnLink.style.display = "none";
      }
    }

    // =======================
    // Back to Top Scroll Logic
    // =======================

    // Select the "Back to Top" link by its ID
    const link = document.getElementById("back-to-top");
    // ✅ Exit early if the element doesn't exist (prevents errors)
    if (!link) return;

    // Define the scroll threshold (in pixels) after which the button appears
    const amountScrolled = 500;

    // Listen for scroll events on the window
    window.addEventListener("scroll", function () {
    // If the user has scrolled more than the threshold...
      if (window.pageYOffset > amountScrolled) {
      // ...show the button by adding the "show" class
        link.classList.add("show");
      } else {
      // ...otherwise hide the button
        link.classList.remove("show");
      }
    });

    // Listen for clicks on the "Back to Top" button
    link.addEventListener("click", function (e) {
    // Prevent the default anchor behavior (e.g., jumping to #top)
      e.preventDefault();

      // Calculate the total distance to scroll upward
      const distance = 0 - window.pageYOffset;
      // Break the scroll distance into small increments
      // 500ms total duration, with 16ms intervals (~60fps)
      const increments = distance / (500 / 16);

      // Define the scroll animation function
      function animateScroll() {
      // Scroll by the calculated increment
        window.scrollBy(0, increments);
      // Stop the animation once we've reached the top
        if (window.pageYOffset <= document.body.offsetTop) {
          clearInterval(runAnimation);
        }
      }

      // Start the animation using setInterval
      const runAnimation = setInterval(animateScroll, 16);
    });
  });