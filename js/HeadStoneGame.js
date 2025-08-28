  // ===========================
  // HeadStone Game JavaScript
  // ===========================
  // This script powers the interactive "Head Stones & Grave Markers" game.
  // It demonstrates basic DOM manipulation, event handling, and game logic.
  // Comments are provided throughout to help beginners understand each section.

  // Array to hold the image filenames for the headstones.
  let images = [];

  // Fetch the list of headstone images from a JSON file.
  // Only images that do NOT include "stone" in their name are used in the game.
  fetch("images/headstones/headstones.json")
    .then(res => res.json())
    .then(files => {
      images = files.filter(name => !name.includes("stone"));
      renderGrid(); // Display the images in a grid.
    });

  // Game state variables
  let score = 0;           // Total score for the player
  let currentStone = "";   // The currently selected headstone image
  let points = 5;          // Points available for the current guess
  let correct = false;     // Whether the current guess is correct

  // Get references to important DOM elements
  const grid = document.getElementById("grid");
  const scoreDisplay = document.getElementById("score");
  const refreshBtn = document.getElementById("refreshScore");
  const deblurAllBtn = document.getElementById("deblurAll");

  const modal = document.getElementById("modal");
  const modalImage = document.getElementById("modalImage");
  const radioGroup = document.getElementById("radioGroup");
  const chosenName = document.getElementById("chosenName");
  const resultText = document.getElementById("resultText");
  const results = document.getElementById("results");
  const pointsBtn = document.getElementById("pointsBtn");
  const totalScoreBtn = document.getElementById("totalScoreBtn");

  // Function to display all headstone images in a grid.
  function renderGrid() {
    grid.innerHTML = "";
    images.forEach((stone, index) => {
      const div = document.createElement("div");
      div.className = "stone img-magnifier-container";
      const img = document.createElement("img");
      img.className = "magImage";
      img.src = `images/headstones/${stone}`;
      img.alt = stone;
      img.onclick = () => openModal(stone); // When clicked, open the guessing modal.
      div.appendChild(img);
      grid.appendChild(div);
    });
  }

  // Function to open the modal for a selected headstone image.
  function openModal(stone) {
    currentStone = stone;
    points = 5;
    correct = false;
    modalImage.src = `images/headstones/${stone}`;
    modalImage.style.filter = "blur(8px) sepia(1)";
    pointsBtn.textContent = `Points: ${points}`;
    totalScoreBtn.textContent = `Total Score: ${score}`;
    chosenName.textContent = "";
    results.style.visibility = "hidden";
    results.style.display = "block";
    radioGroup.innerHTML = "";

    // Create a list of unique names from the image filenames (before the dot).
    const names = [...new Set(images.map(img => img.split(".")[0]))];
    names.forEach((name, i) => {
      // Create a radio button for each possible name.
      const input = document.createElement("input");
      input.type = "radio";
      input.className = "radioBtn";
      input.name = "hstone";
      input.value = name;
      input.id = `item#${i}`;
      input.onclick = () => chosenName.textContent = name;

      // Create a label for the radio button.
      const label = document.createElement("label");
      label.htmlFor = input.id;
      label.textContent = name;

      radioGroup.appendChild(input);
      radioGroup.appendChild(label);
      radioGroup.appendChild(document.createElement("br"));
    });

    modal.style.display = "flex"; // Show the modal.
  }

  // Function to blur or deblur the modal image.
  // delta: positive to increase blur, negative to decrease.
  function blurImage(delta) {
    const regex = /\d+/g;
    let blurValue = parseInt(modalImage.style.filter.match(regex)?.[0] || "1");
    blurValue += delta;
    modalImage.style.filter = `blur(${Math.max(blurValue, 0)}px) sepia(1)`;
  }

  // Function to check if the selected name matches the headstone.
  function checkAnswer() {
    // Find the selected radio button.
    const selected = document.querySelector('input[name="hstone"]:checked');
    if (!selected) {
      alert("Please select a headstone name.");
      return;
    }

    results.style.visibility = "visible";
    // If the guess is correct:
    if (selected.value === currentStone.split(".")[0]) {
      if (!correct) {
        score += points; // Add points to total score.
        scoreDisplay.textContent = score;
        totalScoreBtn.textContent = `Total Score: ${score}`;
        modalImage.style.filter = "sepia(1)"; // Remove blur.
        resultText.textContent = "Correct! Please try the next headstone.";
        images.splice(images.indexOf(currentStone), 1); // Remove guessed image.
        renderGrid(); // Update grid.
        correct = true;
      }
    } else {
      // If the guess is incorrect:
      resultText.textContent = "Incorrect. Please try again.";
      radioGroup.removeChild(selected.nextSibling); // Remove label.
      radioGroup.removeChild(selected); // Remove input.
      points = Math.max(0, points - 1); // Lose a point.
      pointsBtn.textContent = `Points: ${points}`;
      blurImage(-1); // Slightly deblur image as a hint.
    }
  }

  // Attach event listeners to buttons.
  document.getElementById("checkAnswer").onclick = checkAnswer;
  document.getElementById("blurBtn").onclick = () => blurImage(1);
  document.getElementById("deblurBtn").onclick = () => blurImage(-1);
  document.getElementById("clearResults").onclick = () => results.style.visibility = "hidden";
  document.getElementById("closeModal").onclick = () => modal.style.display = "none";

  // Reset the score and reload the images when "Refresh Score" is clicked.
  refreshBtn.onclick = () => {
    score = 0;
    scoreDisplay.textContent = score;
    fetch("images/headstones/headstones.json")
      .then(res => res.json())
      .then(files => {
        images = files.filter(name => !name.includes("stone"));
        renderGrid();
      });
  };

  // Deblur all images in the grid when "Deblur All" is clicked.
  deblurAllBtn.onclick = () => {
    document.querySelectorAll(".stone img").forEach(img => {
      img.setAttribute("style", "filter: none !important");
    });
  };

  // Initial render of the grid when the page loads.
  renderGrid();
