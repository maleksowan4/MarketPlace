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
    echo json_encode(["status" => "ok", "service" => "wallet-service"]);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';

use WalletService\Middleware\JwtMiddleware;
use WalletService\Controllers\WalletController;

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

$walletController = new WalletController();
$jwtMiddleware = new JwtMiddleware();

// --- SAGA TRANSACTION ROUTES (Internal communication, no user token required) ---

if ($uri === '/api/wallet/pay' && $method === 'POST') {
    $walletController->pay($body);
} 
elseif ($uri === '/api/wallet/refund' && $method === 'POST') {
    $walletController->refund($body);
}

// --- PRIVATE CLIENT ROUTES (JWT Authentication Required) ---

else {
    // Authenticate token
    $currentUser = $jwtMiddleware->handle();

    if ($uri === '/api/wallet/balance' && $method === 'GET') {
        $walletController->getBalance($currentUser);
    } 
    elseif ($uri === '/api/wallet/deposit' && $method === 'POST') {
        $walletController->deposit($currentUser, $body);
    } 
    else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found"]);
    }
}
