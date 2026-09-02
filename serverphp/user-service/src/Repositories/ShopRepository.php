<?php
namespace UserService\Repositories;

use UserService\Config\Database;
use UserService\Models\Shop;
use PDO;

class ShopRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Get all non-blocked shops belonging to non-blocked sellers
    public function getAllActive(): array {
        $stmt = $this->db->query("
            SELECT s.ShopID, s.SellerID, s.ShopName, s.Description, s.LogoUrl, s.IsBlocked, u.Username AS SellerName
            FROM Shops s
            INNER JOIN Users u ON s.SellerID = u.UserID
            WHERE s.IsBlocked = 0 AND u.IsBlocked = 0
        ");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Shop($row), $rows);
    }

    // 2. Fetch shop details by ShopID
    public function getById(int $shopId): ?Shop {
        $stmt = $this->db->prepare("
            SELECT s.ShopID, s.SellerID, s.ShopName, s.Description, s.LogoUrl, s.IsBlocked, u.Username AS SellerName
            FROM Shops s
            INNER JOIN Users u ON s.SellerID = u.UserID
            WHERE s.ShopID = :shopId
        ");
        $stmt->execute([':shopId' => $shopId]);
        $row = $stmt->fetch();
        return $row ? new Shop($row) : null;
    }

    // 3. Fetch shop details by SellerID
    public function getBySellerId(int $sellerId): ?Shop {
        $stmt = $this->db->prepare("
            SELECT s.ShopID, s.SellerID, s.ShopName, s.Description, s.LogoUrl, s.IsBlocked, u.Username AS SellerName
            FROM Shops s
            INNER JOIN Users u ON s.SellerID = u.UserID
            WHERE s.SellerID = :sellerId
        ");
        $stmt->execute([':sellerId' => $sellerId]);
        $row = $stmt->fetch();
        return $row ? new Shop($row) : null;
    }

    // 4. Update shop settings
    public function update(int $sellerId, string $shopName, ?string $description, ?string $logoUrl): ?Shop {
        // Prepare dynamic query depending on whether logoUrl is provided
        $sql = "UPDATE Shops SET ShopName = :shopName, Description = :description";
        $params = [
            ':shopName' => $shopName,
            ':description' => $description,
            ':sellerId' => $sellerId
        ];

        if ($logoUrl !== null) {
            $sql .= ", LogoUrl = :logoUrl";
            $params[':logoUrl'] = $logoUrl;
        }

        $sql .= " WHERE SellerID = :sellerId";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getBySellerId($sellerId);
    }

    // 5. Toggle shop block status
    public function updateBlockStatus(int $shopId, bool $isBlocked): bool {
        $stmt = $this->db->prepare("
            UPDATE Shops 
            SET IsBlocked = :isBlocked 
            WHERE ShopID = :shopId
        ");
        $stmt->execute([
            ':isBlocked' => $isBlocked ? 1 : 0,
            ':shopId' => $shopId
        ]);
        return $stmt->rowCount() > 0;
    }
}
