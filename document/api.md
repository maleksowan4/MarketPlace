# Marketplace Application: API Integration Guide

This document acts as the single source of truth for integrating your React frontend with the Express backend.

---

## 1. Quick Reference Table

| Method | Endpoint | Auth Required? | Allowed Role | Request Body | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **POST** | `/api/users` | No | All | `{ username, email, password, role }` | Register user and initialize wallet/shop |
| **POST** | `/api/users/login` | No | All | `{ email, password }` | Authenticate user and obtain JWT token |
| **GET** | `/api/users/profile` | Yes (JWT) | All | None | Fetch profile info (name, email, role) |
| **GET** | `/api/shops` | No | All | None | Retrieve list of all shops |
| **GET** | `/api/shops/:id` | No | All | None | Retrieve metadata of a single shop |
| **GET** | `/api/shops/:id/products` | No | All | None | Retrieve all products for a specific shop |
| **PUT** | `/api/shops/my-shop` | Yes (JWT) | Seller | `{ shopName, description }` | Update seller's own shop details |
| **GET** | `/api/products/seller` | Yes (JWT) | Seller | None | Retrieve all products owned by logged-in seller |
| **POST** | `/api/products` | Yes (JWT) | Seller | `{ productName, description, price, quantity }` | Add a new product |
| **PUT** | `/api/products/:id` | Yes (JWT) | Seller | `{ productName, description, price, quantity }` | Update details of a product you own |
| **DELETE** | `/api/products/:id` | Yes (JWT) | Seller | None | Remove a product you own |
| **GET** | `/api/wallet` | Yes (JWT) | All | None | View current wallet balance |
| **POST** | `/api/wallet/deposit` | Yes (JWT) | All | `{ amount }` | Add funds directly to your wallet balance |
| **POST** | `/api/orders` | Yes (JWT) | Buyer | `{ sellerId, items: [{ productId, quantity }] }` | Place order for a shop-specific cart |
| **GET** | `/api/orders/buyer` | Yes (JWT) | Buyer | None | Fetch past orders (Buyer history) |
| **GET** | `/api/orders/seller` | Yes (JWT) | Seller | None | Fetch incoming shop orders (Seller dashboard) |
| **PUT** | `/api/orders/:id/accept` | Yes (JWT) | Seller | None | Accept/fulfill an incoming order |

---

## 2. Detailed Endpoint Specifications

### Authentication & Users

#### Register User
* **Endpoint:** `POST /api/users`
* **Body Format:**
  ```json
  {
    "username": "Malek",
    "email": "malek@example.com",
    "password": "password123",
    "role": "seller" 
  }
  ```
  *(Role can be `"seller"` or `"buyer"`)*
* **Success Response (201 Created):**
  ```text
  "User registered successfully!"
  ```

#### Login User
* **Endpoint:** `POST /api/users/login`
* **Body Format:**
  ```json
  {
    "email": "malek@example.com",
    "password": "password123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "message": "Login successful!",
    "token": "eyJhbGciOi...",
    "user": {
      "userId": 5,
      "username": "Malek",
      "email": "malek@example.com",
      "roleId": 2
    }
  }
  ```

#### Fetch Current User Profile
* **Endpoint:** `GET /api/users/profile`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  {
    "UserID": 5,
    "Username": "Malek",
    "Email": "malek@example.com",
    "RoleName": "Seller"
  }
  ```

---

### Shops Management

#### List All Shops
* **Endpoint:** `GET /api/shops`
* **Success Response (200 OK):**
  ```json
  [
    {
      "ShopID": 1,
      "SellerID": 5,
      "ShopName": "Malek's Shop",
      "Description": "Welcome to my shop!",
      "SellerName": "Malek"
    }
  ]
  ```

#### Fetch Shop Details
* **Endpoint:** `GET /api/shops/:id`
* **Success Response (200 OK):**
  ```json
  {
    "ShopID": 1,
    "SellerID": 5,
    "ShopName": "Malek's Shop",
    "Description": "Welcome to my shop!",
    "SellerName": "Malek"
  }
  ```

#### Fetch Shop Products
* **Endpoint:** `GET /api/shops/:id/products`
* **Success Response (200 OK):**
  ```json
  [
    {
      "ProductID": 12,
      "SellerID": 5,
      "ProductName": "Laptop Keyboard",
      "Description": "Mechanical gaming keyboard",
      "Price": 45.00,
      "Quantity": 15,
      "CreatedAt": "2026-06-17T09:20:00.000Z"
    }
  ]
  ```

#### Update Shop Profile
* **Endpoint:** `PUT /api/shops/my-shop`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Body Format:**
  ```json
  {
    "shopName": "Malek's Hardware Store",
    "description": "Premium electronics and components"
  }
  ```
* **Success Response (200 OK):**
  ```text
  "Shop updated successfully!"
  ```

---

### Products Catalog

#### Fetch Seller's Own Products
* **Endpoint:** `GET /api/products/seller`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "ProductID": 12,
      "SellerID": 5,
      "ProductName": "Laptop Keyboard",
      "Description": "Mechanical gaming keyboard",
      "Price": 45.00,
      "Quantity": 15,
      "CreatedAt": "2026-06-17T09:20:00.000Z"
    }
  ]
  ```

#### Add New Product
* **Endpoint:** `POST /api/products`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Body Format:**
  ```json
  {
    "productName": "Bluetooth Speaker",
    "description": "Waterproof portable speaker",
    "price": 29.99,
    "quantity": 50
  }
  ```
* **Success Response (200 OK):**
  ```text
  "Product added successfully!"
  ```

#### Update Product
* **Endpoint:** `PUT /api/products/:id`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Body Format:**
  ```json
  {
    "productName": "Bluetooth Speaker V2",
    "description": "Upgraded waterproof speaker",
    "price": 34.99,
    "quantity": 45
  }
  ```
* **Success Response (200 OK):**
  ```text
  "Product updated successfully!"
  ```

#### Delete Product
* **Endpoint:** `DELETE /api/products/:id`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```text
  "Product deleted successfully!"
  ```

---

### Wallet & Balance

#### View Balance
* **Endpoint:** `GET /api/wallet`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  {
    "WalletID": 3,
    "UserID": 5,
    "Balance": 150.00
  }
  ```

#### Deposit Money
* **Endpoint:** `POST /api/wallet/deposit`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Body Format:**
  ```json
  {
    "amount": 50.00
  }
  ```
* **Success Response (200 OK):**
  ```text
  "Deposit successful! New balance: 200.00"
  ```

---

### Orders & Checkout

#### Checkout Shop Cart
* **Endpoint:** `POST /api/orders`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Body Format:**
  ```json
  {
    "sellerId": 5,
    "items": [
      { "productId": 12, "quantity": 2 },
      { "productId": 14, "quantity": 1 }
    ]
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "message": "Order placed successfully!",
    "orderId": 28,
    "totalCost": 124.99
  }
  ```

#### Fetch Buyer Order History
* **Endpoint:** `GET /api/orders/buyer`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "OrderID": 28,
      "OrderDate": "2026-06-17T10:30:00.000Z",
      "Status": "Pending",
      "TotalAmount": 124.99
    }
  ]
  ```

#### Fetch Seller Incoming Dashboard
* **Endpoint:** `GET /api/orders/seller`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "OrderID": 28,
      "OrderDate": "2026-06-17T10:30:00.000Z",
      "Status": "Pending",
      "Quantity": 2,
      "UnitPrice": 45.00,
      "ProductName": "Laptop Keyboard",
      "ProductID": 12,
      "BuyerName": "Malek"
    }
  ]
  ```

#### Accept Order (Seller)
* **Endpoint:** `PUT /api/orders/:id/accept`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```text
  "Order accepted successfully!"
  ```
