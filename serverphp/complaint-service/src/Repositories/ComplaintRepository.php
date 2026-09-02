<?php
namespace ComplaintService\Repositories;

use ComplaintService\Config\Database;
use ComplaintService\Models\Complaint;
use PDO;

class ComplaintRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Log a new complaint
    public function create(int $buyerId, int $sellerId, int $shopId, string $comment): Complaint {
        $stmt = $this->db->prepare("
            INSERT INTO Complaints (BuyerID, SellerID, ShopID, Comment)
            VALUES (:buyerId, :sellerId, :shopId, :comment)
        ");
        $stmt->execute([
            ':buyerId' => $buyerId,
            ':sellerId' => $sellerId,
            ':shopId' => $shopId,
            ':comment' => $comment
        ]);

        $newId = (int)$this->db->lastInsertId();
        return new Complaint([
            'ComplaintID' => $newId,
            'BuyerID' => $buyerId,
            'SellerID' => $sellerId,
            'ShopID' => $shopId,
            'Comment' => $comment
        ]);
    }

    // 2. Retrieve complaints submitted by a specific buyer
    public function getByBuyerId(int $buyerId): array {
        $stmt = $this->db->prepare("
            SELECT c.*, sh.ShopName 
            FROM Complaints c
            INNER JOIN Shops sh ON c.ShopID = sh.ShopID
            WHERE c.BuyerID = :buyerId 
            ORDER BY c.CreatedAt DESC
        ");
        $stmt->execute([':buyerId' => $buyerId]);
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Complaint($row), $rows);
    }

    // 3. Admin gets all complaints in system
    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT c.ComplaintID, c.Comment, c.CreatedAt,
                   b.Username AS BuyerName, b.Email AS BuyerEmail,
                   s.Username AS SellerName, s.Email AS SellerEmail, s.IsBlocked AS SellerBlocked,
                   sh.ShopName, sh.ShopID, sh.IsBlocked AS ShopBlocked
            FROM Complaints c
            INNER JOIN Users b ON c.BuyerID = b.UserID
            INNER JOIN Users s ON c.SellerID = s.UserID
            INNER JOIN Shops sh ON c.ShopID = sh.ShopID
            ORDER BY c.CreatedAt DESC
        ");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Complaint($row), $rows);
    }

    // 4. Update complaint status (deletes complaint since there is no Status column)
    public function updateStatus(int $complaintId, string $status): bool {
        $stmt = $this->db->prepare("
            DELETE FROM Complaints 
            WHERE ComplaintID = :complaintId
        ");
        $stmt->execute([
            ':complaintId' => $complaintId
        ]);
        return $stmt->rowCount() > 0;
    }
}
