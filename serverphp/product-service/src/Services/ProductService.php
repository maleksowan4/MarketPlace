<?php
namespace ProductService\Services;

use ProductService\Config\Database;
use ProductService\Repositories\ProductRepository;
use ProductService\DTOs\CreateProductDTO;
use ProductService\DTOs\UpdateProductDTO;
use ProductService\DTOs\ReserveStockDTO;
use ProductService\DTOs\ReleaseStockDTO;
use ProductService\Models\Product;
use Exception;
use PDO;

class ProductService {
    private ProductRepository $productRepository;

    public function __construct() {
        $this->productRepository = new ProductRepository();
    }

    // 1. Get all active products
    public function getAllProducts(): array {
        return $this->productRepository->getAllActive();
    }

    // 2. Get single product by ID
    public function getProductById(int $productId): Product {
        $product = $this->productRepository->getById($productId);
        if (!$product || $product->isDeleted) {
            throw new Exception("Product not found.");
        }
        return $product;
    }

    // 3. Get seller's own products
    public function getProductsBySeller(array $currentUser): array {
        if (($currentUser['roleId'] ?? 0) !== 2) {
            throw new Exception("Access denied. Sellers only.");
        }
        return $this->productRepository->getBySellerId($currentUser['userId']);
    }

    // 4. Browse products by ShopID (paginated)
    public function getProductsByShop(int $shopId, int $page, int $limit): array {
        $page = max(1, $page);
        $limit = max(1, min(100, $limit)); // Cap pagination to max 100 products per page
        $offset = ($page - 1) * $limit;

        return $this->productRepository->getByShopId($shopId, $offset, $limit);
    }

    // 5. Seller creates product
    public function createProduct(array $currentUser, CreateProductDTO $dto): Product {
        if (($currentUser['roleId'] ?? 0) !== 2) {
            throw new Exception("Access denied. Sellers only.");
        }
        return $this->productRepository->create(
            $currentUser['userId'],
            $dto->productName,
            $dto->description,
            $dto->price,
            $dto->quantity,
            $dto->imageUrl
        );
    }

    // 6. Seller updates product
    public function updateProduct(int $productId, array $currentUser, UpdateProductDTO $dto): Product {
        if (($currentUser['roleId'] ?? 0) !== 2) {
            throw new Exception("Access denied. Sellers only.");
        }

        // Verify product exists and belongs to this seller
        $existing = $this->productRepository->getById($productId);
        if (!$existing || $existing->isDeleted) {
            throw new Exception("Product not found.");
        }
        if ($existing->sellerId !== $currentUser['userId']) {
            throw new Exception("Access denied. You do not own this product.");
        }

        return $this->productRepository->update(
            $productId,
            $currentUser['userId'],
            $dto->productName,
            $dto->description,
            $dto->price,
            $dto->quantity,
            $dto->imageUrl
        );
    }

    // 7. Delete product (Seller owns it, or user is Admin)
    public function deleteProduct(int $productId, array $currentUser): void {
        $existing = $this->productRepository->getById($productId);
        if (!$existing || $existing->isDeleted) {
            throw new Exception("Product not found.");
        }

        // If administrator: delete directly
        if (($currentUser['roleId'] ?? 0) === 1) {
            $this->productRepository->adminDelete($productId);
            return;
        }

        // If seller: verify ownership
        if (($currentUser['roleId'] ?? 0) === 2) {
            if ($existing->sellerId !== $currentUser['userId']) {
                throw new Exception("Access denied. You do not own this product.");
            }
            $this->productRepository->softDelete($productId, $currentUser['userId']);
            return;
        }

        throw new Exception("Access denied. Unauthorized action.");
    }

    // 8. reserveStock (Saga Checkout Step) - Deducts stock quantity atomically
    public function reserveStock(ReserveStockDTO $dto): void {
        $pdo = Database::getConnection();
        $pdo->beginTransaction(); // Start SQL Transaction

        try {
            foreach ($dto->items as $item) {
                $productId = (int)$item['productId'];
                $qtyToReserve = (int)$item['quantity'];

                // 1. Fetch current product details
                $product = $this->productRepository->getById($productId);
                if (!$product || $product->isDeleted) {
                    throw new Exception("Product ID $productId not found or has been removed.");
                }

                // 2. Validate inventory level
                if ($product->quantity < $qtyToReserve) {
                    throw new Exception("Insufficient stock for product '{$product->productName}'. Available: {$product->quantity}, Requested: $qtyToReserve.");
                }

                // 3. Deduct stock and update database
                $newQty = $product->quantity - $qtyToReserve;
                $this->productRepository->updateStock($productId, $newQty);
            }

            $pdo->commit(); // Commit all updates if successful
        } catch (Exception $e) {
            $pdo->rollBack(); // Roll back database to original state if any step fails
            throw $e;
        }
    }

    // 9. releaseStock (Saga Compensating Step) - Restores stock quantity atomically
    public function releaseStock(ReleaseStockDTO $dto): void {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            foreach ($dto->items as $item) {
                $productId = (int)$item['productId'];
                $qtyToRelease = (int)$item['quantity'];

                $product = $this->productRepository->getById($productId);
                if (!$product) {
                    continue; // Skip if product doesn't exist anymore
                }

                // Restore stock
                $newQty = $product->quantity + $qtyToRelease;
                $this->productRepository->updateStock($productId, $newQty);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
