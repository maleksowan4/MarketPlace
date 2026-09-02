<?php
// Set response headers for JSON and CORS support
$corsOrigin = getenv('CORS_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: $corsOrigin");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests from browsers
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Retrieve URL Path and HTTP Method
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Health check endpoint
if ($uri === '/health' || $uri === '/api/health') {
    http_response_code(200);
    echo json_encode(["status" => "ok", "service" => "auth-service"]);
    exit();
}

// 1. Load Composer Autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use AuthService\Controllers\AuthController;

// 3. Read and decode JSON request body
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

// 4. Initialize Controller
$controller = new AuthController();

// 5. Route mapping
if ($uri === '/api/users/login' && $method === 'POST') {
    $controller->login($body);
} elseif ($uri === '/api/users' && $method === 'POST') {
    $controller->register($body);
} else {
    // Return 404 if the endpoint or method doesn't exist
    http_response_code(404);
    echo json_encode(["message" => "Endpoint not found"]);
}
