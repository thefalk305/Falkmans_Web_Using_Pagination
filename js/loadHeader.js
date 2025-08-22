    // How this script works:
    // This script fetches the 'top navigation menu' HTML from an external file ("./html/TopNavMenu.html") and injects it into the page at the element with id="top-nav-menu" (just below the script).
    // This allows for easy updates to the navigation menu without modifying the main HTML file.

  //   fetch("/html/header.html")
  //   .then(res => res.text())
  //   .then(html => {
  //   document.getElementById("header").innerHTML = html;
  // });

  fetch("/html/header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;

    // Now that the footer is injected, check the filename
    const encodedFile = window.location.pathname;
    const path = decodeURIComponent(encodedFile.split('/').pop());

    var filename = path.substring(path.lastIndexOf('/') + 1);
     filename = filename.split('.')[0];

    if(filename === "index") 
      document.querySelector('#heading-row h1').innerHTML = "Welcome to the Falkman Family's History Website";
    else
      document.querySelector('#heading-row h1').innerHTML = filename;



    // do not display 'Return' if page === index.html
    if (filename === "index.html" || filename === "") {
      const pageTitle = document.getElementById("return");
      if (pageTitle) {
        pageTitle.style.display = "none";
      }
    }
console.log(filename); // e.g., "index.html";



    // ⏰ Now safely initialize the clock
    const tday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const tmonth = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    function GetClock() {
      const d = new Date();
      const clocktext = `${tday[d.getDay()]}, ${tmonth[d.getMonth()]} ${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
      const clockbox = document.getElementById("clockbox");
      if (clockbox) clockbox.innerHTML = clocktext;
    }

    GetClock();
    setInterval(GetClock, 1000);
  });