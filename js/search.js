//	info_id last_name	first_name	mi	suff	bio	father	mother	spouse	child1	child2	child3	child4	child5	child6	sib1	sib2	sib3	sib4	sib5	sib6	birthplace	born died buried	pic	pic2	pic3	pic4	pic5	pic6	famSrchLink

document.addEventListener('DOMContentLoaded', function() {
    let allData = [];
    let filteredData = [];
    
    const nameSearch = document.getElementById('nameSearch');
    const nameSuggestions = document.getElementById('nameSuggestions');
    
    // Get all field display elements
    const infoId = document.getElementById('infoId');
    const fullName = document.getElementById('fullName');
    const bio = document.getElementById('bio');
    const father = document.getElementById('father');
    const mother = document.getElementById('mother');
    const spouse = document.getElementById('spouse');
    const birthplace = document.getElementById('birthplace');
    const born = document.getElementById('born');
    const died = document.getElementById('died');
    const buried = document.getElementById('buried');
    const familySearchLink = document.getElementById('familySearchLink');
    const childrenSelect = document.getElementById('children');
    const siblingsSelect = document.getElementById('siblings');
    const picturesSelect = document.getElementById('pictures');
    const primaryImage = document.getElementById('primaryImage');
    const bioDisplay = document.getElementById('bioDisplay');
    const bioContentDisplay = document.getElementById('bioContentDisplay');
    
    // Modal elements
    const imageView = document.getElementById('imageView');
    const imageDisplay = document.getElementById('imageDisplay');
    const bioView = document.getElementById('bioView');
    const bioContent = document.getElementById('bioContent');
    const closeImage = document.getElementById('closeImage');
    const closeBio = document.getElementById('closeBio');
    
    // Load data from JSON file
    fetch('../data/infotable.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            filteredData = [...allData];
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
    
    // Handle input for name search
    nameSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            nameSuggestions.style.display = 'none';
            return;
        }
        
        // Filter data based on search term
        filteredData = allData.filter(item => 
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item.first_name && item.first_name.toLowerCase().includes(searchTerm)) ||
            (item.last_name && item.last_name.toLowerCase().includes(searchTerm))
        );
        
        // Show suggestions
        showNameSuggestions(filteredData, searchTerm);
    });
    
    // Function to show name suggestions
    function showNameSuggestions(data, searchTerm) {
        nameSuggestions.innerHTML = '';
        
        if (data.length === 0) {
            nameSuggestions.style.display = 'none';
            return;
        }
        
        // Limit to first 10 suggestions
        const suggestionsToShow = data.slice(0, 10);
        
        suggestionsToShow.forEach(item => {
            const suggestion = document.createElement('div');
            suggestion.className = 'name-suggestion';
            suggestion.textContent = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim();
            suggestion.addEventListener('click', function() {
                nameSearch.value = '';
                nameSuggestions.style.display = 'none';
                
                // Show the selected person's data in the details view
                showPersonDetails(item);
            });
            
            nameSuggestions.appendChild(suggestion);
        });
        
        nameSuggestions.style.display = 'block';
    }
    
    // Function to show person details in the new layout
    function showPersonDetails(person) {
        // Populate non-select fields
        infoId.textContent = person.id || '';
        
        // Format the name field as 'Last Name, First Name Middle Initial. Suffix.'
        const nameParts = [];
        if (person.last_name) nameParts.push(person.last_name);
        nameParts.push(','); // Always add the comma
        if (person.first_name) nameParts.push(person.first_name);
        if (person.mi) nameParts.push(person.mi);
        if (person.suff) nameParts.push(person.suff + '.');
        
        const formattedName = nameParts.join(' ').replace(', ,', ',').trim();
        fullName.textContent = formattedName;
        
        // Set up bio field with click functionality
        if (person.bio) {
            bio.textContent = person.bio;
            bio.style.cursor = 'pointer';
            bio.style.textDecoration = 'underline';
            bio.style.color = '#007bff';
            bio.onclick = () => loadBioContent(person.bio);
        } else {
            bio.textContent = '';
            bio.onclick = null;
        }
        
        // Set up clickable fields for Father, Mother, Spouse
        setupClickableField(father, person.father);
        setupClickableField(mother, person.mother);
        setupClickableField(spouse, person.spouse);
        
        birthplace.textContent = person.birthplace || '';
        born.textContent = person.born || '';
        died.textContent = person.died || '';
        buried.textContent = person.buried || '';
        
        // Set up Family Search Link with click functionality
        if (person.famSrchLink) {
            familySearchLink.textContent = person.famSrchLink;
            familySearchLink.style.cursor = 'pointer';
            familySearchLink.style.textDecoration = 'underline';
            familySearchLink.style.color = '#007bff';
            familySearchLink.onclick = () => openFamilySearchLink(person.famSrchLink);
        } else {
            familySearchLink.textContent = '';
            familySearchLink.onclick = null;
        }
        
        // Populate children dropdown with click functionality
        populateRelatedSelect(childrenSelect, person, ['child1', 'child2', 'child3', 'child4', 'child5', 'child6']);
        
        // Populate siblings dropdown with click functionality
        populateRelatedSelect(siblingsSelect, person, ['sib1', 'sib2', 'sib3', 'sib4', 'sib5', 'sib6']);
        
        // Populate pictures dropdown
        populatePicturesSelect(picturesSelect, person);
        
        // Display primary image from 'pic' field if it exists
        displayPrimaryImage(person.pic);
    }
    
    // Function to display the primary image from the 'pic' field
    function displayPrimaryImage(picFilename) {
        if (picFilename) {
            primaryImage.src = `../img/${picFilename}`;
            // Show the image after it loads to avoid showing broken image icon
            primaryImage.onload = function() {
                primaryImage.classList.remove('hidden');
                bioDisplay.classList.add('hidden'); // Hide bio when showing image
            };
            primaryImage.onerror = function() {
                // Hide the container if image fails to load
                primaryImage.classList.add('hidden');
            };
        } else {
            primaryImage.classList.add('hidden');
            bioDisplay.classList.add('hidden'); // Ensure bio is also hidden when there's no primary image
        }
    }
    
    // Function to set up a clickable field that will load another person's details when clicked
    function setupClickableField(element, name) {
        if (name) {
            element.textContent = name;
            element.style.cursor = 'pointer';
            element.style.textDecoration = 'underline';
            element.style.color = '#007bff';
            
            element.onclick = function() {
                // Find the person in the data with matching name
                const personData = allData.find(p => p.name === name);
                if (personData) {
                    showPersonDetails(personData);
                }
                // Do nothing if the person is not found
            };
        } else {
            element.textContent = '';
            element.onclick = null;
        }
    }
    
    // Function to populate related fields dropdown (children, siblings)
    function populateRelatedSelect(selectElement, person, fieldNames) {
        selectElement.innerHTML = '';
        
        // Add empty option as default
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '';
        selectElement.appendChild(emptyOption);
        
        // Add existing values
        fieldNames.forEach(fieldName => {
            if (person[fieldName]) {
                const option = document.createElement('option');
                option.value = person[fieldName];
                option.textContent = person[fieldName];
                selectElement.appendChild(option);
            }
        });
        
        // Add change event to load person's details when an option is selected
        selectElement.onchange = function() {
            if (this.value) {
                // Find the person in the data with matching name
                const personData = allData.find(p => p.name === this.value);
                if (personData) {
                    showPersonDetails(personData);
                }
                // Reset to empty after selection to allow re-selection
                this.value = '';
            }
        };
    }
    
    // Function to populate pictures dropdown
    function populatePicturesSelect(selectElement, person) {
        selectElement.innerHTML = '';
        
        // Add empty option as default
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '';
        selectElement.appendChild(emptyOption);
        
        // Add picture values
        ['pic', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6'].forEach(picField => {
            if (person[picField]) {
                const option = document.createElement('option');
                option.value = person[picField];
                option.textContent = person[picField];
                selectElement.appendChild(option);
            }
        });
        
        // Add event listener to show image when picture is selected
        selectElement.onchange = function() {
            if (this.value) {
                showImage(this.value);
            }
        };
    }
    
    // Function to show image in the right area
    function showImage(imageFilename) {
        if (imageFilename) {
            primaryImage.src = `../img/${imageFilename}`;
            primaryImage.classList.remove('hidden');
            bioDisplay.classList.add('hidden'); // Hide bio when showing image
        }
    }
    
    // Function to load bio content in the right area
    function loadBioContent(bioFilename) {
        if (bioFilename) {
            fetch(`../bios/${bioFilename}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Bio file not found: ${bioFilename}`);
                    }
                    return response.text();
                })
                .then(bioText => {
                    bioContentDisplay.innerHTML = bioText;
                    bioDisplay.classList.remove('hidden');
                    primaryImage.classList.add('hidden'); // Hide primary image when showing bio
                })
                .catch(error => {
                    console.error('Error loading bio:', error);
                    bioContentDisplay.innerHTML = `Bio file not found: ${bioFilename}`;
                    bioDisplay.classList.remove('hidden');
                    primaryImage.classList.add('hidden'); // Hide primary image when showing bio
                });
        }
    }
    
    // Function to open Family Search Link in new tab
    function openFamilySearchLink(famSrchLink) {
        if (famSrchLink) {
            window.open(`https://www.familysearch.org/en/tree/person/details/${famSrchLink}`, '_blank');
        }
    }
    
    // Close modal handlers
    closeImage.addEventListener('click', function() {
        imageView.classList.add('hidden');
    });
    
    closeBio.addEventListener('click', function() {
        bioView.classList.add('hidden');
    });
    
    // Hide modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === imageView) {
            imageView.classList.add('hidden');
        }
        if (event.target === bioView) {
            bioView.classList.add('hidden');
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== nameSearch) {
            nameSuggestions.style.display = 'none';
        }
    });
});
