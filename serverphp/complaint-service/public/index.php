<?php
$corsOrigin = getenv('CORS_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: $corsOrigin");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Health check endpoint (public)
if ($uri === '/health' || $uri === '/api/health') {
    http_response_code(200);
    echo json_encode(["status" => "ok", "service" => "complaint-service"]);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';

use ComplaintService\Middleware\JwtMiddleware;
use ComplaintService\Controllers\ComplaintController;

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

$complaintController = new ComplaintController();
$jwtMiddleware = new JwtMiddleware();

// --- ALL ROUTES IN COMPLAINT SERVICE REQUIRE JWT LOGIN ---

// Authenticate token. If missing/invalid, middleware will reject and terminate.
$currentUser = $jwtMiddleware->handle();

if ($uri === '/api/complaints' && $method === 'POST') {
    $complaintController->create($currentUser, $body);
} 
elseif ($uri === '/api/complaints' && $method === 'GET') {
    $roleId = $currentUser['roleId'] ?? 0;
    if ($roleId === 1) {
        $complaintController->getComplaints($currentUser);
    } else {
        $complaintController->getMyComplaints($currentUser);
    }
} 
elseif ($uri === '/api/complaints/resolve' && $method === 'POST') {
    $complaintController->resolve($currentUser, $body);
} 
else {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint not found"]);
}
