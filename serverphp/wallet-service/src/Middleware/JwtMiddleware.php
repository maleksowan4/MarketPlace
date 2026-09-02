<?php
namespace WalletService\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtMiddleware {
    private string $jwtSecret;

    public function __construct() {
        $this->jwtSecret = getenv('JWT_SECRET') ?: "YOUR_SHARED_SECRET_KEY";
    }

    public function handle(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
            http_response_code(401);
            echo json_encode(["message" => "access Denied. no token is provided"]);
            exit();
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return (array)$decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(["message" => "Invalid Token: " . $e->getMessage()]);
            exit();
        }
    }
}
