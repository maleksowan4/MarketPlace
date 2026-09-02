<?php
namespace AuthService\Services;

use AuthService\DTOs\RegisterDTO;
use AuthService\DTOs\LoginDTO;
use AuthService\Repositories\UserRepository;
use Firebase\JWT\JWT;
use Exception;

class AuthService {
    private UserRepository $userRepository;
    private string $jwtSecret;

    public function __construct() {
        $this->jwtSecret = getenv('JWT_SECRET') ?: "YOUR_SHARED_SECRET_KEY";
        $this->userRepository = new UserRepository();
    }

    // 1. Handles registration logic
    public function registerUser(RegisterDTO $dto): array {
        // Check if user already exists
        $existingUser = $this->userRepository->getUserByEmail($dto->email);
        if ($existingUser) {
            throw new Exception("Email is already registered.");
        }

        // Map string roles to database integer role IDs
        // 1: Admin, 2: Seller, 3: Buyer
        $roleId = 3; // Default to Buyer
        if ($dto->role === 'seller') {
            $roleId = 2;
        } elseif ($dto->role === 'admin') {
            $roleId = 1;
        }

        // Hash password securely
        $passwordHash = password_hash($dto->password, PASSWORD_BCRYPT);

        // Call repository to save user
        $user = $this->userRepository->createUser(
            $dto->username,
            $dto->email,
            $passwordHash,
            $roleId
        );

        return [
            "UserID" => $user->userId,
            "Username" => $user->username,
            "Email" => $user->email,
            "RoleID" => $user->roleId
        ];
    }

    // 2. Handles login logic
    public function loginUser(LoginDTO $dto): array {
        // Fetch user by email
        $user = $this->userRepository->getUserByEmail($dto->email);
        if (!$user) {
            throw new Exception("Incorrect email or password.");
        }

        // Validate blocked status
        if ($user->isBlocked) {
            throw new Exception("Your account is blocked. Please contact the administrator.");
        }

        // Verify password
        if (!password_verify($dto->password, $user->passwordHash)) {
            throw new Exception("Incorrect email or password.");
        }

        // Build JWT token payload
        $payload = [
            "iss" => "marketplace-auth",
            "iat" => time(),
            "exp" => time() + (24 * 60 * 60), // Token expires in 24 hours
            "userId" => $user->userId,
            "roleId" => $user->roleId
        ];

        // Generate the token
        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return [
            "token" => $token,
            "user" => [
                "UserID" => $user->userId,
                "Username" => $user->username,
                "Email" => $user->email,
                "RoleID" => $user->roleId
            ]
        ];
    }
}
