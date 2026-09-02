<?php
namespace ComplaintService\DTOs;

use Exception;

class ResolveComplaintDTO {
    public int $complaintId;

    public function __construct(array $data) {
        if (!isset($data['complaintId'])) {
            throw new Exception("complaintId is required.");
        }
        $this->complaintId = (int)$data['complaintId'];
    }
}
