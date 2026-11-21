// Function to show specific sections
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
      section.classList.remove('active');
    });
  
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
  }
  
  // Explore button click handler
  function explore() {
    alert("Explore functionality coming soon!");
  }
  // Toggle password visibility
  function togglePasswordVisibility(id) {
    const field = document.getElementById(id);
    const icon = field.nextElementSibling;
    if (field.type === 'password') {
      field.type = 'text';
      icon.innerHTML = '&#128064;'; // Eye open
    } else {
      field.type = 'password';
      icon.innerHTML = '&#128065;'; // Eye closed
    }
  }

// Handle Login submission
function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Add your authentication logic here
  if (username && password) {
    alert(`Welcome back, ${username}!`);
    document.getElementById('login-modal').style.display = 'none';
    return false; // Prevent form submission
  } else {
    alert('Please fill in both fields.');
    return false;
  }
}

document.addEventListener("DOMContentLoaded", function() {
  // Handle Login submission
  function performLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Please fill in both fields.');
      return;
    }

    fetch('connect.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'login', 
        username: username, 
        password: password
      })
    })
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Response data:', data);
      if (data.success) {
        // Set the session variables and show the main screen
        alert('Login successful!');
        
        // Hide the login frame
        const loginFrame = document.getElementById('login-modal');
        const hero = document.getElementById('hero');
        
        if (loginFrame && hero) {
          loginFrame.style.display = 'none';
          hero.style.display = 'block';
        } else {
          console.error('Login frame or hero section not found!');
        }
      } else {
        alert(data.message || 'Login failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error during login:', error);
      alert(error);
    });
  }

  // Expose performLogin to global scope to be accessible in HTML
  window.performLogin = performLogin;
});

// Toggle password visibility
function togglePasswordVisibility(id) {
  const passwordField = document.getElementById(id);
  const toggleIcon = passwordField.nextElementSibling;

  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    toggleIcon.innerHTML = '&#128064;'; // Open eye icon
  } else {
    passwordField.type = 'password';
    toggleIcon.innerHTML = '&#128065;'; // Closed eye icon (optional alternative)
  }
}

// Handle Create Account submission
function handleCreateAccount() {
  
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const newUsername = document.getElementById('registerUsername').value;
  const newPassword = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const loginFrame = document.getElementById('login-modal');
  const reg = document.getElementById('create-account-modal');

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match. Please try again.');
    return false;
  }

  if (firstName && lastName && newUsername && newPassword) {
    alert(`Account created successfully for ${firstName} ${lastName}!`);
    fetch('connect.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'register',
        firstName: firstName,
        lastName: lastName,
        username: newUsername,
        password: newPassword
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        alert('Registration successful! You can now log in.');
        
      } else {
        alert(data.message || 'Registration failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error during registration:', error);
      alert('An error occurred during registration.');
    });
    showLogin(); // Redirect to login form
    return false;
  } else {
    alert('Please fill in all fields.');
    return false;
  }
}

function showCreateAccount() {
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('create-account-modal').style.display = 'flex'; // Use flex to ensure proper centering
}

function showLogin() {
  document.getElementById('create-account-modal').style.display = 'none';
  document.getElementById('login-modal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-modal').style.display = 'block'

});

function showHomeImage() {
  const picname = "homepc"; // Default image name
  fetch(`connect.php?loadHome=${picname}`)
      .then(response => response.json())
      .then(data => {
          const imgElement = document.querySelector('#dynamicImage');
          if (data && data.image) { // Access the 'image' property directly
              imgElement.src = `data:image/png;base64,${data.image}`; 
          } else {
              console.error('No image data found in response.');
          }
      })
      .catch(error => console.error('Error fetching image:', error));
}

const components = {
  processor: [
    { name: "AMD Ryzen 5 3600", cores: "6", clock: "3.6 GHz", boost: "4.2 GHz", tdp: "65W", graphics: "None" },
    { name: "Intel Core i9-14900K", cores: "24", clock: "3.2 GHz", boost: "6 GHz", tdp: "125W", graphics: "Intel UHD 770" }
  ],
  motherboard: [
    { name: "ASUS ROG STRIX B550-F", chipset: "B550", formFactor: "ATX" },
    { name: "MSI MAG B660M", chipset: "B660", formFactor: "Micro-ATX" }
  ]
};

let currentComponentType = ""; // Store the current component type
let componentItems = []; // Store fetched component items

function showSelection(componentType) {
    const modal = document.getElementById('selection-modal');
    const modalTitle = document.getElementById('modal-title');
    const selectionList = document.getElementById('selection-list');

    currentComponentType = componentType; // Store the selected component type
    modalTitle.textContent = `Select a ${componentType.toUpperCase()}`;
    selectionList.innerHTML = 'Loading...';

    fetch(`connect.php?type=${componentType}`)
        .then(response => response.text())
        .then(data => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            componentItems = Array.from(tempDiv.getElementsByClassName('selection-item'));
            applySorting(); // Apply sorting when data loads
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            selectionList.innerHTML = '<p>Failed to load components. Please try again later.</p>';
        });

    modal.style.display = 'block';
}

function applySorting() {
  const sortOption = document.getElementById("sort-options").value;
  let sortedItems = [...componentItems]; // Clone array to avoid modifying original

  if (sortOption === "price-asc") {
      sortedItems.sort((a, b) => getPrice(a) - getPrice(b));
  } else if (sortOption === "price-desc") {
      sortedItems.sort((a, b) => getPrice(b) - getPrice(a));
  } else if (sortOption === "socket" && (currentComponentType === "processor" || currentComponentType === "motherboard")) {
      sortedItems.sort((a, b) => getSocket(a).localeCompare(getSocket(b)));
  }

  // Clear & update selection list
  const selectionList = document.getElementById('selection-list');
  selectionList.innerHTML = "";
  sortedItems.forEach(item => selectionList.appendChild(item));
}

// Helper functions to extract values
function getPrice(item) {
  return parseFloat(item.querySelector('.item-price').textContent.replace('Php ', '').replace(',', ''));
}

function getSocket(item) {
  let socket = item.querySelector('[data-socket]');
  return socket ? socket.textContent.trim() : "";
}

function getSize(item) {
  let size = item.querySelector('[data-size]');
  return size ? size.textContent.trim() : "";
}

let totalPrice = 0;
let estimatedWattage = 0;
let powerSupplyWattage = 0;

// Define the correct order of components
const componentOrder = [
  "processor",
  "motherboard",
  "monitor",
  "memory",
  "storage",
  "GPU",
  "case",
  "PSU",
  "cooler",
  "mouse",
  "keyboard",
  "headphone"
];

// Object to store selected components and their properties
let selectedComponents = {};

function selectComponent(component, name, price, wattage = 0, socksize = "", size = "") {
  console.log("Received:", { component, name, price, wattage, socksize, size });

  if (selectedComponents[component]) {
    alert(`You have already selected a ${component}. Remove it first before selecting a new one.`);
    return;
  }

  price = parseFloat(price);
  wattage = wattage ? parseInt(wattage) : 0;

  // Compatibility Checks
  if (component === "motherboard" && selectedComponents["processor"]) {
    if (selectedComponents["processor"].socksize !== socksize) {
      alert("⚠️ Incompatible Socket Size! Your selected motherboard does not match the processor.");
      return;
    }
  }

  if (component === "Case" && selectedComponents["motherboard"]) {
    if (!isCompatibleCase(selectedComponents["motherboard"].size, size)) {
      alert("⚠️ Incompatible Case Size! The selected case is too small for your motherboard.");
      return;
    }
  }

  // Update total price
  totalPrice += price; // ✅ Fix: Add price when selecting a component

  // Special handling for PSU
  if (component === "PSU") {
    powerSupplyWattage = wattage;
  } else {
    estimatedWattage += wattage;
  }

  if (powerSupplyWattage > 0 && estimatedWattage > powerSupplyWattage) {
    alert("⚠️ Warning: Your total estimated wattage exceeds the power supply's capacity!");
  }

  selectedComponents[component] = { name, price, wattage, socksize, size };

  updateBuildDisplay();
  updateTotalPrice();
  updateEstimatedWattage();
  closeModal();
}


// Function to check case-motherboard compatibility
function isCompatibleCase(motherboardSize, caseSize) {
  const compatibility = {
    "Mini-ITX": ["Mini-ITX", "Micro-ATX", "Mid Tower", "Full Tower"],
    "Micro-ATX": ["Micro-ATX", "Mid Tower", "Full Tower"],
    "ATX": ["Mid Tower", "Full Tower"],
    "E-ATX": ["Full Tower"]
  };

  return compatibility[motherboardSize]?.includes(caseSize) || false;
}

function updateBuildDisplay() {
  const currentBuild = document.getElementById("product-list");
  currentBuild.innerHTML = "";

  componentOrder.forEach((component) => {
    if (selectedComponents[component]) {
      const { name, price } = selectedComponents[component];

      const div = document.createElement("div");
      div.classList.add("product-item");

      div.innerHTML = `
        <p><strong>${capitalizeFirstLetter(component)}:</strong> ${name} - Php ${price.toLocaleString('en-US')}</p>
        <button class="remove-btn" onclick="removeComponent('${component}')">✖</button>
      `;

      currentBuild.appendChild(div);
    }
  });
}

function removeComponent(component) {
  if (selectedComponents[component]) {
    totalPrice -= selectedComponents[component].price;

    if (component === "PSU") {
      powerSupplyWattage = 0;
    } else {
      estimatedWattage -= selectedComponents[component].wattage;
    }

    delete selectedComponents[component];

    updateBuildDisplay();
    updateTotalPrice();
    updateEstimatedWattage();
  }
}

function updateTotalPrice() {
  document.getElementById("total-price").innerHTML = `<p><strong>Price:</strong> Php ${totalPrice.toLocaleString('en-US')}</p>`;
}

function updateEstimatedWattage() {
  let wattageText = powerSupplyWattage > 0 
    ? `Estimated Usage: ${estimatedWattage}W / PSU Capacity: ${powerSupplyWattage}W` 
    : `Estimated Usage: ${estimatedWattage}W`;

  document.getElementById("estimated-wattage").innerHTML = `<p><strong>Power Consumption:</strong> ${wattageText}</p>`;
}

function closeModal() {
  const modal = document.getElementById('selection-modal');
  modal.style.display = 'none';
}


function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showSection(sectionId) {
  // Hide all sections
  document.getElementById('hero').style.display = 'none';
  document.getElementById('build-pc').style.display = 'none';
  document.getElementById('pre-built').style.display = 'none';

  // Show the selected section
  document.getElementById(sectionId).style.display = 'block';
}

function explore() {
  showSection('build-pc');
}

document.addEventListener("DOMContentLoaded", function() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  // Check if dark mode is enabled in localStorage
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';

  // Apply dark mode if it was enabled
  if (isDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
  }

  // Toggle dark mode on button click
  darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');

    // Save the user's preference in localStorage
    if (isDarkMode) {
      localStorage.setItem('darkMode', 'enabled');
      darkModeToggle.textContent = '☀️';
    } else {
      localStorage.setItem('darkMode', 'disabled');
      darkModeToggle.textContent = '🌙';
    }
  });
});

// Function to open the pre-built modal
function showPreBuiltModal(type) {
  const modal = document.getElementById('pre-built-modal');
  const modalTitle = document.getElementById('pre-built-modal-title');
  const modalContent = document.getElementById('pre-built-modal-content');

  // Set the modal title based on the type
  modalTitle.textContent = type === 'gaming' ? 'Gaming PCs' : 'Productivity PCs';

  // Clear existing content
  modalContent.innerHTML = 'Loading...';

  // Simulate fetching data (replace with actual data fetching logic)
  setTimeout(() => {
      const preBuiltPCs = type === 'gaming' ? [
          {
              name: "INTEL CORE i7 12700",
              brand: "GTX 1660 SUPER",
              specs: ["16GB DDR4 RAM", "500GB SSD Storage", "500W Power Supply", "PC Case M-ATX"],
              price: "₱32,495"
          },
          {
              name: "AMD RYZEN 7 5800X",
              brand: "RX 6600",
              specs: ["32GB DDR4 RAM", "1TB SSD Storage", "750W Power Supply", "PC Case ATX"],
              price: "₱45,000"
          },
          {
              name: "INTEL CORE i9 12900",
              brand: "RTX 4090 TI",
              specs: ["64GB DDR4 RAM", "2TB SSD Storage", "1000W Power Supply", "PC Case Full Tower"],
              price: "₱60,000"
          },
          {
              name: "AMD RYZEN 9 7900X",
              brand: "RTX 5060",
              specs: ["128GB DDR4 RAM", "4TB SSD Storage", "1200W Power Supply", "PC Case E-ATX"],
              price: "₱75,000"
          }
      ] : [
          {
              name: "INTEL CORE i7 12700",
              brand: "GTX 1050",
              specs: ["32GB DDR4 RAM", "1TB SSD Storage", "600W Power Supply", "PC Case ATX"],
              price: "₱28,495"
          },
          {
              name: "INTEL CORE i3 12700",
              brand: "GTX 1650",
              specs: ["64GB DDR4 RAM", "2TB SSD Storage", "550W Power Supply", "PC Case ATX"],
              price: "₱35,000"
          },
          {
              name: "RYZEN 5 5600G",
              brand: "RTX 2060",
              specs: ["128GB DDR4 RAM", "4TB SSD Storage", "700W Power Supply", "PC Case Full Tower"],
              price: "₱50,000"
          },
          {
              name: "INTEL CORE i7 12700",
              brand: "RTX 3050 TI",
              specs: ["256GB DDR4 RAM", "8TB SSD Storage", "700W Power Supply", "PC Case E-ATX"],
              price: "₱65,000"
          }
      ];

      // Generate button-box elements for each pre-built PC
      const buttonBoxes = preBuiltPCs.map(pc => `
          <div class="pre-built-button-box" onclick="selectPreBuilt('${pc.name}', '${pc.price}')">
              <div class="text">
                  <h2>${pc.name}</h2>
                  <p><strong>Graphics Card:</strong> ${pc.brand}</p>
                  <p><strong>Specifications:</strong></p>
                  <ul>
                      ${pc.specs.map(spec => `<li>${spec}</li>`).join('')}
                  </ul>
                  <p><strong>Price:</strong> ${pc.price}</p>
              </div>
          </div>
      `).join('');

      // Wrap button-boxes in a grid container
      modalContent.innerHTML = `
          <div class="button-box-container", display: grid; grid-template-columns: repeat(2, 1fr);>
              ${buttonBoxes}
          </div>
          <div style="text-align: center; margin-top: 20px;">
              <button onclick="closePreBuiltModal()">Close</button>
          </div>
      `;
  }, 500); // Simulate a delay for fetching data

  // Show the modal
  modal.style.display = 'block';
}

// Function to handle pre-built selection
function selectPreBuilt(name, price) {
  alert(`Selected: ${name} (${price})`);
  closePreBuiltModal();
}

// Function to close the pre-built modal
function closePreBuiltModal() {
  const modal = document.getElementById('pre-built-modal');
  modal.style.display = 'none';
}

// aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

document.getElementById("view-summary-btn").addEventListener("click", openSummaryModal);

function openSummaryModal() {
    const summaryDetails = document.getElementById("summary-details");
    summaryDetails.innerHTML = ""; // Clear previous content

    if (Object.keys(selectedComponents).length === 0) {
        summaryDetails.innerHTML = "<p>No components selected.</p>";
    } else {
        Object.entries(selectedComponents).forEach(([component, details]) => {
            const div = document.createElement("div");
            div.classList.add("summary-item");
            div.innerHTML = `
                <p><strong>${capitalizeFirstLetter(component)}:</strong> ${details.name}</p>
                <p><strong>Price:</strong> Php ${details.price.toLocaleString()}</p>
                <p><strong>Wattage:</strong> ${details.wattage}W</p>
                <hr>
            `;
            summaryDetails.appendChild(div);
        });

        summaryDetails.innerHTML += `
            <p><strong>Total Price:</strong> Php ${totalPrice.toLocaleString()}</p>
            <p><strong>Estimated Power Consumption:</strong> ${estimatedWattage}W / PSU Capacity: ${powerSupplyWattage}W</p>
        `;
    }

    document.getElementById("summary-modal").style.display = "block";
}

function closeSummaryModal() {
    document.getElementById("summary-modal").style.display = "none";
}

// Close modal if clicked outside content
window.onclick = function(event) {
    const modal = document.getElementById("summary-modal");
    if (event.target === modal) {
        closeSummaryModal();
    }
};

function saveBuild() {
  const buildData = {
      totalPrice: parseInt(totalPrice),
      energyUsage: parseInt(estimatedWattage),
      components: selectedComponents
  };

  console.log("🔹 Sending Data:", buildData); // Debugging log

  fetch("connect.php", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        action: 'save',
        ...buildData
      })
  })
  .then(response => response.json()) 
  .then(data => console.log("🔹 Server Response:", data))
  .catch(error => console.error("🔴 Error:", error));
}

function viewSavedBuilds() {
  fetch('connect.php?action=getSavedBuilds', { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
  })
  .then(response => {
      console.log("Response Status:", response.status);
      return response.json();
  })
  .then(data => {
      console.log("Fetched Data:", data);

      if (data.success) {
          displaySavedBuilds(data.builds);
      } else {
          console.error("Server Error:", data.message);
          alert(`Error: ${data.message}`);
      }
  })
  .catch(error => {
      console.error("Fetch Error:", error);
      alert(`An error occurred: ${error.message}`);
  });
}

function displaySavedBuilds(builds) {
  console.log("Fetched Builds:", builds); // Debugging

  let buildsHtml = '<h3>Saved Builds</h3>';
  if (builds.length === 0) {
      buildsHtml += '<p>No saved builds found.</p>';
  } else {
      builds.forEach((build, index) => {
          buildsHtml += `
              <div class="saved-build-item" onclick="loadBuild(${build.PC_ID})">
                  <p>Build ${index + 1} - Owner: ${build.Owner_Name} - Price: ${build.Total_Price}</p>
                  <p>Date: ${build.Date_Time}</p>
              </div>
          `;
      });
  }

  // Insert content & show modal
  const modalContent = document.getElementById('savedBuildsModalContent');
  if (modalContent) {
      modalContent.innerHTML = buildsHtml;
  } else {
      console.error("Element with ID 'savedBuildsModalContent' not found.");
      return;
  }

  document.getElementById('savedBuildsModal').classList.add('show');
  document.getElementById('savedBuildsModal').style.display = 'block';
  
}

function loadBuild(buildId) {
  fetch('connect.php?action=loadBuild&buildId=' + buildId, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          console.log("Loaded build data:", data);

          // Reset current selections
          selectedComponents = {};
          totalPrice = 0;
          estimatedWattage = 0;

          // Parse components (Ensure it's an object)
          let components = typeof data.components === "string" ? JSON.parse(data.components) : data.components;

          // Loop through and add components like selectComponent()
          for (let component in components) {
              let { name, price, wattage, socksize, size } = components[component];

              price = parseFloat(price);
              wattage = wattage ? parseInt(wattage) : 0;

              selectedComponents[component] = { name, price, wattage, socksize, size };
              totalPrice += price;
              estimatedWattage += wattage;
          }

          // Update UI like selectComponent()
          updateBuildDisplay();
          updateTotalPrice();
          updateEstimatedWattage();

          console.log("Updated components:", selectedComponents);

          // Hide modal without jQuery
          document.getElementById('savedBuildsModal').classList.remove('show');
          document.getElementById('savedBuildsModal').style.display = 'none';
      } else {
          alert(data.message);
      }
  })
  .catch(error => {
      console.error("Error loading build", error);
      alert('An error occurred loading the build');
  });
}

function loadComponents(components) {
  console.log(components); // ✅ Already an object
  // Use `components` directly without parsing
}
