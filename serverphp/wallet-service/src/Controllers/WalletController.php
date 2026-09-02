<?php
namespace WalletService\Controllers;

use WalletService\Services\WalletService;
use WalletService\DTOs\DepositDTO;
use WalletService\DTOs\PaymentDTO;
use WalletService\DTOs\RefundDTO;
use Exception;

class WalletController {
    private WalletService $walletService;

    public function __construct() {
        $this->walletService = new WalletService();
    }

    // 1. Fetch balance of currently logged-in user
    public function getBalance(array $currentUser): void {
        try {
            $userId = $currentUser['userId'];
            $balance = $this->walletService->getBalance($userId);
            
            http_response_code(200);
            echo json_encode(["balance" => $balance]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. Deposit money
    public function deposit(array $currentUser, array $body): void {
        try {
            $userId = $currentUser['userId'];
            
            $dto = new DepositDTO($body);
            $newBalance = $this->walletService->deposit($userId, $dto);

            http_response_code(200);
            echo json_encode([
                "message" => "Deposit successful",
                "balance" => $newBalance
            ]);
        } catch (Exception $e) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 3. pay (Internal Saga checkout step - called by Order Service)
    public function pay(array $body): void {
        try {
            $dto = new PaymentDTO($body);
            $this->walletService->pay($dto);

            http_response_code(200);
            echo json_encode(["message" => "Payment successful."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 4. refund (Internal Saga rollback step - called by Order Service)
    public function refund(array $body): void {
        try {
            $dto = new RefundDTO($body);
            $this->walletService->refund($dto);

            http_response_code(200);
            echo json_encode(["message" => "Refund processed successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
