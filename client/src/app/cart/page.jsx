'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';


export default function CartPage() {
    
 const [cartItems, setCartItems] = useState([])
 const [isLoaded, setIsLoaded] = useState(false)
  const { token, updateWalletBalance } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);


 useEffect( ()=> {

    try  {

        const savedCart = localStorage.getItem('cart')
        const parsedCart = JSON.parse(savedCart || '[]')

      setCartItems(Array.isArray(parsedCart) ? parsedCart : []);

    }

    catch (error) {
        console.error('falied to load cart',error )
        setCartItems([])

    }

    finally{
        setIsLoaded(true)
    }
 },[])

   // Block 3: helper functions

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const updateQuantity = (productId, shopId, delta) => {
    const nextItems = cartItems
      .map((item) => {
        if (item.ProductID === productId && item.ShopID === shopId) {
          const updatedQuantity = item.Quantity + delta;

          if (updatedQuantity > 0) {
            return { ...item, Quantity: updatedQuantity };
          }

          return null;
        }

        return item;
      })
      .filter(Boolean);

    saveCart(nextItems);
  };

  const removeItem = (productId, shopId) => {
    const nextItems = cartItems.filter(
      (item) => !(item.ProductID === productId && item.ShopID === shopId)
    );

    saveCart(nextItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

    // Places the order to the backend API
   // Places the order to the backend API
  const handleCheckout = async () => {
    if (!token) {
      alert("Please login to place an order!");
      return;
    }
    if (cartItems.length === 0) return;

    setCheckoutLoading(true);
    
    let sellerId = cartItems[0].SellerID;
    
    // If SellerID is not in the cart item, fetch it from the shop details
    if (!sellerId) {
      try {
        const shopRes = await fetch(`http://localhost:5000/api/shops/${cartItems[0].ShopID}`);
        if (shopRes.ok) {
          const shopData = await shopRes.json();
          sellerId = shopData.SellerID;
        }
      } catch (err) {
        console.error("Error fetching shop SellerID:", err);
      }
    }

    if (!sellerId) {
      alert("Failed to locate the seller for this shop.");
      setCheckoutLoading(false);
      return;
    }

    const items = cartItems.map((item) => ({
      productId: item.ProductID,
      quantity: item.Quantity
    }));

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ sellerId, items })
      });

      if (res.ok) {
        alert("Order placed successfully!");
        clearCart(); // Empties the cart after purchase
        
        // Refresh buyer's wallet balance in the navbar
        if (updateWalletBalance) {
          await updateWalletBalance();
        }
      } else {
        const errorText = await res.text();
        alert(errorText || "Failed to place order.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Network error. Failed to place order.");
    } finally {
      setCheckoutLoading(false);
    }
  };



  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.Quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.Price * item.Quantity, 0);
  }, [cartItems]);

 


    // Block 5: render cart UI
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your cart</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Review the products you added from the shop.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Continue shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Add something from a shop and it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={`${item.ShopID}-${item.ProductID}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {item.ProductName}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">{item.ShopName}</p>
                      <p className="mt-3 text-base font-semibold text-indigo-600">
                        ${Number(item.Price).toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-xl border border-zinc-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.ProductID, item.ShopID, -1)}
                          className="px-3 py-2 text-lg text-zinc-700 hover:bg-zinc-100"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold">
                          {item.Quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.ProductID, item.ShopID, 1)}
                          className="px-3 py-2 text-lg text-zinc-700 hover:bg-zinc-100"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.ProductID, item.ShopID)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm text-zinc-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-900">
                      ${(item.Price * item.Quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-medium text-zinc-900">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-xl font-semibold text-zinc-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              {/* Checkout / Place Order Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-indigo-400 active:scale-[0.98]"
              >
                {checkoutLoading ? "Placing Order..." : "Checkout / Place Order"}
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="mt-6 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
