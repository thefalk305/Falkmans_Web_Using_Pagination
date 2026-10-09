/* ==========================================================================
  YOUR ALBUM CONTENT

  EASIEST WAY: press the "Edit album" button in the page. You can add photos
  (pick or drag & drop), type captions, add family branches, story pages and
  page breaks. Those edits are saved inside your browser and take priority
  over this file. (Backup tab = download / restore a copy; "Start over" =
  go back to this file.)

  THE FILE WAY: edit this file instead (it needs no browser storage).

  cover / back cover
    title, subtitle, eyebrow, dedication (inside front cover), backText
    crest : path to your family crest image (PNG/SVG with transparent
            background looks best), e.g. "images/crest.png".
            Leave as null to show a dashed "YOUR CREST" placeholder.
    innerCrest : show the crest on the inner pages too. One of
            'none' | 'header' (small, in the page heading) |
            'footer' (small, bottom corner) | 'watermark' (faint, behind photos).
            Each branch uses its own crest if it has one, else the family crest.

  branches  (each one gets a tab on the page edge and a title page)
    name     : shown on the tab, index and title page
    tabLabel : optional shorter text for the tab
    color    : tab / accent colour
    crest    : optional crest for this branch's title page (null = placeholder)
    blurb    : short note under the branch name
    photos   : list of photos and story pages, in the order you want them
        photo:
          src     : image path, e.g. "images/grandpa-1962.jpg"
          caption : text under the photo
          date    : optional small line under the caption
          size    : "small" | "medium" | "large"
                    Bigger photos take more room, so a page holds 3 to 5 photos
                    depending on the sizes you choose (large = fewest per page).
          fit     : optional. "contain" shows the whole photo (no cropping);
                    default "cover" fills the frame and crops the edges.
          newPage : optional. true = this photo starts a fresh page.
        story page (a page of text):
          { type: 'note', title: 'How we began', text: 'Write here...' }
   ========================================================================== */

/* ---- placeholder photo generator (delete once you use real photos) ---- */
function placeholder(w, h, hue, label) {
  const m = Math.min(w, h);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${hue},35%,74%)'/>` +
    `<stop offset='1' stop-color='hsl(${(hue + 30) % 360},40%,46%)'/></linearGradient></defs>` +
    `<rect width='100%' height='100%' fill='url(#g)'/>` +
    `<g fill='rgba(255,255,255,.55)'><circle cx='${w / 2}' cy='${h * 0.4}' r='${m * 0.11}'/>` +
    `<path d='M${w / 2 - m * 0.22} ${h * 0.72} a ${m * 0.22} ${m * 0.2} 0 0 1 ${m * 0.44} 0 z'/></g>` +
    `<text x='50%' y='${h * 0.9}' text-anchor='middle' font-family='Georgia,serif' ` +
    `font-size='${m * 0.06}' fill='rgba(255,255,255,.9)'>${label}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const SHAPES = [
  [800, 600, 'large'], [600, 800, 'medium'], [600, 600, 'small'],
  [800, 600, 'medium'], [600, 800, 'small'], [600, 600, 'small'],
  [800, 600, 'large'], [600, 800, 'medium'], [600, 600, 'small'],
  [800, 600, 'small'], [600, 800, 'medium'], [800, 600, 'medium'],
  [600, 600, 'small']
];

function samplePhotos(count, hue, label) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const [w, h, size] = SHAPES[i % SHAPES.length];
    out.push({
      src: placeholder(w, h, (hue + i * 11) % 360, `${label} ${i + 1}`),
      caption: `Caption goes here \u2013 names, place`,
      date: 'Year',
      size
    });
  }
  return out;
}

window.ALBUM = {
  eyebrow: '',
  title: 'The Family Album',
  subtitle: 'Generations in Photographs',
  dedication: 'For everyone who made us who we are.',
  backText: 'Family Name \u00b7 Est. Year',
  crest: null,                       // e.g. 'images/crest.png'
  innerCrest: 'none',                // 'none' | 'header' | 'footer' | 'watermark'

  branches: [
    {
      name: 'Paternal Side',
      color: '#8c2f39',
      crest: "./images/crest.png",
      blurb: 'Add a short note about this branch of the family.',
      photos: samplePhotos(11, 5, 'Paternal')
    },
    {
      name: 'Maternal Side',
      color: '#2f6b4f',
      crest: "./images/crest.png",
      blurb: 'Add a short note about this branch of the family.',
      photos: samplePhotos(9, 140, 'Maternal')
    },
    {
      name: 'Our Children',
      color: '#2d5a8c',
      crest: "./images/crest.png",
      blurb: 'Add a short note about this branch of the family.',
      photos: samplePhotos(13, 210, 'Children')
    },
    {
      name: 'Cousins',
      color: '#a8741f',
      crest: "./images/crest.png",
      blurb: 'Add a short note about this branch of the family.',
      photos: samplePhotos(8, 40, 'Cousins')
    }
  ]
};
