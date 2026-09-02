<?php
namespace WalletService\Repositories;

use WalletService\Config\Database;
use WalletService\Models\Wallet;
use WalletService\Models\Transaction;
use PDO;

class WalletRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Fetch wallet by UserID (lazily creates one if it doesn't exist!)
    public function getByUserId(int $userId): Wallet {
        $stmt = $this->db->prepare("SELECT * FROM Wallets WHERE UserID = :userId");
        $stmt->execute([':userId' => $userId]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->createWallet($userId);
        }

        return new Wallet($row);
    }

    // 2. Initialize a new wallet
    public function createWallet(int $userId): Wallet {
        $stmt = $this->db->prepare("
            INSERT INTO Wallets (UserID, Balance) 
            VALUES (:userId, 0.00)
        ");
        $stmt->execute([':userId' => $userId]);

        $newId = $this->db->lastInsertId();
        return new Wallet([
            'WalletID' => $newId,
            'UserID' => $userId,
            'Balance' => 0.00
        ]);
    }

    // 3. Update wallet balance
    public function updateBalance(int $walletId, float $newBalance): bool {
        $stmt = $this->db->prepare("
            UPDATE Wallets 
            SET Balance = :balance 
            WHERE WalletID = :walletId
        ");
        $stmt->execute([
            ':balance' => $newBalance,
            ':walletId' => $walletId
        ]);
        return $stmt->rowCount() > 0;
    }

    // 4. Log transaction event in history
    public function logTransaction(int $walletId, float $amount, string $type, ?string $description): void {
        $stmt = $this->db->prepare("
            INSERT INTO WalletTransactions (WalletID, Amount, TransactionType)
            VALUES (:walletId, :amount, :type)
        ");
        $stmt->execute([
            ':walletId' => $walletId,
            ':amount' => $amount,
            ':type' => $type
        ]);
    }
}
