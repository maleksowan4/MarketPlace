<?php
namespace OrderService\DTOs;

use Exception;

class CreateOrderDTO {
    public array $items;

    public function __construct(array $data) {
        if (empty($data['items']) || !is_array($data['items'])) {
            throw new Exception("Checkout items are required.");
        }

        $normalizedItems = [];
        foreach ($data['items'] as $index => $item) {
            $productId = $item['ProductID'] ?? $item['productId'] ?? null;
            $quantity = $item['Quantity'] ?? $item['quantity'] ?? null;

            if (empty($productId) || empty($quantity)) {
                throw new Exception("Item at index $index must contain productId and quantity.");
            }
            if ((int)$quantity <= 0) {
                throw new Exception("Quantity for item at index $index must be greater than zero.");
            }

            $normalizedItems[] = [
                'productId' => (int)$productId,
                'quantity' => (int)$quantity,
                'price' => 0.0 // Resolved securely on the backend
            ];
        }

        $this->items = $normalizedItems;
    }
}
