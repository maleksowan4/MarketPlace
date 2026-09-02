<?php
namespace ProductService\DTOs;

use Exception;

class ReserveStockDTO {
    public array $items;

    public function __construct(array $data) {
        if (empty($data['items']) || !is_array($data['items'])) {
            throw new Exception("Items array is required for stock reservation.");
        }

        $normalizedItems = [];
        foreach ($data['items'] as $index => $item) {
            $productId = $item['ProductID'] ?? $item['productId'] ?? null;
            $quantity = $item['Quantity'] ?? $item['quantity'] ?? null;

            if (empty($productId) || empty($quantity)) {
                throw new Exception("Item at index $index is missing productId or quantity.");
            }
            if ((int)$quantity <= 0) {
                throw new Exception("Item quantity at index $index must be greater than zero.");
            }

            $normalizedItems[] = [
                'productId' => (int)$productId,
                'quantity' => (int)$quantity
            ];
        }

        $this->items = $normalizedItems;
    }
}
