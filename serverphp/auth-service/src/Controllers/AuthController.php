<?php
namespace AuthService\Controllers;

use AuthService\DTOs\RegisterDTO;
use AuthService\DTOs\LoginDTO;
use AuthService\Services\AuthService;
use Exception;

class AuthController {
    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    // 1. HTTP Endpoint for user registration
    public function register(array $body): void {
        try {
            // Instantiate DTO (automatically validates inputs)
            $dto = new RegisterDTO($body);

            // Pass DTO to Service
            $user = $this->authService->registerUser($dto);

            // Return success JSON
            http_response_code(201); // 201 Created
            echo json_encode([
                "message" => "user registered successfully",
                "user" => $user
            ]);
        } catch (Exception $e) {
            // Return validation or execution error
            http_response_code(400); // 400 Bad Request
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. HTTP Endpoint for user login
    public function login(array $body): void {
        try {
            // Instantiate DTO
            $dto = new LoginDTO($body);

            // Verify credentials & sign JWT
            $session = $this->authService->loginUser($dto);

            // Return success with JWT
            http_response_code(200); // 200 OK
            echo json_encode([
                "message" => "Login successful!",
                "token" => $session['token'],
                "user" => $session['user']
            ]);
        } catch (Exception $e) {
            // Handle incorrect credentials or blocks
            http_response_code(401); // 401 Unauthorized
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
