    // How this script works:
    // This script fetches the 'top navigation menu' HTML from an external file ("./html/TopNavMenu.html") and injects it into the page at the element with id="top-nav-menu" (just below the script).
    // This allows for easy updates to the navigation menu without modifying the main HTML file.

    fetch("/html/footer.html")
    .then(res => res.text())
    .then(html => {
    document.getElementById("footer").innerHTML = html;
  });