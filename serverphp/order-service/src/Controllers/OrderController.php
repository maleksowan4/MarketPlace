<?php
namespace OrderService\Controllers;

use OrderService\Services\OrderService;
use OrderService\DTOs\CreateOrderDTO;
use Exception;

class OrderController {
    private OrderService $orderService;

    public function __construct() {
        $this->orderService = new OrderService();
    }

    // 1. Starts the checkout Saga transaction
    public function placeOrder(array $currentUser, array $body): void {
        try {
            $buyerId = $currentUser['userId'];
            
            // Build and validate basket payload via DTO
            $dto = new CreateOrderDTO($body);

            // Execute Orchestration Saga
            $orderId = $this->orderService->placeOrder($buyerId, $dto);

            http_response_code(201); // Created
            echo json_encode([
                "message" => "Order placed successfully!",
                "orderId" => $orderId
            ]);
        } catch (Exception $e) {
            http_response_code(400); // Bad Request (stock reservation or payment failed)
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. Fetch logged-in user's orders list
    public function getMyOrders(array $currentUser): void {
        try {
            $buyerId = $currentUser['userId'];
            $orders = $this->orderService->getBuyerOrders($buyerId);
            
            http_response_code(200);
            echo json_encode($orders);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 3. Fetch single order details by ID
    public function getOrderById(int $orderId, array $currentUser): void {
        try {
            $order = $this->orderService->getOrderDetails($orderId, $currentUser);
            
            http_response_code(200);
            echo json_encode($order);
        } catch (Exception $e) {
            http_response_code(404); // Not Found or Access Denied
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 4. Fetch seller orders (raw items)
    public function getSellerOrders(array $currentUser): void {
        try {
            $sellerId = $currentUser['userId'];
            $orders = $this->orderService->getSellerOrders($sellerId);
            
            http_response_code(200);
            echo json_encode($orders);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 5. Fetch grouped incoming orders for a seller
    public function getSellerIncomingOrders(array $currentUser): void {
        try {
            $sellerId = $currentUser['userId'];
            $orders = $this->orderService->getSellerIncomingOrders($sellerId);
            
            http_response_code(200);
            echo json_encode($orders);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 6. Fetch stats for charts
    public function getSellerStats(array $currentUser): void {
        try {
            $sellerId = $currentUser['userId'];
            $stats = $this->orderService->getSellerStats($sellerId);
            
            http_response_code(200);
            echo json_encode($stats);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 7. Seller accepts/completes order
    public function acceptOrder(int $orderId, array $currentUser): void {
        try {
            $sellerId = $currentUser['userId'];
            $this->orderService->acceptOrder($orderId, $sellerId);
            
            http_response_code(200);
            echo json_encode(["message" => "Order accepted and processed successfully!"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
