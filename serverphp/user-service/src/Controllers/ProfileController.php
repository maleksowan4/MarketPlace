<?php
namespace UserService\Controllers;

use UserService\Services\ProfileService;
use UserService\DTOs\BlockUserDTO;
use Exception;

class ProfileController {
    private ProfileService $profileService;

    public function __construct() {
        $this->profileService = new ProfileService();
    }

    // 1. Get profile of currently logged-in user
    public function getMyProfile(array $currentUser): void {
        try {
            $profile = $this->profileService->getUserProfile($currentUser['userId']);
            
            http_response_code(200);
            echo json_encode($profile);
        } catch (Exception $e) {
            http_response_code(404); // Not Found
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 2. Get profile of user by ID
    public function getProfileById(int $userId): void {
        try {
            $profile = $this->profileService->getUserProfile($userId);
            
            http_response_code(200);
            echo json_encode($profile);
        } catch (Exception $e) {
            http_response_code(404);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 3. Admin gets all users
    public function getAllUsers(array $currentUser): void {
        try {
            $users = $this->profileService->getAllUsers($currentUser);
            
            http_response_code(200);
            echo json_encode($users);
        } catch (Exception $e) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 4. Admin gets sellers list
    public function getSellers(array $currentUser): void {
        try {
            $sellers = $this->profileService->getSellers($currentUser);
            http_response_code(200);
            echo json_encode($sellers);
        } catch (Exception $e) {
            http_response_code(403);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 5. Admin gets buyers list
    public function getBuyers(array $currentUser): void {
        try {
            $buyers = $this->profileService->getBuyers($currentUser);
            http_response_code(200);
            echo json_encode($buyers);
        } catch (Exception $e) {
            http_response_code(403);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // 6. Admin blocks user
    public function blockUser(array $currentUser, array $body): void {
        try {
            $dto = new BlockUserDTO($body);
            $this->profileService->blockUser($currentUser, $dto);
            
            http_response_code(200);
            echo json_encode(["message" => "User block status updated successfully."]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
