<?php
namespace ComplaintService\Controllers;

use ComplaintService\Services\ComplaintService;
use ComplaintService\DTOs\CreateComplaintDTO;
use ComplaintService\DTOs\ResolveComplaintDTO;
use Exception;

class ComplaintController {
    private ComplaintService $complaintService;

    public function __construct() {
        $this->complaintService = new ComplaintService();
    }

    // 1. Submit a complaint ticket (Buyers only)
    public function create(array $currentUser, array $body): void {
        try {
            $dto = new CreateComplaintDTO($body);
            $complaint = $this->complaintService->createComplaint($currentUser, $dto);

            http_response_code(201);
            echo json_encode([
                "message" => "Complaint submitted successfully!",
                "complaint" => $complaint
            ]);
        } catch (Exception $e) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. Buyer lists their own tickets
    public function getMyComplaints(array $currentUser): void {
        try {
            $complaints = $this->complaintService->getBuyerComplaints($currentUser);

            http_response_code(200);
            echo json_encode($complaints);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 3. Admin list of all tickets
    public function getComplaints(array $currentUser): void {
        try {
            $complaints = $this->complaintService->getAdminComplaints($currentUser);

            http_response_code(200);
            echo json_encode($complaints);
        } catch (Exception $e) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 4. Admin resolves a ticket
    public function resolve(array $currentUser, array $body): void {
        try {
            $dto = new ResolveComplaintDTO($body);
            $this->complaintService->resolveComplaint($currentUser, $dto);

            http_response_code(200);
            echo json_encode(["message" => "Complaint marked as resolved successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
