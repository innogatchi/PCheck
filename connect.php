<?php
session_start();

error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pcheck";

// Create a MySQLi connection
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Handle POST requests (login and registration)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid request."]);
        exit;
    }

    $action = $input['action'];

    if ($action === 'login') {
        $username = $input['username'];
        $password = $input['password'];

        $stmt = $conn->prepare("SELECT id, firstname, lastname, password FROM customer WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->bind_result($customerId, $firstName, $lastName, $hashedPassword);
        $stmt->fetch();

        if ($hashedPassword && password_verify($password, $hashedPassword)) {
            $_SESSION['logged_in'] = true;
            $_SESSION['user_firstname'] = $firstName;
            $_SESSION['user_id'] = $customerId;
            echo json_encode([
                "success" => true,
                "message" => "Login successful.",
                "user_id" => $customerId,
                "full_name" => "$firstName $lastName",
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid username or password."]);
        }
        exit;
    } elseif ($action === 'register') {
        $firstName = $input['firstName'];
        $lastName = $input['lastName'];
        $username = $input['username'];
        $password = $input['password'];
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $conn->prepare("INSERT INTO customer (username, password, firstname, lastname) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $username, $hashedPassword, $firstName, $lastName);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Registration successful."]);
        } else {
            echo json_encode(["success" => false, "message" => "Registration failed."]);
        }
        exit;
    }
    elseif ($action === 'save') {
        $data = json_decode(file_get_contents("php://input"), true);
    
        $totalPrice = isset($data['totalPrice']) ? intval($data['totalPrice']) : 0;
        $energyUsage = isset($data['energyUsage']) ? intval($data['energyUsage']) : 0;
        $components = isset($data['components']) ? $data['components'] : [];
        $ownerId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
        if ($totalPrice <= 0) {
            echo json_encode(["success" => false, "message" => "Invalid total price."]);
            exit;
        }
    
        $query = "INSERT INTO pc (Total_Price, Date_Time, Energy_Usage, Owner_Name, Components) VALUES (?, NOW(), ?, ?, ?)";
        $stmt = $conn->prepare($query);
    
        if (!$stmt) {
            error_log("Prepare error: " . $conn->error);
            echo json_encode(["success" => false, "message" => "Prepare error: " . $conn->error]);
            exit;
        }
        $jsonComponents = json_encode($components);

        $stmt->bind_param("iiis", $totalPrice, $energyUsage, $ownerId, $jsonComponents);
    
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Build saved successfully!"]);
        } else {
            error_log("Execute error: " . $stmt->error);
            echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
        }
        exit;
    } else {
        echo json_encode(["success" => false, "message" => "Unknown action."]);
        exit;
    }
}

elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getSavedBuilds')
 {
    header('Content-Type: application/json'); // Set JSON header

    // Check if the user is logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in.']);
        exit;
    }

    $ownerId = $_SESSION['user_id'];

    // Fetch saved builds for the logged-in user
    $stmt = $conn->prepare("SELECT PC_ID, Total_Price, Date_Time, Owner_Name FROM pc WHERE Owner_Name = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $ownerId);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
        exit;
    }

    $result = $stmt->get_result();
    $builds = $result->fetch_all(MYSQLI_ASSOC);

    if (empty($builds)) {
        error_log("NO BUILDS FOUND");
        echo json_encode(['success' => true, 'builds' => []]); // Return empty array if no builds found
    } else {
        echo json_encode(['success' => true, 'builds' => $builds]);
    }
    exit;
}
elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'loadBuild') { 
    header('Content-Type: application/json'); // Set JSON header

    $buildId = $_GET['buildId'];
    if (!is_numeric($buildId)) {
        echo json_encode(['success' => false, 'message' => 'Invalid build ID.']);
        exit;
    }

    // Fetch the specific build
    $stmt = $conn->prepare("SELECT Components, Total_Price, Energy_Usage FROM pc WHERE PC_ID = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $buildId);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
        exit;
    }

    $result = $stmt->get_result();
    $build = $result->fetch_assoc();

    if ($build) {
        echo json_encode([
            'success' => true,
            'components' => json_decode($build['Components'], true), // Decode JSON string
            'totalPrice' => $build['Total_Price'],
            'energyUsage' => $build['Energy_Usage']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Build not found.']);
    }
    exit;
}

// Handle GET requests (fetching component data)
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['type'])) {
        $componentType = $_GET['type'];

        // Map the component type to the corresponding table name
        $tableMap = [
            'cooler' => 'cooler',
            'gpu' => 'gpu',
            'memory' => 'memory',
            'monitor' => 'monitor',
            'motherboard' => 'motherboard',
            'pc' => 'pc',
            'case' => 'pc_case',
            'psu' => 'power_supply',
            'processor' => 'processor',
            'storage' => 'storage',
            'mouse' => 'mouse',
            'keyboard' => 'keyboard',
            'headphone' => 'headphone'
        ];

        // Check if the component type is valid
        if (!array_key_exists($componentType, $tableMap)) {
            echo "<p>Invalid component type.</p>";
            exit;
        }

        $tableName = $tableMap[$componentType];

        // Fetch components from the database
        if($tableName=='cooler') 
            $stmt = $conn->prepare("SELECT Name, Brand, Price, Image FROM $tableName");

        elseif($tableName=='power_supply') 
            $stmt = $conn->prepare("SELECT Name, Price, Size, Image FROM $tableName");

        elseif($tableName=='memory') 
            $stmt = $conn->prepare("SELECT Name, Price, Energy_Usage, Size, Image FROM $tableName");
        
        elseif($tableName=='storage') 
            $stmt = $conn->prepare("SELECT Name, Price, Size, Image FROM $tableName");

        elseif($tableName=='gpu')
            $stmt = $conn->prepare("SELECT Name, Price, Energy_Usage, Image FROM $tableName"); 

        elseif($tableName=='processor')
            $stmt = $conn->prepare("SELECT Name, Price, Energy_Usage, Socket_Size, Image FROM $tableName"); 

        elseif($tableName=='motherboard')
            $stmt = $conn->prepare("SELECT Name, Price, Energy_Usage, Socket_Size, Size, Image FROM $tableName"); 

        elseif($tableName=='pc_case')
            $stmt = $conn->prepare("SELECT Name, Price, Size, Image FROM $tableName"); 

        else
            $stmt = $conn->prepare("SELECT Name, Price, Image FROM $tableName");

        $stmt->execute();
        $result = $stmt->get_result();

        $components = [];
        while ($row = $result->fetch_assoc()) {
            $components[] = $row;

            if (!empty($components['Image'])) {
                $components['Image'] = "data:image/png;base64," . base64_encode($components['Image']);
            } else {
                $components['Image'] = null; // Default if no image exists
            }
        }

        $displayName = [
            'cooler' => 'cooler',
            'gpu' => 'GPU',
            'memory' => 'memory',
            'monitor' => 'monitor',
            'motherboard' => 'motherboard',
            'pc_case' => 'case',
            'power_supply' => 'PSU',
            'processor' => 'processor',
            'storage' => 'storage',
        ];
        $defaulta = 0;
        $defaultb = null;

        // Generate HTML for the modal content
        if (!empty($components)) {
            if($tableName=='cooler') {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Brand:</strong> {$component['Brand']}</p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='power_supply')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$component['Size']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Power:</strong> {$component['Size']}W</p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='memory')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$component['Energy_Usage']}\",
                        \"{$component['Size']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Size:</strong> <span data-socket='{$component['Size']}'>{$component['Size']}</span></p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='storage')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$defaultb}\",
                        \"{$defaulta}\",
                        \"{$component['Size']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Size:</strong> <span data-socket='{$component['Size']}'>{$component['Size']}</span></p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='gpu')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$component['Energy_Usage']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Power:</strong> {$component['Energy_Usage']}W</p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='processor')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$component['Energy_Usage']}\",
                        \"{$component['Socket_Size']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Power:</strong> {$component['Energy_Usage']}W</p>
                            <p><strong>Socket:</strong> <span data-socket='{$component['Socket_Size']}'>{$component['Socket_Size']}</span></p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='motherboard')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$component['Energy_Usage']}\",
                        \"{$component['Socket_Size']}\",
                        \"{$component['Size']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Socket:</strong> <span data-socket='{$component['Socket_Size']}'>{$component['Socket_Size']}</span></p>
                            <p><strong>Size:</strong> <span data-size='{$component['Size']}'>{$component['Size']}</span></p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            elseif($tableName=='pc_case')
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\",
                        \"{$defaulta}\",
                        \"{$defaultb}\",
                        \"{$component['Size']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                            <p><strong>Size:</strong> <span data-size='{$component['Size']}'>{$component['Size']}</span></p>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
            else
            {
                foreach ($components as $component) {
                    if (!$component || !isset($component['Name'], $component['Price'])) {
                        continue; // Skip this iteration
                    }

                    $imageData = !empty($component['Image']) 
                        ? "data:image/png;base64," . base64_encode($component['Image']) 
                        : Null;
                
                    echo "
                    <div class='selection-item' onclick='selectComponent(
                        \"{$displayName[$tableName]}\", 
                        \"{$component['Name']}\", 
                        \"{$component['Price']}\"
                    )'>
                        <div class='item-info'>
                            <h3>{$component['Name']}</h3>
                        </div>
                        <img src='{$imageData}' alt='{$component['Name']}' class='component-thumbnail'>
                        <div class='item-price'>Php {$component['Price']}</div>
                    </div>
                    ";
                }
            }
        } else {
            echo "<p>No components found for this category.</p>";
        }
        exit;
    }
}

// Handle unsupported HTTP methods
else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed.",
        "requestedMethod" => $_SERVER['REQUEST_METHOD'],
        "queryString" => $_SERVER['QUERY_STRING'] ?? null,
        "phpInput" => file_get_contents('php://input'),
        "debug" => "Ensure all requests are POST when accessing this endpoint."
    ]);
    exit;
}
?>