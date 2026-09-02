<?php
namespace ComplaintService\DTOs;

use Exception;

class CreateComplaintDTO {
    public int $shopId;
    public string $comment;

    public function __construct(array $data) {
        $shopId = $data['ShopID'] ?? $data['shopId'] ?? null;
        $comment = $data['comment'] ?? $data['Comment'] ?? $data['description'] ?? null;

        if (empty($shopId)) {
            throw new Exception("Target shopId is required.");
        }
        if (empty($comment) || !trim($comment)) {
            throw new Exception("Complaint comment description is required.");
        }

        $this->shopId = (int)$shopId;
        $this->comment = trim($comment);
    }
}
