USE master;
GO

IF DB_ID(N'MarketPlace') IS NULL
BEGIN
    CREATE DATABASE MarketPlace;
END
GO

USE MarketPlace;
GO

-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) NOT NULL,
    RoleName VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Roles PRIMARY KEY (RoleID),
    CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName)
);
GO

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) NOT NULL,
    RoleID INT NOT NULL,
    Username VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    IsBlocked BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Users PRIMARY KEY (UserID),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (RoleID)
        REFERENCES Roles(RoleID)
);
GO

-- =========================================================
-- SHOPS
-- =========================================================

CREATE TABLE Shops (
    ShopID INT IDENTITY(1,1) NOT NULL,
    SellerID INT NOT NULL,
    ShopName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    LogoUrl VARCHAR(255) NULL,
    IsBlocked BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Shops PRIMARY KEY (ShopID),
    CONSTRAINT FK_Shops_Users
        FOREIGN KEY (SellerID)
        REFERENCES Users(UserID)
);
GO

-- =========================================================
-- PRODUCTS
-- =========================================================

CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) NOT NULL,
    SellerID INT NOT NULL,
    ProductName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    Price DECIMAL(10,2) NOT NULL,
    Quantity INT NOT NULL,
    ImageUrl VARCHAR(255) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Products PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Users
        FOREIGN KEY (SellerID)
        REFERENCES Users(UserID)
);
GO

-- =========================================================
-- ORDERS
-- =========================================================

CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) NOT NULL,
    BuyerID INT NOT NULL,
    OrderDate DATETIME NULL DEFAULT GETDATE(),
    Status VARCHAR(30) NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL,

    CONSTRAINT PK_Orders PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Users
        FOREIGN KEY (BuyerID)
        REFERENCES Users(UserID)
);
GO

-- =========================================================
-- ORDER ITEMS
-- =========================================================

CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) NOT NULL,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,

    CONSTRAINT PK_OrderItems PRIMARY KEY (OrderItemID),
    CONSTRAINT FK_OrderItems_Orders
        FOREIGN KEY (OrderID)
        REFERENCES Orders(OrderID),

    CONSTRAINT FK_OrderItems_Products
        FOREIGN KEY (ProductID)
        REFERENCES Products(ProductID)
);
GO

CREATE NONCLUSTERED INDEX IX_OrderItems_Order_Product
ON OrderItems(OrderID, ProductID);
GO

-- =========================================================
-- WALLETS
-- =========================================================

CREATE TABLE Wallets (
    WalletID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    Balance DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT PK_Wallets PRIMARY KEY (WalletID),
    CONSTRAINT UQ_Wallets_UserID UNIQUE (UserID),

    CONSTRAINT FK_Wallets_Users
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
);
GO

-- =========================================================
-- WALLET TRANSACTIONS
-- =========================================================

CREATE TABLE WalletTransactions (
    TransactionID INT IDENTITY(1,1) NOT NULL,
    WalletID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    TransactionType VARCHAR(20) NOT NULL,
    ReferenceID INT NULL,
    Description VARCHAR(255) NULL,
    TransactionDate DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_WalletTransactions PRIMARY KEY (TransactionID),

    CONSTRAINT FK_WalletTransactions_Wallets
        FOREIGN KEY (WalletID)
        REFERENCES Wallets(WalletID)
);
GO

-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE AuditLogs (
    LogID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    Action VARCHAR(100) NOT NULL,
    TableName VARCHAR(50) NOT NULL,
    CreatedAt DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_AuditLogs PRIMARY KEY (LogID),

    CONSTRAINT FK_AuditLogs_Users
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
);
GO

-- =========================================================
-- COMPLAINTS
-- =========================================================

CREATE TABLE Complaints (
    ComplaintID INT IDENTITY(1,1) NOT NULL,
    BuyerID INT NOT NULL,
    SellerID INT NOT NULL,
    ShopID INT NOT NULL,
    Comment VARCHAR(1000) NOT NULL,
    CreatedAt DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Complaints PRIMARY KEY (ComplaintID),

    CONSTRAINT FK_Complaints_Buyer
        FOREIGN KEY (BuyerID)
        REFERENCES Users(UserID),

    CONSTRAINT FK_Complaints_Seller
        FOREIGN KEY (SellerID)
        REFERENCES Users(UserID),

    CONSTRAINT FK_Complaints_Shop
        FOREIGN KEY (ShopID)
        REFERENCES Shops(ShopID)
);
GO

-- =========================================================
-- VIEW
-- =========================================================

CREATE VIEW UserListView
AS
SELECT Username, Email
FROM Users;
GO

-- =========================================================
-- FUNCTIONS
-- =========================================================

CREATE FUNCTION GetTotalPrice(@OrderID INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @Total DECIMAL(10,2);

    SELECT @Total = SUM(UnitPrice * Quantity)
    FROM OrderItems
    WHERE OrderID = @OrderID;

    RETURN ISNULL(@Total, 0);
END;
GO

CREATE FUNCTION GetOrderItems(@OrderID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT *
    FROM OrderItems
    WHERE OrderID = @OrderID
);
GO

-- =========================================================
-- STORED PROCEDURES
-- =========================================================

CREATE PROCEDURE GetProductsBySeller
    @SellerID INT
AS
BEGIN
    SELECT ProductName, Price
    FROM Products
    WHERE SellerID = @SellerID;
END;
GO

CREATE PROCEDURE GetUserByEmail
    @Email VARCHAR(255)
AS
BEGIN
    SELECT *
    FROM Users
    WHERE Email = @Email;
END;
GO