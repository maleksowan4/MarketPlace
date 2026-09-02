<?php
namespace UserService\Services;

use UserService\Repositories\ShopRepository;
use UserService\DTOs\UpdateShopDTO;
use UserService\DTOs\BlockShopDTO;
use UserService\Models\Shop;
use Exception;

class ShopService {
    private ShopRepository $shopRepository;

    public function __construct() {
        $this->shopRepository = new ShopRepository();
    }

    // 1. Get all active shops for customers
    public function getAllActiveShops(): array {
        return $this->shopRepository->getAllActive();
    }

    // 2. Get shop details by ID
    public function getShopById(int $shopId): Shop {
        $shop = $this->shopRepository->getById($shopId);
        if (!$shop) {
            throw new Exception("Shop not found.");
        }
        return $shop;
    }

    // 3. Get shop details for currently logged-in seller
    public function getShopBySellerId(int $sellerId): Shop {
        $shop = $this->shopRepository->getBySellerId($sellerId);
        if (!$shop) {
            throw new Exception("Shop profile not found for this merchant.");
        }
        return $shop;
    }

    // 4. Update shop settings (Sellers only)
    public function updateShop(int $sellerId, UpdateShopDTO $dto): Shop {
        // Retrieve existing shop first
        $shop = $this->shopRepository->getBySellerId($sellerId);
        if (!$shop) {
            throw new Exception("Shop profile not found.");
        }

        return $this->shopRepository->update(
            $sellerId,
            $dto->shopName,
            $dto->description,
            $dto->logoUrl
        );
    }

    // 5. Admin blocks or unblocks a shop
    public function blockShop(array $currentUser, BlockShopDTO $dto): void {
        if (($currentUser['roleId'] ?? 0) !== 1) {
            throw new Exception("Access denied. Admins only.");
        }

        $success = $this->shopRepository->updateBlockStatus($dto->shopId, $dto->isBlocked);
        if (!$success) {
            throw new Exception("Shop not found or no changes made.");
        }
    }
}
