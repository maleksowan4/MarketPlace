<?php
namespace ProductService\Models;

use JsonSerializable;

class Product implements JsonSerializable {
    public int $productId;
    public int $sellerId;
    public string $productName;
    public ?string $description;
    public float $price;
    public int $quantity;
    public ?string $imageUrl;
    public bool $isDeleted;
    public string $createdAt;

    public function __construct(array $data) {
        $this->productId = (int)($data['ProductID'] ?? $data['productId'] ?? 0);
        $this->sellerId = (int)($data['SellerID'] ?? $data['sellerId'] ?? 0);
        $this->productName = $data['ProductName'] ?? $data['productName'] ?? '';
        $this->description = $data['Description'] ?? $data['description'] ?? '';
        $this->price = (float)($data['Price'] ?? $data['price'] ?? 0.0);
        $this->quantity = (int)($data['Quantity'] ?? $data['quantity'] ?? 0);
        $this->imageUrl = $data['ImageUrl'] ?? $data['imageUrl'] ?? null;
        $this->isDeleted = (bool)($data['IsDeleted'] ?? $data['isDeleted'] ?? false);
        $this->createdAt = $data['CreatedAt'] ?? $data['createdAt'] ?? '';
    }

    public function jsonSerialize(): array {
        return [
            'ProductID' => $this->productId,
            'SellerID' => $this->sellerId,
            'ProductName' => $this->productName,
            'Description' => $this->description,
            'Price' => $this->price,
            'Quantity' => $this->quantity,
            'ImageUrl' => $this->imageUrl,
            'IsDeleted' => $this->isDeleted,
            'CreatedAt' => $this->createdAt
        ];
    }
}
