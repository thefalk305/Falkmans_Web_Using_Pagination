    // How this script works:
    // This script fetches footer.html from an external file ("./html/footer.html") and injects it into the page at the element with id="footer" (just below the script).
    // This allows for easy updates to the footer without modifying the main HTML files.

fetch("/html/footer.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("footer").innerHTML = html;

     // do not display 'Return' from footer.html if filename === index.html
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    if (filename === "index.html" || filename === "") {
      document.getElementById("return").style.display = "none";
    }
});
