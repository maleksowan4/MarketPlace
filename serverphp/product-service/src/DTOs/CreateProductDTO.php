<?php
namespace ProductService\DTOs;

use Exception;

class CreateProductDTO {
    public string $productName;
    public ?string $description;
    public float $price;
    public int $quantity;
    public ?string $imageUrl;

    public function __construct(array $data) {
        if (empty($data['productName'])) {
            throw new Exception("Product name is required.");
        }
        if (!isset($data['price']) || (float)$data['price'] <= 0) {
            throw new Exception("Price must be a positive number.");
        }
        if (!isset($data['quantity']) || (int)$data['quantity'] < 0) {
            throw new Exception("Quantity cannot be negative.");
        }

        $this->productName = trim($data['productName']);
        $this->description = isset($data['description']) ? trim($data['description']) : null;
        $this->price = (float)$data['price'];
        $this->quantity = (int)$data['quantity'];
        $this->imageUrl = $data['imageUrl'] ?? null;
    }
}
