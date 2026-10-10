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

// window.ALBUM = {
//   eyebrow: 'Crest inspired by Lillian Falkman',
//   title: 'Family Album',
//   coverFont: 'Georgia,serif', // optional font for cover title (default = system sans-serif)
//   subtitle: 'Generations in Photographs',
//   coverFont: 'IM Fell English,serif', // optional font for cover title (default = system sans-serif)
//   dedication: 'This album is dedicated to everyone who made us who we are.',
//   backText: 'Family Name \u00b7 Est. Year',
//   crest: 'images/Crest.png',                       // e.g. 'images/crest.png'
//   backCrest: 'images/AlexCrest.png',                    // e.g. 'images/crest2.png'
//   branches: [
//     {
//       name: 'Falkman Family',
//       color: '#8c2f39',
//       crest: 'images/crest2.png',
//       blurb: 'This section is about the Falkman branch of the family.',
//       photos: [
//         { src: 'images/VJday.jpg', caption: 'VJ Day, 1945', date: '', size: 'medium' },
//         { src: 'images/Peter.jpg', caption: 'Grandpa, 1952', date: '1952', size: 'medium' },
//         { src: 'images/Karen.jpg', caption: 'Grandma, 1952', date: '1952', size: 'medium' },
//         { type: 'note', title: 'How we began', text: 'Peter and Karen met in 1950 at...' },
//         ...samplePhotos(11, 5, 'Falkman')
//         ]
//     },
//     {
//       name: 'Alexander Family',
//       color: '#2f6b4f',
//       crest: 'images/AlexCrest.png',
//       blurb: 'Rooted in her love, grown through her lineage.',
//       photos: samplePhotos(9, 140, 'Maternal')
//     },
//     {
//       name: 'Broderick Family',
//       color: '#2d5a8c',
//       crest: 'images/Brod.png',
//       blurb: 'Family by birth, friends by choice, and a joy to be around.',
//       photos: samplePhotos(13, 210, 'Children')
//     },
//     {
//       name: 'Sweller Family',
//       color: '#a8741f',
//       crest: 'images/Sweller.png',
//       blurb: 'The best part of having a cousin is getting to see the wonderful family you\'ve created.',
//       photos: samplePhotos(8, 40, 'Cousins')
//     },
//     {
//       name: 'Family Friends',
//       color: '#2f6b4f',
//       crest: null,
//       blurb: 'Add a short note about this branch of the family.',
//       photos: samplePhotos(9, 140, 'Maternal')
//     },
//   ]
// };
window.ALBUM = {
  "eyebrow": "Crest inspired by Lillian Falkman",
  "title": "Family Album",
  "subtitle": "Generations in Photographs",
  "dedication": "This album is dedicated to everyone who made us who we are.",
  "backText": "Family Name · Est. Year",
  "coverFont": "IM Fell English,serif",
  "crest": "images/Crest.png",
  "backCrest": "images/AlexCrest.png",
  "branches": [
    {
      "name": "Falkman Family",
      "color": "#8c2f39",
      "crest": "images/crest2.png",
      "blurb": "This section is about the Falkman branch of the family.",
      "photos": [
        {
          "src": "images/VJday.jpg",
          "caption": "VJ Day, 1945",
          "date": "",
          "size": "medium"
        },
        {
          "src": "images/Peter.jpg",
          "caption": "Grandpa, 1952",
          "date": "1952",
          "size": "medium"
        },
        {
          "src": "images/Karen.jpg",
          "caption": "Grandma, 1952",
          "date": "1952",
          "size": "medium"
        },
        {
          "type": "note",
          "title": "How we began",
          "text": "Peter and Karen met in 1950 at..."
        },
        {
          "src": "images/Helen Alexander (c 1942).jpg",
          "caption": "Helen Falkman",
          "date": "1921",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(16%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(46%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%202%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(27%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(57%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%203%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(38%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(68%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%204%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(49%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(79%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%205%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(60%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(90%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%206%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(71%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(101%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%207%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(82%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(112%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%208%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(93%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(123%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%209%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(104%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(134%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%2010%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(115%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(145%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EFalkman%2011%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        }
      ]
    },
    {
      "name": "Alexander Family",
      "color": "#2f6b4f",
      "crest": "images/AlexCrest.png",
      "blurb": "Rooted in her love, grown through her lineage.",
      "photos": [
        {
          "src": "images/alexander-family-caption-goes-here-names-place.jpg",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(151%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(181%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%202%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(162%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(192%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%203%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(173%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(203%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%204%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(184%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(214%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%205%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(195%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(225%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%206%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(206%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(236%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%207%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(217%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(247%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%208%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(228%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(258%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%209%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        }
      ]
    },
    {
      "name": "Broderick Family",
      "color": "#2d5a8c",
      "crest": "images/Brod.png",
      "blurb": "Family by birth, friends by choice, and a joy to be around.",
      "photos": [
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(210%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(240%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%201%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(221%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(251%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%202%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(232%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(262%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%203%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(243%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(273%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%204%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(254%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(284%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%205%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(265%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(295%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%206%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(276%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(306%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%207%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(287%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(317%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%208%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(298%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(328%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%209%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(309%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(339%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%2010%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(320%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(350%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%2011%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(331%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(1%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%2012%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(342%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(12%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EChildren%2013%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        }
      ]
    },
    {
      "name": "Sweller Family",
      "color": "#a8741f",
      "crest": "images/Sweller.png",
      "blurb": "The best part of having a cousin is getting to see the wonderful family you've created.",
      "photos": [
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(40%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(70%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%201%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(51%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(81%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%202%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(62%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(92%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%203%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(73%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(103%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%204%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(84%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(114%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%205%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(95%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(125%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%206%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(106%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(136%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%207%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(117%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(147%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3ECousins%208%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        }
      ]
    },
    {
      "name": "Family Friends",
      "color": "#2f6b4f",
      "crest": null,
      "blurb": "Add a short note about this branch of the family.",
      "photos": [
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(140%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(170%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%201%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(151%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(181%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%202%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(162%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(192%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%203%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(173%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(203%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%204%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(184%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(214%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%205%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(195%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(225%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%206%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'600'%20viewBox%3D'0%200%20800%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(206%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(236%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'400'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M268%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%207%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "large"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'800'%20viewBox%3D'0%200%20600%20800'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(217%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(247%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'320'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20576%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'720'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%208%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "medium"
        },
        {
          "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'600'%20height%3D'600'%20viewBox%3D'0%200%20600%20600'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20y1%3D'0'%20x2%3D'1'%20y2%3D'1'%3E%3Cstop%20offset%3D'0'%20stop-color%3D'hsl(228%2C35%25%2C74%25)'%2F%3E%3Cstop%20offset%3D'1'%20stop-color%3D'hsl(258%2C40%25%2C46%25)'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'url(%23g)'%2F%3E%3Cg%20fill%3D'rgba(255%2C255%2C255%2C.55)'%3E%3Ccircle%20cx%3D'300'%20cy%3D'240'%20r%3D'66'%2F%3E%3Cpath%20d%3D'M168%20432%20a%20132%20120%200%200%201%20264%200%20z'%2F%3E%3C%2Fg%3E%3Ctext%20x%3D'50%25'%20y%3D'540'%20text-anchor%3D'middle'%20font-family%3D'Georgia%2Cserif'%20font-size%3D'36'%20fill%3D'rgba(255%2C255%2C255%2C.9)'%3EMaternal%209%3C%2Ftext%3E%3C%2Fsvg%3E",
          "caption": "Caption goes here – names, place",
          "date": "Year",
          "size": "small"
        }
      ]
    }
  ]
};
