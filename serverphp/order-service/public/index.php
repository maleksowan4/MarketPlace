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
    echo json_encode(["status" => "ok", "service" => "order-service"]);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';

use OrderService\Middleware\JwtMiddleware;
use OrderService\Controllers\OrderController;

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

$orderController = new OrderController();
$jwtMiddleware = new JwtMiddleware();

// --- ALL ROUTES IN ORDER SERVICE REQUIRE JWT LOGIN ---

// Authenticate token. If missing/invalid, middleware will reject and terminate.
$currentUser = $jwtMiddleware->handle();

if ($uri === '/api/orders' && $method === 'POST') {
    $orderController->placeOrder($currentUser, $body);
} 
elseif ($uri === '/api/orders' && $method === 'GET') {
    $orderController->getMyOrders($currentUser);
} 
elseif ($uri === '/api/orders/seller' && $method === 'GET') {
    $orderController->getSellerOrders($currentUser);
}
elseif ($uri === '/api/orders/seller/incoming' && $method === 'GET') {
    $orderController->getSellerIncomingOrders($currentUser);
}
elseif ($uri === '/api/orders/seller/stats' && $method === 'GET') {
    $orderController->getSellerStats($currentUser);
}
// Match PUT /api/orders/:id/accept (e.g. /api/orders/45/accept)
elseif (preg_match('#^/api/orders/([0-9]+)/accept$#', $uri, $matches) && $method === 'PUT') {
    $orderId = (int)$matches[1];
    $orderController->acceptOrder($orderId, $currentUser);
}
// Match GET /api/orders/:id (e.g. /api/orders/45)
elseif (preg_match('#^/api/orders/([0-9]+)$#', $uri, $matches) && $method === 'GET') {
    $orderId = (int)$matches[1];
    $orderController->getOrderById($orderId, $currentUser);
} 
else {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint not found"]);
}
