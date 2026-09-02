<?php
namespace UserService\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtMiddleware {
    private string $jwtSecret;

    public function __construct() {
        $this->jwtSecret = getenv('JWT_SECRET') ?: "YOUR_SHARED_SECRET_KEY";
    }

    // Validates the token and returns the decoded user payload
    public function handle(): array {
        // 1. Get all request headers
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
            http_response_code(401);
            echo json_encode(["message" => "access Denied. no token is provided"]);
            exit(); // Terminate request immediately
        }

        // 2. Extract token from "Bearer <TOKEN>"
        $token = substr($authHeader, 7);

        try {
            // 3. Decode and verify the token signature
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            // Return token payload as associative array
            return (array)$decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(["message" => "Invalid Token: " . $e->getMessage()]);
            exit();
        }
    }
}
