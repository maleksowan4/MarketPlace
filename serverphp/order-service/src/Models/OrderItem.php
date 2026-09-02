<?php
namespace OrderService\Models;

use JsonSerializable;

class OrderItem implements JsonSerializable {
    public int $orderItemId;
    public int $orderId;
    public int $productId;
    public int $quantity;
    public float $price;

    public function __construct(array $data) {
        $this->orderItemId = (int)($data['OrderItemID'] ?? $data['orderItemId'] ?? 0);
        $this->orderId = (int)($data['OrderID'] ?? $data['orderId'] ?? 0);
        $this->productId = (int)($data['ProductID'] ?? $data['productId'] ?? 0);
        $this->quantity = (int)($data['Quantity'] ?? $data['quantity'] ?? 0);
        $this->price = (float)($data['UnitPrice'] ?? $data['unitPrice'] ?? $data['Price'] ?? $data['price'] ?? 0.0);
    }

    public function jsonSerialize(): array {
        return [
            'OrderItemID' => $this->orderItemId,
            'OrderID' => $this->orderId,
            'ProductID' => $this->productId,
            'Quantity' => $this->quantity,
            'Price' => $this->price,
            'UnitPrice' => $this->price
        ];
    }
}
