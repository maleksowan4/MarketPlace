USE MarketPlace;
GO

-- Roles
SET IDENTITY_INSERT Roles ON;

INSERT INTO Roles (RoleID, RoleName)
VALUES
    (1, 'Admin'),
    (2, 'Seller'),
    (3, 'Buyer');

SET IDENTITY_INSERT Roles OFF;
GO


-- Users
SET IDENTITY_INSERT Users ON;

INSERT INTO Users
    (UserID, RoleID, Username, Email, PasswordHash, IsBlocked, CreatedAt)
VALUES
    (
        1,
        1,
        'admin',
        'admin@market.com',
        '$2y$10$6KZAS8607QRhMPzlQ4Add.zyka1qFHTutWjBgsmsdYo1c90H9yRZi',
        0,
        GETDATE()
    ),
    (
        2,
        2,
        'malek',
        'malek.sowan10@gmail.com',
        '$2y$10$lI16hc8TkCuEzuAv8mZCcu54R.9e3dwJXLLzjfxjtd6GewFSaXs6a',
        0,
        GETDATE()
    ),
    (
        3,
        3,
        'abadi',
        'abadi@gmail.com',
        '$2y$10$6KZAS8607QRhMPzlQ4Add.zyka1qFHTutWjBgsmsdYo1c90H9yRZi',
        0,
        GETDATE()
    );

SET IDENTITY_INSERT Users OFF;
GO


-- Seller Shop
SET IDENTITY_INSERT Shops ON;

INSERT INTO Shops
    (ShopID, SellerID, ShopName, Description, LogoUrl, IsBlocked, CreatedAt)
VALUES
    (
        1,
        2,
        'Computer Shop',
        'Premier computer and electronics store',
        NULL,
        0,
        GETDATE()
    );

SET IDENTITY_INSERT Shops OFF;
GO


-- Wallets
SET IDENTITY_INSERT Wallets ON;

INSERT INTO Wallets
    (WalletID, UserID, Balance)
VALUES
    (1, 1, 0.00),
    (2, 2, 0.00),
    (3, 3, 500.00);

SET IDENTITY_INSERT Wallets OFF;
GO