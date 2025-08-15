<<<<<<< HEAD
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
=======
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
>>>>>>> 48a4ce1 (first commit)
  });