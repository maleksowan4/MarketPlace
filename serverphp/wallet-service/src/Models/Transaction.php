<?php
namespace WalletService\Models;

use JsonSerializable;

class Transaction implements JsonSerializable {
    public int $transactionId;
    public int $walletId;
    public float $amount;
    public string $type; // 'Deposit', 'Payment', 'Refund'
    public string $createdAt;

    public function __construct(array $data) {
        $this->transactionId = (int)($data['TransactionID'] ?? $data['transactionId'] ?? 0);
        $this->walletId = (int)($data['WalletID'] ?? $data['walletId'] ?? 0);
        $this->amount = (float)($data['Amount'] ?? $data['amount'] ?? 0.0);
        $this->type = $data['TransactionType'] ?? $data['transactionType'] ?? $data['Type'] ?? $data['type'] ?? '';
        $this->createdAt = $data['TransactionDate'] ?? $data['transactionDate'] ?? $data['CreatedAt'] ?? $data['createdAt'] ?? '';
    }

    public function jsonSerialize(): array {
        return [
            'TransactionID' => $this->transactionId,
            'WalletID' => $this->walletId,
            'Amount' => $this->amount,
            'TransactionType' => $this->type,
            'Type' => $this->type, // Fallback
            'TransactionDate' => $this->createdAt,
            'CreatedAt' => $this->createdAt // Fallback
        ];
    }
}
