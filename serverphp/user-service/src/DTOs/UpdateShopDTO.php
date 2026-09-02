<?php
namespace UserService\DTOs;

use Exception;

class UpdateShopDTO {
    public string $shopName;
    public ?string $description;
    public ?string $logoUrl;

    public function __construct(array $data) {
        if (empty($data['shopName'])) {
            throw new Exception("Shop name is required.");
        }
        $this->shopName = trim($data['shopName']);
        $this->description = isset($data['description']) ? trim($data['description']) : null;
        $this->logoUrl = $data['logoUrl'] ?? null;
    }
}
