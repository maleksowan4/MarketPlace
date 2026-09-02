<?php
namespace WalletService\DTOs;

use Exception;

class DepositDTO {
    public float $amount;

    public function __construct(array $data) {
        if (!isset($data['amount']) || (float)$data['amount'] <= 0) {
            throw new Exception("Deposit amount must be a positive number.");
        }
        $this->amount = (float)$data['amount'];
    }
}
