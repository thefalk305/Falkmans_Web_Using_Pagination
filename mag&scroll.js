	// Magnifier glass controls
  import { toggleMagnifier, defaultMagConfig } from './magnifier.js';

  // change page title to page heading
  // comment out if not desired
  document.getElementsByTagName("title")[0].textContent = document.querySelector('#heading-row h1').textContent;

  const checkbox = document.getElementById('mag-checkbox');
  const zoomInput = document.getElementById('mag');

  checkbox.addEventListener('change', () => {
    zoomInput.style.display = checkbox.checked ? 'block' : 'none';
    toggleMagnifier(checkbox.checked, defaultMagConfig);
  });

  zoomInput.addEventListener('input', () => {
    toggleMagnifier(checkbox.checked, defaultMagConfig);
  });

// =======================
// Back to Top Scroll Button
// =======================

document.addEventListener("DOMContentLoaded", function () {
  var link = document.getElementById("back-to-top");
  if (!link) return; // ✅ safely exit if not found

  var amountScrolled = 600;

  window.addEventListener("scroll", function () {
    if (window.pageYOffset > amountScrolled) {
      link.classList.add("show");
    } else {
      link.classList.remove("show");
    }  
  });

  link.addEventListener("click", function (e) {
    e.preventDefault();
    var distance = 0 - window.pageYOffset;
    var increments = distance / (500 / 16);

    function animateScroll() {
      window.scrollBy(0, increments);
      if (window.pageYOffset <= document.body.offsetTop) {
        clearInterval(runAnimation);
      }
    }
    var runAnimation = setInterval(animateScroll, 16);
    });
});
