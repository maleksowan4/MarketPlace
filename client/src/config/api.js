export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Derive Gateway base URL (strips trailing /api if present)
const GATEWAY_BASE = API_BASE_URL.replace(/\/api\/?$/, "");

export const USER_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || `${GATEWAY_BASE}/api/uploads/user`;
export const PRODUCT_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || `${GATEWAY_BASE}/api/uploads/product`;

export function getShopLogoUrl(logoUrl) {
  if (!logoUrl) return "";
  let path = logoUrl;
  if (path.includes("://")) {
    try {
      const urlObj = new URL(path);
      if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1" || urlObj.hostname.includes("service")) {
        path = urlObj.pathname;
      } else {
        return logoUrl;
      }
    } catch (e) {}
  }
  const cleanPath = path.startsWith("/uploads/")
    ? path.substring("/uploads".length)
    : path.startsWith("/")
    ? path
    : `/${path}`;
  return `${USER_SERVICE_BASE_URL}${cleanPath}`;
}

export function getProductImageUrl(imageUrl) {
  if (!imageUrl) return "";
  let path = imageUrl;
  if (path.includes("://")) {
    try {
      const urlObj = new URL(path);
      if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1" || urlObj.hostname.includes("service")) {
        path = urlObj.pathname;
      } else {
        return imageUrl;
      }
    } catch (e) {}
  }
  const cleanPath = path.startsWith("/uploads/")
    ? path.substring("/uploads".length)
    : path.startsWith("/")
    ? path
    : `/${path}`;
  return `${PRODUCT_SERVICE_BASE_URL}${cleanPath}`;
}

