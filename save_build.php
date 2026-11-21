<?php
header("Content-Type: application/json");
require 'connect.php';

session_start();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid request: No data received."]);
    exit;
}

$totalPrice = isset($data['totalPrice']) ? $data['totalPrice'] : 0;
$energyUsage = isset($data['energyUsage']) ? $data['energyUsage'] : 0;
$components = isset($data['components']) ? $data['components'] : []; //use the array directly.
$ownerName = isset($_SESSION['user_firstname']) ? $_SESSION['user_firstname'] : "Unknown";

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

$stmt->bind_param("disss", $totalPrice, $energyUsage, $ownerName, json_encode($components)); //encode the array into a json string.

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Build saved successfully!"]);
} else {
    error_log("Execute error: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>