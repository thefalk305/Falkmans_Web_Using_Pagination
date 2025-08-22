    // How this script works:
    // This script fetches the 'top navigation menu' HTML from an external file ("./html/TopNavMenu.html") and injects it into the page at the element with id="top-nav-menu" (just below the script).
    // This allows for easy updates to the navigation menu without modifying the main HTML file.

fetch("/html/footer.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("footer").innerHTML = html;

    // Now that the footer is injected, check the filename
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    // do not display 'Return' if page === index.html
    if (filename === "index.html" || filename === "") {
      const returnLink = document.getElementById("return");
      if (returnLink) {
        returnLink.style.display = "none";
      }
    }
console.log(filename); // e.g., "index.html";
});
