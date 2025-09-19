// How this script works:
// This script fetches the top portion of each web page from an external file ("./html/header.html") and injects it into the page just below <div id=container>  header.html contains the Banner, top-nav-menu and the page name along with the magnification elements.
// This allows for easy updates to the header information without modifying the main HTML files.

  fetch("/html/header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;
    

    // Get pageName and query param for Genealogy Document Archives -- Document No. 
    const url = new URL(window.location.href);
    const path = url.pathname;  
    const page = path.split("/").pop();
    const pageName = page.split(".")[0];
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // get 'page-title' for '#heading-row h1'
    const title = document.querySelector('meta[name="page-title"]').content;
    document.querySelector('#heading-row h1').textContent = title;

    // set default 'banner'
    document.querySelector('#banner img').src = "/images/banner2.png";

    // some pages have a different banner or heading-row h1
    if (title === "Welcome to the Falkman's Family History Website") {
     // Special case for index.html
      document.querySelector('#banner img').src = "/images/banner.gif";
    } else if (title === "Photo Pages") {
    // Special case for PhotoPages.html
      document.querySelector('#banner img').src = "/img/Banner-Photo.png";
    } else if (pageName === "record-viewer") {
    // Special case for record-viewer.html - set '#heading-row h1' to include document #
      document.querySelector('#heading-row h1').textContent  = title + " -- Document No. " + id;
    } else if (pageName === "collage-viewer") {
    // Special case for collage-viewer.html - set '#heading-row h1' to include document #
      document.querySelector('#heading-row h1').textContent  = title + " -- Collage No. " + id;
    }

    
    // =======================
    // Dynamic Clock 
    //
    // Displays the date and time in 
    // the clockbox <div> in the header
    // =======================
    const tday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const tmonth = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Function to update the clock every second
    function GetClock() {
      const d = new Date();
      const clocktext = `${tday[d.getDay()]}, ${tmonth[d.getMonth()]} ${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
      const clockbox = document.getElementById("clockbox");
      if (clockbox) clockbox.innerHTML = clocktext;
    }

    GetClock();
    setInterval(GetClock, 1000);
  });