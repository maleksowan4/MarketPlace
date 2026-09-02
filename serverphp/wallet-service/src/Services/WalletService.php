<?php
namespace WalletService\Services;

use WalletService\Config\Database;
use WalletService\Repositories\WalletRepository;
use WalletService\DTOs\DepositDTO;
use WalletService\DTOs\PaymentDTO;
use WalletService\DTOs\RefundDTO;
use WalletService\Models\Wallet;
use Exception;
use PDO;

class WalletService {
    private WalletRepository $walletRepository;

    public function __construct() {
        $this->walletRepository = new WalletRepository();
    }

    // 1. Get buyer balance
    public function getBalance(int $userId): float {
        $wallet = $this->walletRepository->getByUserId($userId);
        return $wallet->balance;
    }

    // 2. Deposit money to wallet (wrapped in database transaction)
    public function deposit(int $userId, DepositDTO $dto): float {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $wallet = $this->walletRepository->getByUserId($userId);
            
            $newBalance = $wallet->balance + $dto->amount;
            $this->walletRepository->updateBalance($wallet->walletId, $newBalance);

            // Log deposit event
            $this->walletRepository->logTransaction(
                $wallet->walletId,
                $dto->amount,
                "Deposit",
                "Funds deposited via client application."
            );

            $pdo->commit();
            return $newBalance;
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // 3. pay (Saga Checkout Step) - Deducts payment amount
    public function pay(PaymentDTO $dto): void {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $wallet = $this->walletRepository->getByUserId($dto->userId);

            // Verify funds are sufficient
            if ($wallet->balance < $dto->amount) {
                throw new Exception("Insufficient funds. Available balance: {$wallet->balance}, Required: {$dto->amount}");
            }

            $newBalance = $wallet->balance - $dto->amount;
            $this->walletRepository->updateBalance($wallet->walletId, $newBalance);

            // Log payment event
            $this->walletRepository->logTransaction(
                $wallet->walletId,
                $dto->amount,
                "Payment",
                "Payment deducted for Order ID #{$dto->orderId}."
            );

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // 4. refund (Saga Compensating Step) - Restores money if order fails
    public function refund(RefundDTO $dto): void {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $wallet = $this->walletRepository->getByUserId($dto->userId);

            $newBalance = $wallet->balance + $dto->amount;
            $this->walletRepository->updateBalance($wallet->walletId, $newBalance);

            // Log refund event
            $this->walletRepository->logTransaction(
                $wallet->walletId,
                $dto->amount,
                "Refund",
                "Payment refunded for failed Order ID #{$dto->orderId}."
            );

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
