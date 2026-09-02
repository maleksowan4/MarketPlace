<?php
namespace ProductService\Controllers;

use ProductService\Services\ProductService;
use ProductService\DTOs\CreateProductDTO;
use ProductService\DTOs\UpdateProductDTO;
use ProductService\DTOs\ReserveStockDTO;
use ProductService\DTOs\ReleaseStockDTO;
use Exception;

class ProductController {
    private ProductService $productService;

    public function __construct() {
        $this->productService = new ProductService();
    }

    // 1. Get all active products
    public function getAllProducts(): void {
        try {
            $products = $this->productService->getAllProducts();
            http_response_code(200);
            echo json_encode($products);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. Get product details by ID
    public function getProductById(int $productId): void {
        try {
            $product = $this->productService->getProductById($productId);
            http_response_code(200);
            echo json_encode($product);
        } catch (Exception $e) {
            http_response_code(404);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 3. Get seller's own products
    public function getMyProducts(array $currentUser): void {
        try {
            $products = $this->productService->getProductsBySeller($currentUser);
            http_response_code(200);
            echo json_encode($products);
        } catch (Exception $e) {
            http_response_code(403);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 4. Get products of a specific shop (paginated)
    public function getProductsByShop(int $shopId, array $queryParams): void {
        try {
            $page = isset($queryParams['page']) ? (int)$queryParams['page'] : 1;
            $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 100;

            $products = $this->productService->getProductsByShop($shopId, $page, $limit);
            http_response_code(200);
            echo json_encode($products);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 5. Create a new product (handles image uploads)
    public function createProduct(array $currentUser, array $body): void {
        try {
            $imageUrl = null;

            // Handle image file upload
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $tempPath = $_FILES['image']['tmp_name'];
                $fileName = time() . '_' . basename($_FILES['image']['name']);
                
                $uploadDir = __DIR__ . '/../../public/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $targetPath = $uploadDir . $fileName;
                if (move_uploaded_file($tempPath, $targetPath)) {
                    $imageUrl = '/uploads/' . $fileName;
                }
            }

            $body['imageUrl'] = $imageUrl;
            $dto = new CreateProductDTO($body);

            $newProduct = $this->productService->createProduct($currentUser, $dto);

            http_response_code(201); // Created
            echo json_encode([
                "message" => "Product created successfully!",
                "product" => $newProduct
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 6. Update product (handles image uploads)
    public function updateProduct(int $productId, array $currentUser, array $body): void {
        try {
            $imageUrl = null;

            // Handle image file upload if updated
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $tempPath = $_FILES['image']['tmp_name'];
                $fileName = time() . '_' . basename($_FILES['image']['name']);
                
                $uploadDir = __DIR__ . '/../../public/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $targetPath = $uploadDir . $fileName;
                if (move_uploaded_file($tempPath, $targetPath)) {
                    $imageUrl = '/uploads/' . $fileName;
                }
            }

            // Put image URL into body if uploaded
            if ($imageUrl !== null) {
                $body['imageUrl'] = $imageUrl;
            }
            
            $dto = new UpdateProductDTO($body);

            $updatedProduct = $this->productService->updateProduct($productId, $currentUser, $dto);

            http_response_code(200);
            echo json_encode([
                "message" => "Product updated successfully!",
                "product" => $updatedProduct
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 7. Delete product (soft delete)
    public function deleteProduct(int $productId, array $currentUser): void {
        try {
            $this->productService->deleteProduct($productId, $currentUser);
            http_response_code(200);
            echo json_encode(["message" => "Product deleted successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 8. Reserve stock (Saga Checkout Step)
    public function reserveStock(array $body): void {
        try {
            $dto = new ReserveStockDTO($body);
            $this->productService->reserveStock($dto);

            http_response_code(200);
            echo json_encode(["message" => "Stock reserved successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 9. Release stock (Saga Compensating Step)
    public function releaseStock(array $body): void {
        try {
            $dto = new ReleaseStockDTO($body);
            $this->productService->releaseStock($dto);

            http_response_code(200);
            echo json_encode(["message" => "Stock released successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
