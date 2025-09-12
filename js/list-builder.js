// list-builder.js

/**
 * This script reads data from 'jsonFile' and populates the page
 * with each person's name and their associated document links.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.filename - Path to the JSON file
 * @param {string} config.viewerFile - Base URL for the viewer page
 */
export function listBuilder({  jsonFile, viewer  }) {
  // Fetch the file containing the json data
  fetch(jsonFile)
    .then(res => res.json())
    .then(data => {
      // Get the container element where content will be injected
      const container = document.getElementById('content');

      // For each record in jsonFile, create a section 
      // on the page that displays the person's name and 
      // the list of the document links for that person
      data.forEach(person => {
        // Create a section for this person
        const section = document.createElement('div');
        section.className = 'person-section';

        // Create and append a header with the person's name
        const nameHeader = document.createElement('h2');
        nameHeader.textContent = person.name;
        section.appendChild(nameHeader);

        // Create a list to hold document links
        const list = document.createElement('ul');
        list.className = 'link-list';

        // Loop through each document link for this 
        // person and append it to the list
        person.links.forEach(doc => {
          const li = document.createElement('li');

          // Create the anchor element for the document
          const link = document.createElement('a');
          // Construct the href using the viewerFile base and the document ID
          // link.href = viewer + encodeURIComponent(doc.id);
          link.href = `${viewer}?id=${encodeURIComponent(doc.id)}`;

          link.target = '_blank'; // Open in a new tab
          link.textContent = doc.title;

          // Append the link to the list item
          li.appendChild(link);
          // Append the list item to the list
          list.appendChild(li);
        });

        // Append the list to the section
        section.appendChild(list);
        // Append the section to the main container
        container.appendChild(section);
      });
    })
    .catch(err => {
      // If something goes wrong, show an error message
      document.getElementById('content').textContent =
        'Error loading document data.';
      console.error('Failed to load JSON:', err);
    });
}