// scripts.js

// =======================
// Back to Top Scroll Button
// =======================

document.addEventListener("DOMContentLoaded", function () {
  var link = document.getElementById("back-to-top");
  var amountScrolled = 1500;

  window.addEventListener("scroll", function () {
    if (window.pageYOffset > amountScrolled) {
      link.classList.add("show");
    } else {
      link.className = "back-to-top";
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

// =======================
// Dynamic Clock
// =======================

const tday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const tmonth = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function GetClock() {
  const d = new Date();
  const nday = d.getDay();
  const nmonth = d.getMonth();
  const ndate = d.getDate();
  let nhour = d.getHours();
  let nmin = d.getMinutes();
  let nsec = d.getSeconds();

  if (nmin <= 9) nmin = "0" + nmin;
  if (nsec <= 9) nsec = "0" + nsec;

  const clocktext = `${tday[nday]}, ${tmonth[nmonth]} ${ndate} ${nhour}:${nmin}:${nsec}`;
  const clockbox = document.getElementById("clockbox");
  if (clockbox) clockbox.innerHTML = clocktext;
}

GetClock();
setInterval(GetClock, 1000);