fetch("../data/FamilyVideos.json")
  .then(response => response.json())
  .then(items => {
    const gallery = document.querySelector(".gallery");

    items.forEach(item => {

      // Outer flip-card
      const flipCard = document.createElement("div");
      flipCard.className = "flip-card";

      const flipInner = document.createElement("div");
      flipInner.className = "flip-card-inner";

      // ---------- FRONT (image) ----------
      const front = document.createElement("div");
      front.className = "flip-card-front";

      const img = document.createElement("img");
      img.src = `../video/${item.img_src}`;
      img.alt = item.alt;

      front.appendChild(img);

      // ---------- BACK (video) ----------
      const back = document.createElement("div");
      back.className = "flip-card-back";

      const video = document.createElement("video");
      video.className = "card-video";
      video.style.width = "100%";
      video.controls = true;
      video.preload = "metadata";
      video.poster = `../video/${item.poster}`;
      video.style.display = "none"; // hide initially

      const source = document.createElement("source");
      source.src = `../video/${item.source_src}`;
      source.type = `video/${item.type}`;

      video.appendChild(source);
      back.appendChild(video);

      // ---------- CLICK BEHAVIOR ----------
      img.addEventListener("click", () => {
        img.style.display = "none";
        video.style.display = "block";
      });

      // Assemble card
      flipInner.appendChild(front);
      flipInner.appendChild(back);
      flipCard.appendChild(flipInner);

      // Add to gallery
      gallery.appendChild(flipCard);
    });
  })
  .catch(err => console.error("Error loading FamilyVideos.json:", err));
