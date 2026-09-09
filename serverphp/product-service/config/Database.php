<?php
namespace ProductService\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $conn = null;

    public static function getConnection(): PDO {
        if (self::$conn === null) {
            try {
                $serverName = getenv('DB_HOST') ?: 'localhost';
                $port       = getenv('DB_PORT') ?: '1433';
                $database   = getenv('DB_NAME') ?: 'MarketPlace';
                $user       = getenv('DB_USER') ?: '';
                $password   = getenv('DB_PASSWORD') ?: '';
                
                $serverHost = ($port && $port !== '1433') ? "$serverName,$port" : $serverName;
                $dsn = "sqlsrv:Server=$serverHost;Database=$database;TrustServerCertificate=true";
                
                if (!empty($user)) {
                    self::$conn = new PDO($dsn, $user, $password);
                } else {
                    self::$conn = new PDO($dsn);
                }
                
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
            } catch (PDOException $exception) {
                die("Database connection failed: " . $exception->getMessage());
            }
        }
        return self::$conn;
    }
}
