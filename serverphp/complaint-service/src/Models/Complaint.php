<?php
namespace ComplaintService\Models;

use JsonSerializable;

class Complaint implements JsonSerializable {
    public int $complaintId;
    public int $buyerId;
    public int $sellerId;
    public int $shopId;
    public string $comment;
    public string $createdAt;
    
    // Additional join fields returned by getAll() for the admin panel
    public ?string $buyerName;
    public ?string $buyerEmail;
    public ?string $sellerName;
    public ?string $sellerEmail;
    public ?bool $sellerBlocked;
    public ?string $shopName;
    public ?bool $shopBlocked;

    public function __construct(array $data) {
        $this->complaintId = (int)($data['ComplaintID'] ?? $data['complaintId'] ?? 0);
        $this->buyerId = (int)($data['BuyerID'] ?? $data['buyerId'] ?? 0);
        $this->sellerId = (int)($data['SellerID'] ?? $data['sellerId'] ?? 0);
        $this->shopId = (int)($data['ShopID'] ?? $data['shopId'] ?? 0);
        $this->comment = $data['Comment'] ?? $data['comment'] ?? '';
        $this->createdAt = $data['CreatedAt'] ?? $data['createdAt'] ?? '';

        $this->buyerName = $data['BuyerName'] ?? $data['buyerName'] ?? null;
        $this->buyerEmail = $data['BuyerEmail'] ?? $data['buyerEmail'] ?? null;
        $this->sellerName = $data['SellerName'] ?? $data['sellerName'] ?? null;
        $this->sellerEmail = $data['SellerEmail'] ?? $data['sellerEmail'] ?? null;
        $this->sellerBlocked = isset($data['SellerBlocked']) ? (bool)$data['SellerBlocked'] : (isset($data['sellerBlocked']) ? (bool)$data['sellerBlocked'] : null);
        $this->shopName = $data['ShopName'] ?? $data['shopName'] ?? null;
        $this->shopBlocked = isset($data['ShopBlocked']) ? (bool)$data['ShopBlocked'] : (isset($data['shopBlocked']) ? (bool)$data['shopBlocked'] : null);
    }

    public function jsonSerialize(): array {
        return [
            'ComplaintID' => $this->complaintId,
            'BuyerID' => $this->buyerId,
            'SellerID' => $this->sellerId,
            'ShopID' => $this->shopId,
            'Comment' => $this->comment,
            'CreatedAt' => $this->createdAt,
            'BuyerName' => $this->buyerName,
            'BuyerEmail' => $this->buyerEmail,
            'SellerName' => $this->sellerName,
            'SellerEmail' => $this->sellerEmail,
            'SellerBlocked' => $this->sellerBlocked,
            'ShopName' => $this->shopName,
            'ShopBlocked' => $this->shopBlocked
        ];
    }
}
