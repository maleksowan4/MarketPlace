<?php
namespace OrderService\Models;

use JsonSerializable;

class Order implements JsonSerializable {
    public int $orderId;
    public int $buyerId;
    public float $totalPrice;
    public string $status; // 'Pending', 'Completed', 'Failed'
    public string $createdAt;
    public array $items = []; // Can be filled with OrderItem objects

    public function __construct(array $data) {
        $this->orderId = (int)($data['OrderID'] ?? $data['orderId'] ?? 0);
        $this->buyerId = (int)($data['BuyerID'] ?? $data['buyerId'] ?? 0);
        $this->totalPrice = (float)($data['TotalAmount'] ?? $data['totalAmount'] ?? $data['TotalPrice'] ?? $data['totalPrice'] ?? 0.0);
        $this->status = $data['Status'] ?? $data['status'] ?? 'Pending';
        $this->createdAt = $data['CreatedAt'] ?? $data['createdAt'] ?? '';
    }

    public function jsonSerialize(): array {
        return [
            'OrderID' => $this->orderId,
            'BuyerID' => $this->buyerId,
            'TotalAmount' => $this->totalPrice,
            'TotalPrice' => $this->totalPrice, // Fallback safety
            'Status' => $this->status,
            'CreatedAt' => $this->createdAt,
            'Items' => $this->items
        ];
    }
}
