<?php
namespace AuthService\DTOs;

use Exception;

class RegisterDTO {
    public string $username;
    public string $email;
    public string $password;
    public string $role;

    public function __construct(array $data) {
        // Validate presence of fields
        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            throw new Exception("Username, email, and password are required.");
        }

        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email address format.");
        }

        $this->username = trim($data['username']);
        $this->email = trim($data['email']);
        $this->password = $data['password'];
        
        // Default role to 'buyer' if not provided or invalid
        $providedRole = strtolower($data['role'] ?? 'buyer');
        if (in_array($providedRole, ['buyer', 'seller', 'admin'])) {
            $this->role = $providedRole;
        } else {
            $this->role = 'buyer';
        }
    }
}
