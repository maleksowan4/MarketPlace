<?php
namespace UserService\Repositories;

use UserService\Config\Database;
use UserService\Models\User;
use PDO;

class ProfileRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Get profile of a specific user
    public function getProfile(int $userId): ?User {
        $stmt = $this->db->prepare("
            SELECT u.UserID, u.Username, u.Email, u.IsBlocked, r.RoleName 
            FROM Users u
            INNER JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = :userId
        ");
        $stmt->execute([':userId' => $userId]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    // 2. Admin retrieves all users
    public function getAllUsers(): array {
        $stmt = $this->db->query("
            SELECT u.UserID, u.Username, u.Email, u.IsBlocked, r.RoleName 
            FROM Users u
            INNER JOIN Roles r ON u.RoleID = r.RoleID
        ");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new User($row), $rows);
    }

    // 3. Admin retrieves only Sellers (RoleID = 2) with shop names
    public function getSellers(): array {
        $stmt = $this->db->query("
            SELECT u.UserID, u.Username, u.Email, u.IsBlocked, 'Seller' as RoleName, s.ShopName
            FROM Users u
            LEFT JOIN Shops s ON u.UserID = s.SellerID
            WHERE u.RoleID = 2
        ");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new User($row), $rows);
    }

    // 4. Admin retrieves only Buyers (RoleID = 3) with wallet balance and sign-up date
    public function getBuyers(): array {
        $stmt = $this->db->query("
            SELECT u.UserID, u.Username, u.Email, u.IsBlocked, 'Buyer' as RoleName, u.CreatedAt, w.Balance
            FROM Users u
            LEFT JOIN Wallets w ON u.UserID = w.UserID
            WHERE u.RoleID = 3
        ");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new User($row), $rows);
    }

    // 5. Admin updates a user's block status
    public function updateBlockStatus(int $userId, bool $isBlocked): bool {
        $stmt = $this->db->prepare("
            UPDATE Users 
            SET IsBlocked = :isBlocked 
            WHERE UserID = :userId
        ");
        $stmt->execute([
            ':isBlocked' => $isBlocked ? 1 : 0,
            ':userId' => $userId
        ]);
        return $stmt->rowCount() > 0;
    }
}
