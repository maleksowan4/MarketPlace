<?php
namespace OrderService\Services;

use OrderService\Repositories\OrderRepository;
use OrderService\DTOs\CreateOrderDTO;
use OrderService\Models\Order;
use Exception;

class OrderService {
    private OrderRepository $orderRepository;
    private string $productServiceUrl;
    private string $walletServiceUrl;

    public function __construct() {
        $this->orderRepository = new OrderRepository();
        $this->productServiceUrl = rtrim(getenv('PRODUCT_SERVICE_URL') ?: 'http://localhost:5003', '/');
        $this->walletServiceUrl  = rtrim(getenv('WALLET_SERVICE_URL')  ?: 'http://localhost:5005', '/');
    }

    // 1. Coordinates the checkout Saga transaction
    public function placeOrder(int $buyerId, CreateOrderDTO $dto): int {
        // Resolve prices from Product Service and verify stock availability
        $totalPrice = 0.0;
        $resolvedItems = [];
        foreach ($dto->items as $item) {
            $productId = $item['productId'];
            $quantity = $item['quantity'];

            // Query Product Service
            $productRes = $this->sendCurlRequest($this->productServiceUrl . "/api/products/" . $productId, "GET");
            if ($productRes['status'] !== 200) {
                throw new Exception("Product ID $productId not found or service unavailable.");
            }

            $productData = $productRes['body'];
            
            // Handle potentially capitalized or lowercase database keys returned by the Product Service
            $dbPrice = $productData['Price'] ?? $productData['price'] ?? null;
            $dbQuantity = $productData['Quantity'] ?? $productData['quantity'] ?? null;

            if ($dbPrice === null) {
                throw new Exception("Unable to resolve price for Product ID $productId.");
            }

            if ($dbQuantity < $quantity) {
                throw new Exception("Insufficient stock for product ID $productId. Available: $dbQuantity, Requested: $quantity.");
            }

            $itemPrice = (float)$dbPrice;
            $totalPrice += $itemPrice * $quantity;

            $resolvedItems[] = [
                'productId' => $productId,
                'quantity' => $quantity,
                'price' => $itemPrice
            ];
        }

        // Overwrite dto->items with securely resolved details
        $dto->items = $resolvedItems;

        // Step 1: Create a Pending Order in local DB
        $orderId = $this->orderRepository->createOrder($buyerId, $totalPrice);
        $this->orderRepository->addOrderItems($orderId, $dto->items);

        // Step 2: Trigger Product Service to reserve inventory
        $productServiceUrl = $this->productServiceUrl . "/api/products/reserve";
        $reservePayload = ["items" => $dto->items];
        
        $reserveResult = $this->sendCurlRequest($productServiceUrl, "POST", $reservePayload);
        
        if ($reserveResult['status'] !== 200) {
            // Failed to reserve stock: cancel order
            $this->orderRepository->updateOrderStatus($orderId, "Failed");
            throw new Exception("Stock reservation failed: " . ($reserveResult['body']['message'] ?? 'Unknown error'));
        }

        // Step 3: Keep order as Pending for seller acceptance (buyer will be charged when accepted).
        $this->orderRepository->updateOrderStatus($orderId, "Pending");

         // Step 5: Publish asynchronous OrderCreated event for email notifications
        try {
            $buyerEmail = $this->orderRepository->getBuyerEmail($buyerId);
            if ($buyerEmail) {
                \OrderService\Services\EventPublisher::publishOrderCreated($orderId, $buyerEmail, $totalPrice);
            }
        } catch (Exception $e) {
            // We log the error but don't crash checkout! The customer still gets their order.
            error_log("Failed to publish email notification event: " . $e->getMessage());
        }
        return $orderId;
    }

    // 2. Retrieve single order details
    public function getOrderDetails(int $orderId, array $currentUser): Order {
        $order = $this->orderRepository->getOrderDetails($orderId);
        if (!$order) {
            throw new Exception("Order not found.");
        }

        // Authorization check: only the buyer or an admin can view order details
        if ($order->buyerId !== $currentUser['userId'] && ($currentUser['roleId'] ?? 0) !== 1) {
            throw new Exception("Access denied. You do not own this order.");
        }

        return $order;
    }

    // 3. Retrieve order history of a buyer
    public function getBuyerOrders(int $buyerId): array {
        return $this->orderRepository->getBuyerOrders($buyerId);
    }

    // Helper: Executes HTTP calls to other microservices
    // Helper: Sends cURL HTTP request
    private function sendCurlRequest(string $url, string $method, array $data = []): array {
        $ch = curl_init($url);
        
        $jsonData = json_encode($data);
        
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($jsonData)
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decodedResponse = json_decode($response, true) ?? [];

        return [
            "status" => $httpCode,
            "body" => $decodedResponse
        ];
    }

    // 2. Fetch all orders (raw items list) for a seller (used in dashboard charts)
    public function getSellerOrders(int $sellerId): array {
        $rows = $this->orderRepository->getSellerOrders($sellerId);
        return array_map(function($row) {
            return [
                'OrderID' => (int)$row['OrderID'],
                'orderId' => (int)$row['OrderID'],
                'OrderDate' => $row['OrderDate'],
                'orderDate' => $row['OrderDate'],
                'Status' => $row['Status'],
                'status' => $row['Status'],
                'Quantity' => (int)$row['Quantity'],
                'quantity' => (int)$row['Quantity'],
                'UnitPrice' => (float)$row['UnitPrice'],
                'unitPrice' => (float)$row['UnitPrice'],
                'ProductName' => $row['ProductName'],
                'productName' => $row['ProductName'],
                'ProductID' => (int)$row['ProductID'],
                'productId' => (int)$row['ProductID'],
                'BuyerName' => $row['BuyerName'],
                'buyerName' => $row['BuyerName']
            ];
        }, $rows);
    }

    // 3. Fetch grouped incoming orders list for a seller (used in incoming orders table)
    public function getSellerIncomingOrders(int $sellerId): array {
        $rawOrders = $this->orderRepository->getSellerOrders($sellerId);
        $grouped = [];

        foreach ($rawOrders as $order) {
            $orderId = (int)$order['OrderID'];
            if (!isset($grouped[$orderId])) {
                $grouped[$orderId] = [
                    'orderId' => $orderId,
                    'OrderID' => $orderId, // Fallback
                    'orderDate' => $order['OrderDate'],
                    'OrderDate' => $order['OrderDate'], // Fallback
                    'status' => $order['Status'],
                    'Status' => $order['Status'], // Fallback
                    'buyerName' => $order['BuyerName'],
                    'BuyerName' => $order['BuyerName'], // Fallback
                    'items' => [],
                    'total' => 0.0
                ];
            }

            $quantity = (int)$order['Quantity'];
            $unitPrice = (float)$order['UnitPrice'];
            $itemTotal = $quantity * $unitPrice;

            $grouped[$orderId]['items'][] = [
                'productId' => (int)$order['ProductID'],
                'ProductID' => (int)$order['ProductID'], // Fallback
                'productName' => $order['ProductName'],
                'ProductName' => $order['ProductName'], // Fallback
                'quantity' => $quantity,
                'Quantity' => $quantity, // Fallback
                'unitPrice' => $unitPrice,
                'UnitPrice' => $unitPrice, // Fallback
                'totalPrice' => $itemTotal,
                'TotalPrice' => $itemTotal // Fallback
            ];
            $grouped[$orderId]['total'] += $itemTotal;
        }

        // Sort descending by order date
        usort($grouped, function ($a, $b) {
            return strcmp($b['orderDate'], $a['orderDate']);
        });

        return array_values($grouped);
    }

    // 4. Fetch seller stats for charts
    public function getSellerStats(int $sellerId): array {
        return $this->orderRepository->getSellerStats($sellerId);
    }

    // 5. Seller accepts an order (wrapped in transaction saga: charges buyer first, then credits seller)
    public function acceptOrder(int $orderId, int $sellerId): void {
        $order = $this->orderRepository->getOrderDetails($orderId);
        if (!$order) {
            throw new Exception("Order not found.");
        }
        if ($order->status !== "Pending") {
            throw new Exception("Order cannot be accepted because its status is: " . $order->status);
        }

        // Step 1: Charge the buyer's wallet
        $walletServiceUrl = $this->walletServiceUrl . "/api/wallet/pay";
        $paymentPayload = [
            "userId" => $order->buyerId,
            "amount" => $order->totalPrice,
            "orderId" => $orderId
        ];

        $paymentResult = $this->sendCurlRequest($walletServiceUrl, "POST", $paymentPayload);

        if ($paymentResult['status'] !== 200) {
            // Payment failed. We cancel the order and release the reserved stock!
            $itemsPayload = array_map(function($item) {
                return [
                    'productId' => $item->productId,
                    'quantity' => $item->quantity
                ];
            }, $order->items);
            
            $releaseUrl = $this->productServiceUrl . "/api/products/release";
            $this->sendCurlRequest($releaseUrl, "POST", ["items" => $itemsPayload]);

            // Mark order as Failed
            $this->orderRepository->updateOrderStatus($orderId, "Failed");
            
            throw new Exception("Payment failed: " . ($paymentResult['body']['message'] ?? 'Insufficient buyer funds'));
        }

        // Step 2: Update status to Completed/Accepted
        $success = $this->orderRepository->updateStatus($orderId, $sellerId, "Accepted");
        if (!$success) {
            // Compensation step: refund the buyer
            $refundUrl = $this->walletServiceUrl . "/api/wallet/refund";
            $this->sendCurlRequest($refundUrl, "POST", [
                "userId" => $order->buyerId,
                "amount" => $order->totalPrice,
                "orderId" => $orderId
            ]);
            
            throw new Exception("Failed to accept order. You may not be authorized to accept this order.");
        }

        // Step 3: Credit the seller's wallet via the Wallet Service refund endpoint
        $creditUrl = $this->walletServiceUrl . "/api/wallet/refund";
        $creditPayload = [
            "userId" => $sellerId,
            "amount" => $order->totalPrice,
            "orderId" => $orderId
        ];

        $creditResult = $this->sendCurlRequest($creditUrl, "POST", $creditPayload);

        if ($creditResult['status'] !== 200) {
            // Rollback everything
            // 1. Refund the buyer
            $refundUrl = $this->walletServiceUrl . "/api/wallet/refund";
            $this->sendCurlRequest($refundUrl, "POST", [
                "userId" => $order->buyerId,
                "amount" => $order->totalPrice,
                "orderId" => $orderId
            ]);

            // 2. Release product inventory
            $itemsPayload = array_map(function($item) {
                return [
                    'productId' => $item->productId,
                    'quantity' => $item->quantity
                ];
            }, $order->items);
            $releaseUrl = $this->productServiceUrl . "/api/products/release";
            $this->sendCurlRequest($releaseUrl, "POST", ["items" => $itemsPayload]);

            // 3. Mark order as Failed
            $this->orderRepository->updateOrderStatus($orderId, "Failed");
            
            throw new Exception("Wallet transaction failed. Order acceptance aborted: " . ($creditResult['body']['message'] ?? 'Unknown error'));
        }
    }
}
