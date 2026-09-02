<?php
namespace WalletService\Models;

use JsonSerializable;

class Wallet implements JsonSerializable {
    public int $walletId;
    public int $userId;
    public float $balance;

    public function __construct(array $data) {
        $this->walletId = (int)($data['WalletID'] ?? $data['walletId'] ?? 0);
        $this->userId = (int)($data['UserID'] ?? $data['userId'] ?? 0);
        $this->balance = (float)($data['Balance'] ?? $data['balance'] ?? 0.0);
    }

    public function jsonSerialize(): array {
        return [
            'WalletID' => $this->walletId,
            'UserID' => $this->userId,
            'Balance' => $this->balance
        ];
    }
}
