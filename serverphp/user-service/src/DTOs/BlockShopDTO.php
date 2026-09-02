<?php
namespace UserService\DTOs;

use Exception;

class BlockShopDTO {
    public int $shopId;
    public bool $isBlocked;

    public function __construct(array $data) {
        if (!isset($data['shopId']) || !isset($data['isBlocked'])) {
            throw new Exception("shopId and isBlocked fields are required.");
        }
        $this->shopId = (int)$data['shopId'];
        $this->isBlocked = (bool)$data['isBlocked'];
    }
}
