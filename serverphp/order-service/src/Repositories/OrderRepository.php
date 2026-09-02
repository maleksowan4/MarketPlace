<?php
namespace OrderService\Repositories;

use OrderService\Config\Database;
use OrderService\Models\Order;
use OrderService\Models\OrderItem;
use PDO;

class OrderRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // 1. Create a new Order in Pending status
    public function createOrder(int $buyerId, float $totalPrice): int {
        $stmt = $this->db->prepare("
            INSERT INTO Orders (BuyerID, TotalAmount, Status)
            VALUES (:buyerId, :totalPrice, 'Pending')
        ");
        $stmt->execute([
            ':buyerId' => $buyerId,
            ':totalPrice' => $totalPrice
        ]);
        return (int)$this->db->lastInsertId();
    }

    // 2. Insert individual items inside the order
    public function addOrderItems(int $orderId, array $items): void {
        $stmt = $this->db->prepare("
            INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
            VALUES (:orderId, :productId, :quantity, :price)
        ");

        foreach ($items as $item) {
            $stmt->execute([
                ':orderId' => $orderId,
                ':productId' => (int)$item['productId'],
                ':quantity' => (int)$item['quantity'],
                ':price' => (float)$item['price']
            ]);
        }
    }

    // 3. Update the order state (Completed or Failed)
    public function updateOrderStatus(int $orderId, string $status): bool {
        $stmt = $this->db->prepare("
            UPDATE Orders 
            SET Status = :status 
            WHERE OrderID = :orderId
        ");
        $stmt->execute([
            ':status' => $status,
            ':orderId' => $orderId
        ]);
        return $stmt->rowCount() > 0;
    }

    // 4. Retrieve single order details
    public function getOrderDetails(int $orderId): ?Order {
        // Fetch order header
        $stmt = $this->db->prepare("SELECT * FROM Orders WHERE OrderID = :orderId");
        $stmt->execute([':orderId' => $orderId]);
        $row = $stmt->fetch();
        if (!$row) return null;

        $order = new Order($row);

        // Fetch order items
        $stmtItems = $this->db->prepare("SELECT * FROM OrderItems WHERE OrderID = :orderId");
        $stmtItems->execute([':orderId' => $orderId]);
        $rowsItems = $stmtItems->fetchAll();

        $order->items = array_map(fn($itemRow) => new OrderItem($itemRow), $rowsItems);

        return $order;
    }

    // 5. Retrieve all orders for a buyer
    public function getBuyerOrders(int $buyerId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM Orders 
            WHERE BuyerID = :buyerId 
            ORDER BY OrderDate DESC
        ");
        $stmt->execute([':buyerId' => $buyerId]);
        $rows = $stmt->fetchAll();

        $orders = [];
        foreach ($rows as $row) {
            $order = new Order($row);
            
            // Get items for this order
            $stmtItems = $this->db->prepare("SELECT * FROM OrderItems WHERE OrderID = :orderId");
            $stmtItems->execute([':orderId' => $order->orderId]);
            $itemRows = $stmtItems->fetchAll();
            $order->items = array_map(fn($itemRow) => new OrderItem($itemRow), $itemRows);
            
            $orders[] = $order;
        }

        return $orders;
    }

    // 6. Retrieve all orders for a seller (raw rows)
    public function getSellerOrders(int $sellerId): array {
        $stmt = $this->db->prepare("
            SELECT 
                o.OrderID, 
                o.OrderDate, 
                o.Status, 
                oi.Quantity, 
                oi.UnitPrice, 
                p.ProductName, 
                p.ProductID,
                u.Username AS BuyerName
            FROM Orders o
            INNER JOIN OrderItems oi ON o.OrderID = oi.OrderID
            INNER JOIN Products p ON oi.ProductID = p.ProductID
            INNER JOIN Users u ON o.BuyerID = u.UserID
            WHERE p.SellerID = :sellerId
            ORDER BY o.OrderDate DESC
        ");
        $stmt->execute([':sellerId' => $sellerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 7. Update order status for seller authorization
    public function updateStatus(int $orderId, int $sellerId, string $status): bool {
        $stmt = $this->db->prepare("
            UPDATE Orders
            SET Status = :status
            WHERE OrderID = :orderId
              AND EXISTS (
                  SELECT 1 
                  FROM OrderItems oi
                  INNER JOIN Products p ON oi.ProductID = p.ProductID
                  WHERE oi.OrderID = Orders.OrderID AND p.SellerID = :sellerId
              )
        ");
        $stmt->execute([
            ':status' => $status,
            ':orderId' => $orderId,
            ':sellerId' => $sellerId
        ]);
        return $stmt->rowCount() > 0;
    }

    // 8. Get seller stats for dashboard charts
    public function getSellerStats(int $sellerId): array {
        $stmt = $this->db->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN o.Status = 'Accepted' THEN oi.Quantity * oi.UnitPrice ELSE 0 END), 0) AS TotalSales,
                COUNT(DISTINCT CASE WHEN o.Status = 'Accepted' THEN o.OrderID END) AS AcceptedOrdersCount,
                COUNT(DISTINCT CASE WHEN o.Status = 'Pending' THEN o.OrderID END) AS PendingOrdersCount
            FROM Orders o
            INNER JOIN OrderItems oi ON o.OrderID = oi.OrderID
            INNER JOIN Products p ON oi.ProductID = p.ProductID
            WHERE p.SellerID = :sellerId
        ");
        $stmt->execute([':sellerId' => $sellerId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'TotalSales' => (float)($row['TotalSales'] ?? 0.0),
            'AcceptedOrdersCount' => (int)($row['AcceptedOrdersCount'] ?? 0),
            'PendingOrdersCount' => (int)($row['PendingOrdersCount'] ?? 0)
        ];
    }

        public function getBuyerEmail(int $buyerId): ?string {
        $stmt = $this->db->prepare("SELECT Email FROM Users WHERE UserID = :userId");
        $stmt->execute([':userId' => $buyerId]);
        $row = $stmt->fetch();
        return $row ? $row['Email'] : null;
    }
}
