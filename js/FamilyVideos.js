// ============================================================================
// File: /js/FamilyVideos.js
// Purpose: Dynamically build the Family Video flip‑card gallery using data
//          loaded from /data/FamilyVideos.json.
//
// How it works:
//   1. Fetch JSON describing each family video (image, alt text, poster, mp4).
//   2. For each JSON entry, create the full flip‑card DOM structure:
//        - flip-card
//        - flip-card-inner
//        - flip-card-front (image)
//        - flip-card-back (video)
//   3. Append each completed card into <div class="gallery"> in FamilyVideos.html.
//
// Folder structure expected:
//   /pages/FamilyVideos.html
//   /js/FamilyVideos.js
//   /data/FamilyVideos.json
//   /video/*.jpg, *.MP4
//
// ============================================================================


// ---------------------------------------------------------------------------
// Fetch the JSON file containing all video metadata.
// "../data/FamilyVideos.json" is correct because FamilyVideos.html is in /pages.
// ---------------------------------------------------------------------------
fetch("../data/FamilyVideos.json")

  // Convert the response into a JavaScript array of objects
  .then(response => response.json())

  // Main processing block: build the gallery from the JSON items
  .then(items => {

    // Locate the gallery container in the HTML.
    // Must match <div class="gallery"> in FamilyVideos.html.
    const gallery = document.querySelector(".gallery");

    // Loop through each video entry in the JSON file
    items.forEach(item => {

      // ======================================================================
      // Create the outer flip-card container
      // ======================================================================
      const flipCard = document.createElement("div");
      flipCard.className = "flip-card";

      // Inner wrapper that holds both front and back sides
      const flipInner = document.createElement("div");
      flipInner.className = "flip-card-inner";


      // ======================================================================
      // FRONT SIDE — shows the still image
      // ======================================================================
      const front = document.createElement("div");
      front.className = "flip-card-front";

      const img = document.createElement("img");

      // Build correct relative path to the image file
      img.src = `../video/${item.img_src}`;

      // Alt text from JSON
      img.alt = item.alt;

      // Add the image to the front side
      front.appendChild(img);


      // ======================================================================
      // BACK SIDE — shows the playable video
      // ======================================================================
      const back = document.createElement("div");
      back.className = "flip-card-back";

      const video = document.createElement("video");
      video.className = "card-video";

      // Use CSS-style width because <video width="100%"> is invalid
      video.style.width = "100%";

      // Enable playback controls
      video.controls = true;

      // Only load metadata until user interacts
      video.preload = "metadata";

      // Poster image shown before playback
      video.poster = `../video/${item.poster}`;

      // Create the <source> element for the MP4 file
      const source = document.createElement("source");
      source.src = `../video/${item.source_src}`;
      source.type = `video/${item.type}`;

      // Add the <source> to the <video>
      video.appendChild(source);

      // Add the video to the back side
      back.appendChild(video);


      // ======================================================================
      // Assemble the flip-card structure
      // ======================================================================
      flipInner.appendChild(front);   // front side
      flipInner.appendChild(back);    // back side
      flipCard.appendChild(flipInner); // wrap both sides


      // ======================================================================
      // Add the completed flip-card to the gallery
      // ======================================================================
      gallery.appendChild(flipCard);
    });
  })

  // -------------------------------------------------------------------------
  // Error handling — logs any issues loading or parsing the JSON file
  // -------------------------------------------------------------------------
  .catch(err => console.error("Error loading FamilyVideos.json:", err));
