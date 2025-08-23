// How this script works:
// This script fetches the top portion of each web page from an external file ("./html/header.html") and injects it into the page just below <div id=container>  header.html contains the Banner, top-nav-menu and the page name along with the magnification elements.
// This allows for easy updates to the header information without modifying the main HTML files.

  fetch("/html/header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;
    const title = document.querySelector('meta[name="page-title"]').content;
    document.querySelector('#heading-row h1').textContent  = title;

    if (title !== "Welcome to the Falkman Family's History Website") {
      document.querySelector('#banner img').src = "/images/banner2.png";
    } else {
      // Special case for the index.html
      document.querySelector('#banner img').src = "/images/banner.gif";
    }

    // ⏰ Now safely initialize the clock
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