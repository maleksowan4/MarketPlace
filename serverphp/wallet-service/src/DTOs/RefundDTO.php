<?php
namespace WalletService\DTOs;

use Exception;

class RefundDTO {
    public int $userId;
    public float $amount;
    public int $orderId;

    public function __construct(array $data) {
        if (!isset($data['userId']) || !isset($data['amount']) || !isset($data['orderId'])) {
            throw new Exception("userId, amount, and orderId fields are required.");
        }
        if ((float)$data['amount'] <= 0) {
            throw new Exception("Refund amount must be a positive number.");
        }
        $this->userId = (int)$data['userId'];
        $this->amount = (float)$data['amount'];
        $this->orderId = (int)$data['orderId'];
    }
}
