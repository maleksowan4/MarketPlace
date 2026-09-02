<?php
namespace UserService\Models;

use JsonSerializable;

class Shop implements JsonSerializable {
    public int $shopId;
    public int $sellerId;
    public string $shopName;
    public ?string $description;
    public ?string $logoUrl;
    public bool $isBlocked;
    public ?string $sellerName; // Merchant name fetched from Users table join

    public function __construct(array $data) {
        $this->shopId = (int)($data['ShopID'] ?? $data['shopId'] ?? 0);
        $this->sellerId = (int)($data['SellerID'] ?? $data['sellerId'] ?? 0);
        $this->shopName = $data['ShopName'] ?? $data['shopName'] ?? '';
        $this->description = $data['Description'] ?? $data['description'] ?? '';
        $this->logoUrl = $data['LogoUrl'] ?? $data['logoUrl'] ?? null;
        $this->isBlocked = (bool)($data['IsBlocked'] ?? $data['isBlocked'] ?? false);
        $this->sellerName = $data['SellerName'] ?? $data['sellerName'] ?? null;
    }

    public function jsonSerialize(): array {
        return [
            'ShopID' => $this->shopId,
            'SellerID' => $this->sellerId,
            'ShopName' => $this->shopName,
            'Description' => $this->description,
            'LogoUrl' => $this->logoUrl,
            'IsBlocked' => $this->isBlocked,
            'SellerName' => $this->sellerName
        ];
    }
}
