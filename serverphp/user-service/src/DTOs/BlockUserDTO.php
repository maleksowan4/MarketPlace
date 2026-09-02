<?php
namespace UserService\DTOs;

use Exception;

class BlockUserDTO {
    public int $userId;
    public bool $isBlocked;

    public function __construct(array $data) {
        if (!isset($data['userId']) || !isset($data['isBlocked'])) {
            throw new Exception("userId and isBlocked fields are required.");
        }
        $this->userId = (int)$data['userId'];
        $this->isBlocked = (bool)$data['isBlocked'];
    }
}
