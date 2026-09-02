<?php
namespace UserService\Controllers;

use UserService\Services\ShopService;
use UserService\DTOs\UpdateShopDTO;
use UserService\DTOs\BlockShopDTO;
use Exception;

class ShopController {
    private ShopService $shopService;

    public function __construct() {
        $this->shopService = new ShopService();
    }

    // 1. List all active shops
    public function getAllShops(): void {
        try {
            $shops = $this->shopService->getAllActiveShops();
            http_response_code(200);
            echo json_encode($shops);
        } catch (Exception $e) {
            http_response_code(500); // Server error
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. Get shop details by ShopID
    public function getShopById(int $shopId): void {
        try {
            $shop = $this->shopService->getShopById($shopId);
            http_response_code(200);
            echo json_encode($shop);
        } catch (Exception $e) {
            http_response_code(404); // Not Found
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 3. Get currently logged-in seller's shop
    public function getMyShop(array $currentUser): void {
        try {
            $sellerId = $currentUser['userId'];
            $shop = $this->shopService->getShopBySellerId($sellerId);
            http_response_code(200);
            echo json_encode($shop);
        } catch (Exception $e) {
            http_response_code(404);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 4. Update shop settings (handles logo uploads)
    public function updateMyShop(array $currentUser, array $body): void {
        try {
            $sellerId = $currentUser['userId'];
            $logoUrl = null;

            // Handle file upload if a logo file is present in the request
            if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                $tempPath = $_FILES['logo']['tmp_name'];
                
                // Create a unique filename to prevent overwrites
                $fileName = time() . '_' . basename($_FILES['logo']['name']);
                
                // Ensure target uploads folder exists in public/uploads/
                $uploadDir = __DIR__ . '/../../public/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $targetPath = $uploadDir . $fileName;

                // Move file from temporary directory to target directory
                if (move_uploaded_file($tempPath, $targetPath)) {
                    $logoUrl = '/uploads/' . $fileName;
                }
            }

            // Combine form inputs and upload URL into a DTO payload
            $body['logoUrl'] = $logoUrl;
            $dto = new UpdateShopDTO($body);

            $updatedShop = $this->shopService->updateShop($sellerId, $dto);

            http_response_code(200);
            echo json_encode([
                "message" => "Shop updated successfully!",
                "shop" => $updatedShop
            ]);
        } catch (Exception $e) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 5. Admin blocks shop
    public function blockShop(array $currentUser, array $body): void {
        try {
            $dto = new BlockShopDTO($body);
            $this->shopService->blockShop($currentUser, $dto);

            http_response_code(200);
            echo json_encode(["message" => "Shop block status updated successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
