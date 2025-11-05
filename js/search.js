/*
 * SEARCH.JS - Genealogy Website Search Functionality
 * 
 * This file creates a search feature for genealogy records. 
 * It allows users to search for family members by name and view their details.
 * 
 * Key JavaScript concepts used:
 * - DOM manipulation (changing HTML elements)
 * - Event handling (responding to user actions)
 * - Asynchronous programming (fetching data from files)
 * - Array methods (filter, find, etc.)
 * - Functions and scope
 */

// Information about the data structure (commented out as reference)
//	info_id last_name	first_name	mi	suff	bio	father	mother	spouse	child1	child2	child3	child4	child5	child6	sib1	sib2	sib3	sib4	sib5	sib6	birthplace	born died buried	pic	pic2	pic3	pic4	pic5	pic6	famSrchLink

// Wait for the HTML document to fully load before running the JavaScript code
document.addEventListener('DOMContentLoaded', function() {
    
    // Create variables to store the data
    // allData: holds the complete dataset loaded from the JSON file
    // filteredData: holds only the records that match the current search
    let allData = [];       // Initially empty until data is loaded
    let filteredData = [];  // Initially empty until data is loaded
    
    // Get references to HTML elements we'll need to interact with
    // These are elements on the search page that we'll change or respond to
    const nameSearch = document.getElementById('nameSearch');      // The search input field
    const nameSuggestions = document.getElementById('nameSuggestions'); // Container for search suggestions
    
    // Get references to elements that will display person details
    const infoId = document.getElementById('infoId');               // Person's ID
    const fullName = document.getElementById('fullName');           // Person's full name
    const bio = document.getElementById('bio');                     // Person's biography
    const father = document.getElementById('father');               // Person's father
    const mother = document.getElementById('mother');               // Person's mother
    const spouse = document.getElementById('spouse');               // Person's spouse
    const birthplace = document.getElementById('birthplace');       // Person's birthplace
    const born = document.getElementById('born');                   // Person's birth date
    const died = document.getElementById('died');                   // Person's death date
    const buried = document.getElementById('buried');               // Person's burial place
    const familySearchLink = document.getElementById('familySearchLink'); // Link to FamilySearch
    const childrenSelect = document.getElementById('children');     // Dropdown for children
    const siblingsSelect = document.getElementById('siblings');     // Dropdown for siblings
    const picturesSelect = document.getElementById('pictures');     // Dropdown for pictures
    const primaryImage = document.getElementById('primaryImage');   // Image display area
    const bioDisplay = document.getElementById('bioDisplay');       // Biography display area
    
    // Define the path to the JSON data file
    // JSON is a format for storing data that JavaScript can easily read
    // const jsonFile = '../data/InfoTableData.json'; // Alternative data file
    const jsonFile = '../data/infotable.json'; // Current data file being used
    
    // Load the genealogy data from the JSON file
    // 'fetch' is a modern way to load data from files or servers
    fetch(jsonFile)
        .then(response => response.json()) // When we get a response, convert it to JSON
        .then(data => {
            // Once we have the data:
            allData = data;              // Store the complete dataset
            filteredData = [...allData]; // Create a copy of all data for filtering
            // The spread operator (...) creates a copy rather than a reference
        })
        .catch(error => {
            // If there's an error loading the data, show it in the console
            console.error('Error loading data:', error);
        });
    
    // Set up search functionality - respond when user types in the search box
    // 'addEventListener' lets us respond to user actions like typing
    nameSearch.addEventListener('input', function() {
        // Get what the user typed and make it lowercase for easier searching
        const searchTerm = this.value.toLowerCase().trim();
        
        // If the search box is empty, hide the suggestions
        if (searchTerm.length === 0) {
            nameSuggestions.style.display = 'none'; // Hide suggestions box
            return; // Stop the function here
        }
        
        // Filter the data to find matches
        // 'filter' creates a new array containing only items that match our criteria
        filteredData = allData.filter(item => 
            // Check if the search term appears in any of these fields:
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||        // Person's name
            (item.first_name && item.first_name.toLowerCase().includes(searchTerm)) || // Person's first name
            (item.last_name && item.last_name.toLowerCase().includes(searchTerm))     // Person's last name
        );
        
        // Show the matching names as suggestions
        showNameSuggestions(filteredData, searchTerm);
    });
    
    // Function to display name suggestions in the suggestions box
    function showNameSuggestions(data, searchTerm) {
        // Clear any existing suggestions
        nameSuggestions.innerHTML = '';
        
        // If no matches were found, hide the suggestions box
        if (data.length === 0) {
            nameSuggestions.style.display = 'none';
            return;
        }
        
        // Only show the first 10 suggestions to keep it manageable
        const suggestionsToShow = data.slice(0, 10);
        
        // Loop through each matching person and create a suggestion element
        suggestionsToShow.forEach(item => {
            // Create a new HTML div element for this suggestion
            const suggestion = document.createElement('div');
            suggestion.className = 'name-suggestion'; // Add CSS class for styling
            
            // Set the text to display - use full name if available, otherwise combine first and last
            suggestion.textContent = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim();
            
            // Add functionality to click on the suggestion
            suggestion.addEventListener('click', function() {
                // Clear the search box and hide suggestions
                nameSearch.value = '';
                nameSuggestions.style.display = 'none';
                
                // Show the selected person's details
                showPersonDetails(item);
            });
            
            // Add this suggestion to the suggestions container
            nameSuggestions.appendChild(suggestion);
        });
        
        // Make the suggestions box visible
        nameSuggestions.style.display = 'block';
    }
    
    // Function to display all details about a person
    function showPersonDetails(person) {
        // Populate fields that don't need special handling
        infoId.textContent = person.id || ''; // Show person's ID, or empty string if not available
        
        // Format the name field in a standard format: 'Last Name, First Name Middle Initial. Suffix.'
        const nameParts = []; // Array to hold parts of the name
        if (person.last_name) nameParts.push(person.last_name + ','); // Add comma directly to last name
        if (person.first_name) nameParts.push(person.first_name);
        if (person.mi) nameParts.push(person.mi);      // Middle initial
        if (person.suff) nameParts.push(person.suff + '.'); // Suffix (like Jr., Sr.)
        
        // Join all name parts with spaces and clean up any double commas
        const formattedName = nameParts.join(' ').replace(', ,', ',').trim();
        fullName.textContent = formattedName;
        
        // Set up biography field - make it clickable to load the full bio
        if (person.bio) {
            bio.textContent = person.bio; // Show the bio filename initially
            // Make the bio field look clickable
            bio.style.cursor = 'pointer';
            bio.style.textDecoration = 'underline';
            bio.style.color = '#007bff';
            // When clicked, load the actual bio content from a file
            bio.onclick = () => loadBioContent(person.bio);
        } else {
            // If no bio file exists, clear the field and remove click functionality
            bio.textContent = '';
            bio.onclick = null;
        }
        
        // Set up clickable fields for Father, Mother, and Spouse
        // These will allow users to click and see details for related people
        setupClickableField(father, person.father);
        setupClickableField(mother, person.mother);
        setupClickableField(spouse, person.spouse);
        
        // Set non-clickable text fields
        birthplace.textContent = person.birthplace || '';
        born.textContent = person.born || '';
        died.textContent = person.died || '';
        buried.textContent = person.buried || '';
        
        // Set up Family Search Link (makes it clickable to open in new tab)
        if (person.famSrchLink) {
            familySearchLink.textContent = person.famSrchLink;
            // Make it look clickable
            familySearchLink.style.cursor = 'pointer';
            familySearchLink.style.textDecoration = 'underline';
            familySearchLink.style.color = '#007bff';
            // When clicked, open the link in a new tab
            familySearchLink.onclick = () => openFamilySearchLink(person.famSrchLink);
        } else {
            // If no link exists, clear the field
            familySearchLink.textContent = '';
            familySearchLink.onclick = null;
            familySearchLink.style.cursor = 'default';
        }
        
        // Populate dropdown menus for children and siblings
        // These dropdowns will also be clickable to see details for each person
        populateRelatedSelect(childrenSelect, person, ['child1', 'child2', 'child3', 'child4', 'child5', 'child6']);
        populateRelatedSelect(siblingsSelect, person, ['sib1', 'sib2', 'sib3', 'sib4', 'sib5', 'sib6']);
        
        // Populate pictures dropdown
        populatePicturesSelect(picturesSelect, person);
        
        // Display the primary image if one exists
        displayPrimaryImage(person.pic);
    }
    
    // Function to display the primary image from the 'pic' field
    function displayPrimaryImage(picFilename) {
        if (picFilename) {
            // Set the image source to show the picture
            primaryImage.src = `../img/${picFilename}`;
            
            // Wait for the image to load before showing it
            // This prevents showing a broken image icon
            primaryImage.onload = function() {
                primaryImage.classList.remove('hidden'); // Show the image
                bioDisplay.classList.add('hidden');      // Hide bio when showing image
            };
            
            // If the image fails to load, hide the container
            primaryImage.onerror = function() {
                primaryImage.classList.add('hidden'); // Hide if image doesn't exist
            };
        } else {
            // If no image exists, hide both image and bio areas
            primaryImage.classList.add('hidden');
            bioDisplay.classList.add('hidden');
        }
    }
    
    // Function to set up a clickable field for related people (father, mother, spouse)
    // When clicked, it will show details for that person
    function setupClickableField(element, name) {
        if (name) {
            // Set the text to the person's name
            element.textContent = name;
            // Make it look clickable
            element.style.cursor = 'pointer';
            element.style.textDecoration = 'underline';
            element.style.color = '#007bff';
            
            // When clicked, find that person in our data and show their details
            element.onclick = function() {
                // 'find' searches the allData array for an item matching our criteria
                const personData = allData.find(p => p.name === name);
                if (personData) {
                    showPersonDetails(personData); // Show the person's details
                }
                // If personData is undefined (not found), do nothing
            };
        } else {
            // If no name exists, clear the field
            element.textContent = '';
            element.onclick = null; // Remove click functionality
        }
    }
    
    // Function to populate dropdown menus for related people (children, siblings)
    // These dropdowns allow users to select a related person to view
    function populateRelatedSelect(selectElement, person, fieldNames) {
        // Clear the dropdown first
        selectElement.innerHTML = '';
        
        // Add an empty option as default (this is what shows when nothing is selected)
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '';
        selectElement.appendChild(emptyOption);
        
        // Add options for each related person (children, siblings, etc.)
        fieldNames.forEach(fieldName => {
            if (person[fieldName]) {
                // Create a new dropdown option
                const option = document.createElement('option');
                option.value = person[fieldName];      // Value when selected
                option.textContent = person[fieldName]; // Text shown in dropdown
                selectElement.appendChild(option);
            }
        });
        
        // Add event to respond when user selects an option
        selectElement.onchange = function() {
            if (this.value) { // If something was selected (not the empty option)
                // Find the selected person in our data
                const personData = allData.find(p => p.name === this.value);
                if (personData) {
                    showPersonDetails(personData); // Show that person's details
                }
                // Reset dropdown to empty after selection to allow re-selection
                this.value = '';
            }
        };
    }
    
    // Function to populate the pictures dropdown
    function populatePicturesSelect(selectElement, person) {
        // Clear the dropdown
        selectElement.innerHTML = '';
        
        // Add empty default option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '';
        selectElement.appendChild(emptyOption);
        
        // Add picture options (pic, pic2, pic3, etc.)
        ['pic', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6'].forEach(picField => {
            if (person[picField]) {
                const option = document.createElement('option');
                option.value = person[picField];
                option.textContent = person[picField];
                selectElement.appendChild(option);
            }
        });
        
        // Add event to show selected picture when chosen
        selectElement.onchange = function() {
            if (this.value) { // If a picture was selected
                showImage(this.value); // Display that image
            }
        };
    }
    
    // Function to show a selected image
    function showImage(imageFilename) {
        if (imageFilename) {
            // Set the image source
            primaryImage.src = `../img/${imageFilename}`;
            primaryImage.classList.remove('hidden'); // Show the image
            bioDisplay.classList.add('hidden');      // Hide bio when showing image
        }
    }
    
    // Function to load and display biography content from a separate file
    function loadBioContent(bioFilename) {
        if (bioFilename) {
            // Use fetch to load the biography text file
            fetch(`../bios/${bioFilename}`)
                .then(response => {
                    // If the file wasn't found, throw an error
                    if (!response.ok) {
                        throw new Error(`Bio file not found: ${bioFilename}`);
                    }
                    return response.text(); // Get the text content of the file
                })
                .then(bioText => {
                    // Show the biography text
                    bioDisplay.textContent = bioText; // Use textContent to preserve formatting
                    bioDisplay.classList.remove('hidden'); // Show the bio area
                    primaryImage.classList.add('hidden');   // Hide image when showing bio
                })
                .catch(error => {
                    // If there's an error, show an error message instead
                    console.error('Error loading bio:', error);
                    bioDisplay.textContent = `Bio file not found: ${bioFilename}`;
                    bioDisplay.classList.remove('hidden'); // Still show the error message
                    primaryImage.classList.add('hidden');   // Hide image when showing error
                });
        }
    }
    
    // Function to open a FamilySearch link in a new browser tab
    function openFamilySearchLink(famSrchLink) {
        if (famSrchLink) {
            // Open in new tab using window.open
            window.open(`https://www.familysearch.org/en/tree/person/details/${famSrchLink}`, '_blank');
        }
    }
    
    // Hide search suggestions when clicking outside the search box
    // This makes the interface cleaner by hiding suggestions when not needed
    document.addEventListener('click', function(e) {
        // If the click was not on the search input field
        if (e.target !== nameSearch) {
            nameSuggestions.style.display = 'none'; // Hide the suggestions
        }
    });
});
