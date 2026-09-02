<?php
namespace AuthService\DTOs;

use Exception;

class LoginDTO {
    public string $email;
    public string $password;

    public function __construct(array $data) {
        if (empty($data['email']) || empty($data['password'])) {
            throw new Exception("Email and password are required.");
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email address format.");
        }

        $this->email = trim($data['email']);
        $this->password = $data['password'];
    }
}
