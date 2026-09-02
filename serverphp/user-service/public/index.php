<?php
// Set response headers for JSON and CORS support
$corsOrigin = getenv('CORS_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: $corsOrigin");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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
    echo json_encode(["status" => "ok", "service" => "user-service"]);
    exit();
}

// 1. Load Composer Autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use UserService\Middleware\JwtMiddleware;
use UserService\Controllers\ProfileController;
use UserService\Controllers\ShopController;

// 3. Read JSON request body
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

// 4. Initialize Controllers and Middleware
$profileController = new ProfileController();
$shopController = new ShopController();
$jwtMiddleware = new JwtMiddleware();

// 5. Routing Rules

// --- PUBLIC ROUTES (No Login Required) ---

if ($uri === '/api/shops' && $method === 'GET') {
    $shopController->getAllShops();
} 
// Match GET /api/shops/:id (e.g. /api/shops/1004)
elseif (preg_match('#^/api/shops/([0-9]+)$#', $uri, $matches) && $method === 'GET') {
    $shopId = (int)$matches[1];
    $shopController->getShopById($shopId);
} 
// Match GET /api/users/:id (e.g. /api/users/15)
elseif (preg_match('#^/api/users/([0-9]+)$#', $uri, $matches) && $method === 'GET') {
    $userId = (int)$matches[1];
    $profileController->getProfileById($userId);
}

// --- PRIVATE ROUTES (JWT Authentication Required) ---

else {
    // Validate token first. If invalid, middleware will reject and terminate the request.
    $currentUser = $jwtMiddleware->handle();

    if ($uri === '/api/users/profile' && $method === 'GET') {
        $profileController->getMyProfile($currentUser);
    } 
    elseif ($uri === '/api/users' && $method === 'GET') {
        $profileController->getAllUsers($currentUser);
    } 
    elseif ($uri === '/api/admin/sellers' && $method === 'GET') {
        $profileController->getSellers($currentUser);
    } 
    elseif ($uri === '/api/admin/buyers' && $method === 'GET') {
        $profileController->getBuyers($currentUser);
    } 
    elseif ($uri === '/api/admin/users/block' && $method === 'PUT') {
        $profileController->blockUser($currentUser, $body);
    } 
    elseif ($uri === '/api/shops/my-shop-details' && $method === 'GET') {
        $shopController->getMyShop($currentUser);
    } 
    elseif ($uri === '/api/shops/my-shop' && $method === 'PUT') {
        $shopController->updateMyShop($currentUser, $body);
    } 
    elseif ($uri === '/api/admin/shops/block' && $method === 'PUT') {
        $shopController->blockShop($currentUser, $body);
    } 
    else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found"]);
    }
}
