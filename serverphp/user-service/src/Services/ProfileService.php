<?php
namespace UserService\Services;

use UserService\Repositories\ProfileRepository;
use UserService\DTOs\BlockUserDTO;
use UserService\Models\User;
use Exception;

class ProfileService {
    private ProfileRepository $profileRepository;

    public function __construct() {
        $this->profileRepository = new ProfileRepository();
    }

    // 1. Get profile of current user or any public profile
    public function getUserProfile(int $userId): User {
        $user = $this->profileRepository->getProfile($userId);
        if (!$user) {
            throw new Exception("User profile not found.");
        }
        return $user;
    }

    // 2. Admin retrieves all users
    public function getAllUsers(array $currentUser): array {
        $this->verifyAdmin($currentUser);
        return $this->profileRepository->getAllUsers();
    }

    // 3. Admin retrieves all Sellers
    public function getSellers(array $currentUser): array {
        $this->verifyAdmin($currentUser);
        return $this->profileRepository->getSellers();
    }

    // 4. Admin retrieves all Buyers
    public function getBuyers(array $currentUser): array {
        $this->verifyAdmin($currentUser);
        return $this->profileRepository->getBuyers();
    }

    // 5. Admin blocks or unblocks a user
    public function blockUser(array $currentUser, BlockUserDTO $dto): void {
        $this->verifyAdmin($currentUser);

        // Prevent admin from blocking themselves
        if ($currentUser['userId'] === $dto->userId) {
            throw new Exception("You cannot block your own administrative account.");
        }

        $success = $this->profileRepository->updateBlockStatus($dto->userId, $dto->isBlocked);
        if (!$success) {
            throw new Exception("User not found or no changes made.");
        }
    }

    // Helper: Validates if the token user has role ID 1 (Admin)
    private function verifyAdmin(array $user): void {
        if (($user['roleId'] ?? 0) !== 1) {
            throw new Exception("Access denied. Admins only.");
        }
    }
}
