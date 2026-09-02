<?php
namespace UserService\Models;

use JsonSerializable;

class User implements JsonSerializable {
    public int $userId;
    public string $username;
    public string $email;
    public bool $isBlocked;
    public ?string $roleName; // Fetched from the Roles table join
    public ?string $shopName; // Associated shop for sellers
    public ?float $balance; // Wallet balance for buyers
    public ?string $createdAt; // Joined date

    public function __construct(array $data) {
        $this->userId = (int)($data['UserID'] ?? $data['userId'] ?? 0);
        $this->username = $data['Username'] ?? $data['username'] ?? '';
        $this->email = $data['Email'] ?? $data['email'] ?? '';
        $this->isBlocked = (bool)($data['IsBlocked'] ?? $data['isBlocked'] ?? false);
        $this->roleName = $data['RoleName'] ?? $data['roleName'] ?? null;
        $this->shopName = $data['ShopName'] ?? $data['shopName'] ?? null;
        $this->balance = isset($data['Balance']) ? (float)$data['Balance'] : (isset($data['balance']) ? (float)$data['balance'] : null);
        $this->createdAt = $data['CreatedAt'] ?? $data['createdAt'] ?? null;
    }

    public function jsonSerialize(): array {
        return [
            'UserID' => $this->userId,
            'Username' => $this->username,
            'Email' => $this->email,
            'IsBlocked' => $this->isBlocked,
            'RoleName' => $this->roleName,
            'ShopName' => $this->shopName,
            'Balance' => $this->balance,
            'CreatedAt' => $this->createdAt
        ];
    }
}
