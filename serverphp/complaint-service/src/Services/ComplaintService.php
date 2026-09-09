<?php
namespace ComplaintService\Services;

use ComplaintService\Repositories\ComplaintRepository;
use ComplaintService\DTOs\CreateComplaintDTO;
use ComplaintService\DTOs\ResolveComplaintDTO;
use ComplaintService\Models\Complaint;
use Exception;

class ComplaintService {
    private ComplaintRepository $complaintRepository;
    private string $userServiceUrl;

    public function __construct() {
        $this->complaintRepository = new ComplaintRepository();
        $this->userServiceUrl = rtrim(getenv('USER_SERVICE_URL') ?: 'http://localhost:5002', '/');
    }

    // 1. Buyer files a complaint
    public function createComplaint(array $currentUser, CreateComplaintDTO $dto): Complaint {
        // Enforce buyer role restriction (RoleID = 3)
        if (($currentUser['roleId'] ?? 0) !== 3) {
            throw new Exception("Access denied. Only buyers can file complaints.");
        }

        // Query the User/Shop Service to look up the SellerID of this shop
        $shopServiceUrl = $this->userServiceUrl . "/api/shops/" . $dto->shopId;
        $shopResult = $this->sendCurlRequest($shopServiceUrl, "GET");

        if ($shopResult['status'] !== 200) {
            throw new Exception("Target shop not found or service unavailable.");
        }

        $shopData = $shopResult['body'];
        $sellerId = $shopData['SellerID'] ?? $shopData['sellerId'] ?? null;

        if ($sellerId === null) {
            throw new Exception("Unable to resolve Seller ID for shop " . $dto->shopId);
        }

        return $this->complaintRepository->create(
            $currentUser['userId'],
            (int)$sellerId,
            $dto->shopId,
            $dto->comment
        );
    }

    // 2. Buyer retrieves their own complaints list
    public function getBuyerComplaints(array $currentUser): array {
        if (($currentUser['roleId'] ?? 0) !== 3) {
            throw new Exception("Access denied. Only buyers can view their complaints.");
        }
        return $this->complaintRepository->getByBuyerId($currentUser['userId']);
    }

    // 3. Admin lists all complaints
    public function getAdminComplaints(array $currentUser): array {
        $this->verifyAdmin($currentUser);
        return $this->complaintRepository->getAll();
    }

    // 4. Admin resolves a complaint
    public function resolveComplaint(array $currentUser, ResolveComplaintDTO $dto): void {
        $this->verifyAdmin($currentUser);

        $success = $this->complaintRepository->updateStatus($dto->complaintId, "Resolved");
        if (!$success) {
            throw new Exception("Complaint not found or already resolved.");
        }
    }

    // Helper: Validates if the token user has role ID 1 (Admin)
    private function verifyAdmin(array $user): void {
        if (($user['roleId'] ?? 0) !== 1) {
            throw new Exception("Access denied. Admins only.");
        }
    }

    // Helper: Sends cURL HTTP request
    private function sendCurlRequest(string $url, string $method, array $data = []): array {
        $ch = curl_init($url);
        $jsonData = json_encode($data);
        
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($method !== "GET" && !empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . ($method !== "GET" ? strlen($jsonData) : 0)
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decodedResponse = json_decode($response, true) ?? [];

        return [
            "status" => $httpCode,
            "body" => $decodedResponse
        ];
    }
}
