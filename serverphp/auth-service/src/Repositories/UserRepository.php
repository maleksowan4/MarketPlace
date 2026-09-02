<?php
namespace AuthService\Repositories;

use AuthService\Config\Database;
use AuthService\Models\User;
use PDO;

class UserRepository {
    private PDO $db;

    public function __construct() {
        // Retrieve our single database connection
        $this->db = Database::getConnection();
    }

    // 1. Fetch user by email (used during Login and check duplicate Email)
    public function getUserByEmail(string $email): ?User {
        $stmt = $this->db->prepare("SELECT * FROM Users WHERE Email = :email");
        $stmt->execute([':email' => $email]);
        
        $row = $stmt->fetch();
        if ($row) {
            return new User($row);
        }
        return null;
    }

    // 2. Create a new user (used during Registration)
    public function createUser(string $username, string $email, string $passwordHash, int $roleId): User {
        // Prepare query
        $stmt = $this->db->prepare("
            INSERT INTO Users (RoleID, Username, Email, PasswordHash, CreatedAt)
            VALUES (:roleId, :username, :email, :passwordHash, GETDATE())
        ");
        
        // Execute query
        $stmt->execute([
            ':roleId'       => $roleId,
            ':username'     => $username,
            ':email'        => $email,
            ':passwordHash' => $passwordHash
        ]);

        // Retrieve the auto-increment ID of the user we just inserted
        $newUserId = $this->db->lastInsertId();

        // Query the full details of the newly created user to return it as a Model
        $stmtUser = $this->db->prepare("SELECT * FROM Users WHERE UserID = :userId");
        $stmtUser->execute([':userId' => $newUserId]);
        $row = $stmtUser->fetch();

        return new User($row);
    }
}
