<?php
namespace AuthService\Models;

class User {
    public int $userId;
    public int $roleId;
    public string $username;
    public string $email;
    public string $passwordHash;
    public bool $isBlocked;

    // The constructor takes the database row array and maps it to properties
    public function __construct(array $data) {
        $this->userId = (int)($data['UserID'] ?? $data['userId'] ?? 0);
        $this->roleId = (int)($data['RoleID'] ?? $data['roleId'] ?? 3);
        $this->username = $data['Username'] ?? $data['username'] ?? '';
        $this->email = $data['Email'] ?? $data['email'] ?? '';
        $this->passwordHash = $data['PasswordHash'] ?? $data['passwordHash'] ?? '';
        $this->isBlocked = (bool)($data['IsBlocked'] ?? $data['isBlocked'] ?? false);
    }
}

