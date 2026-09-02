# Systems Integration Contracts Document
## URN: TECDT510401 — Performance Criterion: P3
**Document Goal:** Define all technical interface specifications, data structures, routing protocols, database interfaces, and event buses connecting the application layers of the Relational Marketplace Portal.

---

## 1. Client-Server Communication Protocol (Next.js $\leftrightarrow$ Express API)
All communication between the frontend client and the backend server is performed over REST APIs using HTTP/HTTPS.
* **Request Format:** `application/json`
* **Response Format:** `application/json`
* **Session Authorization Header:** Secure endpoints require a JSON Web Token (JWT) sent as:
  `Authorization: Bearer <token_string>`

---

## 2. API Endpoint Catalog (Full Registry)

### Category A: User Authentication & Profiles

#### 1. Register User Profile
* **HTTP Method & Endpoint:** `POST /api/users`
* **Auth Required:** No
* **Allowed Roles:** Guest / Public
* **Request Payload Format:**
  ```json
  {
    "username": "Malek",
    "email": "malek@example.com",
    "password": "securePassword123",
    "role": "seller"
  }
  ```
  *(Note: `role` must be either `"buyer"` or `"seller"`)*
* **Expected Responses:**
  * `201 Created` $\rightarrow$ Plaintext: `"User registered successfully!"`
  * `400 Bad Request` $\rightarrow$ JSON: `{"message": "Email is already registered!"}`

#### 2. User Login Session
* **HTTP Method & Endpoint:** `POST /api/users/login`
* **Auth Required:** No
* **Allowed Roles:** Guest / Public
* **Request Payload Format:**
  ```json
  {
    "email": "malek@example.com",
    "password": "securePassword123"
  }
  ```
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    {
      "message": "Login successful!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "userId": 5,
        "username": "Malek",
        "email": "malek@example.com",
        "roleId": 2
      }
    }
    ```
  * `401 Unauthorized` $\rightarrow$ JSON: `{"message": "Invalid password or email!"}`

#### 3. Fetch User Profile Details
* **HTTP Method & Endpoint:** `GET /api/users/profile`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Buyer, Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    {
      "UserID": 5,
      "Username": "Malek",
      "Email": "malek@example.com",
      "RoleName": "Seller"
    }
    ```
  * `401 Unauthorized` $\rightarrow$ JSON: `{"message": "Token verification failed!"}`

---

### Category B: Shops Management

#### 4. List All Shops
* **HTTP Method & Endpoint:** `GET /api/shops`
* **Auth Required:** No
* **Allowed Roles:** Guest, Buyer, Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    [
      {
        "ShopID": 1,
        "SellerID": 5,
        "ShopName": "Malek's Shop",
        "Description": "Welcome to my storefront!",
        "SellerName": "Malek"
      }
    ]
    ```

#### 5. Fetch Single Shop Metadata
* **HTTP Method & Endpoint:** `GET /api/shops/:id`
* **Auth Required:** No
* **Allowed Roles:** Guest, Buyer, Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    {
      "ShopID": 1,
      "SellerID": 5,
      "ShopName": "Malek's Shop",
      "Description": "Welcome to my storefront!",
      "SellerName": "Malek"
    }
    ```
  * `404 Not Found` $\rightarrow$ JSON: `{"message": "Shop not found!"}`

#### 6. Fetch Products inside a Shop
* **HTTP Method & Endpoint:** `GET /api/shops/:id/products`
* **Auth Required:** No
* **Allowed Roles:** Guest, Buyer, Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    [
      {
        "ProductID": 12,
        "SellerID": 5,
        "ProductName": "Wireless Keyboard",
        "Description": "Mechanical, blue switches",
        "Price": 35.50,
        "Quantity": 20,
        "CreatedAt": "2026-06-18T10:00:00.000Z"
      }
    ]
    ```

#### 7. Update Shop Profile Details
* **HTTP Method & Endpoint:** `PUT /api/shops/my-shop`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller
* **Request Payload Format:**
  ```json
  {
    "shopName": "Malek's Upgraded Electronics",
    "description": "Offering premium hardware and components"
  }
  ```
* **Expected Responses:**
  * `200 OK` $\rightarrow$ Plaintext: `"Shop updated successfully!"`
  * `403 Forbidden` $\rightarrow$ JSON: `{"message": "Only Sellers can manage shops!"}`

---

### Category C: Products Management

#### 8. Fetch Seller's Own Inventory
* **HTTP Method & Endpoint:** `GET /api/products/seller`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    [
      {
        "ProductID": 12,
        "SellerID": 5,
        "ProductName": "Wireless Keyboard",
        "Description": "Mechanical, blue switches",
        "Price": 35.50,
        "Quantity": 20,
        "CreatedAt": "2026-06-18T10:00:00.000Z"
      }
    ]
    ```

#### 9. Create New Product
* **HTTP Method & Endpoint:** `POST /api/products`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller
* **Request Payload Format:**
  ```json
  {
    "productName": "Gaming Mouse",
    "description": "Ergonomic 16000 DPI gaming mouse",
    "price": 25.00,
    "quantity": 10
  }
  ```
* **Expected Responses:**
  * `201 Created` $\rightarrow$ Plaintext: `"Product created successfully!"`
  * `400 Bad Request` $\rightarrow$ JSON: `{"message": "Validation failed: Price must be positive."}`

#### 10. Update Product Details
* **HTTP Method & Endpoint:** `PUT /api/products/:id`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller (Owner only)
* **Request Payload Format:**
  ```json
  {
    "productName": "Gaming Mouse Pro",
    "description": "Upgraded wireless gaming mouse",
    "price": 30.00,
    "quantity": 8
  }
  ```
* **Expected Responses:**
  * `200 OK` $\rightarrow$ Plaintext: `"Product updated successfully!"`
  * `403 Forbidden` $\rightarrow$ JSON: `{"message": "You are not authorized to edit this product!"}`
  * `404 Not Found` $\rightarrow$ JSON: `{"message": "Product not found!"}`

#### 11. Delete Product from Catalog
* **HTTP Method & Endpoint:** `DELETE /api/products/:id`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller (Owner only)
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ Plaintext: `"Product deleted successfully!"`
  * `403 Forbidden` $\rightarrow$ JSON: `{"message": "You are not authorized to delete this product!"}`

---

### Category D: Wallet Management

#### 12. Retrieve Wallet Balance
* **HTTP Method & Endpoint:** `GET /api/wallet`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Buyer, Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    {
      "WalletID": 3,
      "UserID": 5,
      "Balance": 120.50
    }
    ```

#### 13. Deposit Virtual Cash
* **HTTP Method & Endpoint:** `POST /api/wallet/deposit`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Buyer, Seller
* **Request Payload Format:**
  ```json
  {
    "amount": 50.00
  }
  ```
* **Expected Responses:**
  * `200 OK` $\rightarrow$ Plaintext: `"Deposit successful! New balance: 170.50"`
  * `400 Bad Request` $\rightarrow$ JSON: `{"message": "Deposit amount must be greater than zero!"}`

---

### Category E: Orders & Checkout

#### 14. Checkout Single-Shop Cart
* **HTTP Method & Endpoint:** `POST /api/orders`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Buyer
* **Request Payload Format:**
  ```json
  {
    "sellerId": 5,
    "items": [
      {
        "productId": 12,
        "quantity": 2
      }
    ]
  }
  ```
* **Expected Responses:**
  * `201 Created` $\rightarrow$ JSON:
    ```json
    {
      "message": "Order placed successfully!",
      "orderId": 48,
      "totalCost": 71.00
    }
    ```
  * `400 Bad Request` $\rightarrow$ JSON: `{"message": "Insufficient stock!"}` or `{"message": "Insufficient wallet funds!"}`

#### 15. Fetch Buyer Order History
* **HTTP Method & Endpoint:** `GET /api/orders/buyer`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Buyer
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    [
      {
        "OrderID": 48,
        "OrderDate": "2026-06-20T12:00:00.000Z",
        "Status": "Pending",
        "TotalAmount": 71.00
      }
    ]
    ```

#### 16. Fetch Seller Incoming Orders
* **HTTP Method & Endpoint:** `GET /api/orders/seller`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ JSON:
    ```json
    [
      {
        "OrderID": 48,
        "OrderDate": "2026-06-20T12:00:00.000Z",
        "Status": "Pending",
        "Quantity": 2,
        "UnitPrice": 35.50,
        "ProductName": "Wireless Keyboard",
        "ProductID": 12,
        "BuyerName": "JohnBuyer"
      }
    ]
    ```

#### 17. Fulfill/Accept Order
* **HTTP Method & Endpoint:** `PUT /api/orders/:id/accept`
* **Auth Required:** Yes (JWT)
* **Allowed Roles:** Seller (Owner only)
* **Request Payload Format:** None
* **Expected Responses:**
  * `200 OK` $\rightarrow$ Plaintext: `"Order accepted successfully!"`
  * `403 Forbidden` $\rightarrow$ JSON: `{"message": "Only the merchant of this order can accept it!"}`
  * `404 Not Found` $\rightarrow$ JSON: `{"message": "Order not found!"}`

---

## 3. Database Layer Contracts (Backend API $\leftrightarrow$ SQL Server)
The communication channel between Node.js and SQL Server is governed by ODBC parameters loaded from environment variables.

### Connection Security & Parameters
* **Driver:** `ODBC Driver 17 for SQL Server`
* **Authentication Scheme:** Integrated OS Security (`Trusted_Connection=yes`).
* **Query Safeguard:** All database write and read procedures must bind external data values as query parameters to neutralize SQL Injection vulnerabilities.

### Sample Stored Procedure Contract (`dbo.GetUserByEmail`)
* **Purpose:** Locates a user record based on email.
* **SQL Query Definition:**
  ```sql
  CREATE PROCEDURE [dbo].[GetUserByEmail] 
      @Email VARCHAR(255)
  AS 
  BEGIN 
      SELECT * FROM Users WHERE Email = @Email;
  END;
  ```
* **JavaScript Binding Contract:**
  ```javascript
  const request = new sql.Request(transaction);
  request.input('Email', sql.VarChar(255), emailAddress);
  const result = await request.execute('GetUserByEmail');
  ```

---

## 4. Client-Side Event Contracts (Next.js Application Layout)
To ensure components dynamically render updates without triggering redundant database read requests, the React components coordinate state triggers through browser event interfaces.

### LocalStorage Cart Sync Event
* **Event Name:** `cart-updated`
* **Publisher Interface:** Product addition buttons and Cart checkout pages execute:
  ```javascript
  window.dispatchEvent(new Event("cart-updated"));
  ```
* **Subscriber Interface:** Navigation bars (`Navbar.jsx`) register listeners to intercept the trigger:
  ```javascript
  window.addEventListener("cart-updated", updateCartCountState);
  ```
