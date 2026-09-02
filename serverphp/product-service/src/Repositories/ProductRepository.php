<?php
namespace ProductService\Repositories;

use ProductService\Config\Database;
use ProductService\Models\Product;
use PDO;

class ProductRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Get all active products for the catalog
    public function getAllActive(): array {
        $stmt = $this->db->query("SELECT * FROM Products WHERE IsDeleted = 0");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Product($row), $rows);
    }

    // 2. Get product details by ID
    public function getById(int $productId): ?Product {
        $stmt = $this->db->prepare("SELECT * FROM Products WHERE ProductID = :productId");
        $stmt->execute([':productId' => $productId]);
        $row = $stmt->fetch();
        return $row ? new Product($row) : null;
    }

    // 3. Get products of a seller
    public function getBySellerId(int $sellerId): array {
        $stmt = $this->db->prepare("SELECT * FROM Products WHERE SellerID = :sellerId AND IsDeleted = 0");
        $stmt->execute([':sellerId' => $sellerId]);
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Product($row), $rows);
    }

    // 4. Get paginated products belonging to a shop
    public function getByShopId(int $shopId, int $offset, int $limit): array {
        $stmt = $this->db->prepare("
            SELECT * FROM Products 
            WHERE SellerID = (SELECT SellerID FROM Shops WHERE ShopID = :shopId)
              AND IsDeleted = 0
            ORDER BY ProductID
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
        ");
        
        // In MS SQL Server PDO, we must bind offset and limit explicitly as integers
        $stmt->bindValue(':shopId', $shopId, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Product($row), $rows);
    }

    // 5. Create a new product
    public function create(int $sellerId, string $productName, ?string $description, float $price, int $quantity, ?string $imageUrl): Product {
        $stmt = $this->db->prepare("
            INSERT INTO Products (SellerID, ProductName, Description, Price, Quantity, ImageUrl)
            VALUES (:sellerId, :productName, :description, :price, :quantity, :imageUrl)
        ");
        $stmt->execute([
            ':sellerId' => $sellerId,
            ':productName' => $productName,
            ':description' => $description,
            ':price' => $price,
            ':quantity' => $quantity,
            ':imageUrl' => $imageUrl
        ]);

        $newId = $this->db->lastInsertId();
        return $this->getById($newId);
    }

    // 6. Update product settings
    public function update(int $productId, int $sellerId, string $productName, ?string $description, float $price, int $quantity, ?string $imageUrl): ?Product {
        $sql = "UPDATE Products SET ProductName = :productName, Description = :description, Price = :price, Quantity = :quantity";
        $params = [
            ':productName' => $productName,
            ':description' => $description,
            ':price' => $price,
            ':quantity' => $quantity,
            ':productId' => $productId,
            ':sellerId' => $sellerId
        ];

        if ($imageUrl !== null) {
            $sql .= ", ImageUrl = :imageUrl";
            $params[':imageUrl'] = $imageUrl;
        }

        $sql .= " WHERE ProductID = :productId AND SellerID = :sellerId";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($productId);
    }

    // 7. Update stock level directly
    public function updateStock(int $productId, int $newQuantity): bool {
        $stmt = $this->db->prepare("
            UPDATE Products 
            SET Quantity = :quantity 
            WHERE ProductID = :productId
        ");
        $stmt->execute([
            ':quantity' => $newQuantity,
            ':productId' => $productId
        ]);
        return $stmt->rowCount() > 0;
    }

    // 8. Seller soft deletes a product
    public function softDelete(int $productId, int $sellerId): bool {
        $stmt = $this->db->prepare("
            UPDATE Products 
            SET IsDeleted = 1 
            WHERE ProductID = :productId AND SellerID = :sellerId
        ");
        $stmt->execute([
            ':productId' => $productId,
            ':sellerId' => $sellerId
        ]);
        return $stmt->rowCount() > 0;
    }

    // 9. Admin force soft deletes a product
    public function adminDelete(int $productId): bool {
        $stmt = $this->db->prepare("
            UPDATE Products 
            SET IsDeleted = 1 
            WHERE ProductID = :productId
        ");
        $stmt->execute([':productId' => $productId]);
        return $stmt->rowCount() > 0;
    }
}
