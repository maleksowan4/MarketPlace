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

// Health check endpoint
if ($uri === '/health' || $uri === '/api/health') {
    http_response_code(200);
    echo json_encode(["status" => "ok", "service" => "product-service"]);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';

use ProductService\Middleware\JwtMiddleware;
use ProductService\Controllers\ProductController;

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = array_merge($body, $_POST);
}

$productController = new ProductController();
$jwtMiddleware = new JwtMiddleware();

// --- PUBLIC ROUTES (No Login Required) ---

if ($uri === '/api/products' && $method === 'GET') {
    $productController->getAllProducts();
} 
// Match GET /api/products/shop/:shopId (e.g. /api/products/shop/1004?page=1&limit=5)
elseif (preg_match('#^/api/products/shop/([0-9]+)$#', $uri, $matches) && $method === 'GET') {
    $shopId = (int)$matches[1];
    
    // Parse query parameters (?page=1&limit=5) from URL query string
    $queryString = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '';
    parse_str($queryString, $queryParams);
    
    $productController->getProductsByShop($shopId, $queryParams);
} 
// Match GET /api/products/:id (e.g. /api/products/20)
elseif (preg_match('#^/api/products/([0-9]+)$#', $uri, $matches) && $method === 'GET') {
    $productId = (int)$matches[1];
    $productController->getProductById($productId);
} 

// --- SAGA TRANSACTION ROUTES (Internal communication, no user token required) ---

elseif ($uri === '/api/products/reserve' && $method === 'POST') {
    $productController->reserveStock($body);
} 
elseif ($uri === '/api/products/release' && $method === 'POST') {
    $productController->releaseStock($body);
}

// --- PRIVATE ROUTES (JWT Authentication Required) ---

else {
    // Authenticate token
    $currentUser = $jwtMiddleware->handle();

    if ($uri === '/api/products/seller' && $method === 'GET') {
        $productController->getMyProducts($currentUser);
    } 
    elseif ($uri === '/api/products' && $method === 'POST') {
        $productController->createProduct($currentUser, $body);
    } 
    // Match PUT /api/products/:id
    elseif (preg_match('#^/api/products/([0-9]+)$#', $uri, $matches) && $method === 'PUT') {
        $productId = (int)$matches[1];
        $productController->updateProduct($productId, $currentUser, $body);
    } 
    // Match DELETE /api/products/:id
    elseif (preg_match('#^/api/products/([0-9]+)$#', $uri, $matches) && $method === 'DELETE') {
        $productId = (int)$matches[1];
        $productController->deleteProduct($productId, $currentUser);
    } 
    else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found"]);
    }
}
