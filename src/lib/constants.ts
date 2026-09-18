// ── Site Configuration ────────────────────────────────

export const SITE_CONFIG = {
  name: "JagoFarm",
  tagline: "Pertanian Modern, Hasil Melimpah",
  description:
    "JagoFarm — marketplace pertanian terlengkap. Pupuk, bibit, alat pertanian, dan kebutuhan tani lainnya dengan harga terjangkau dan pengiriman cepat ke seluruh Indonesia.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://jagofarm.id",
  ogImage: "/images/og-image.jpg",
  email: "hello@jagofarm.id",
  phone: "+62 812-3456-7890",
  phoneDisplay: "0812-3456-7890",
  whatsapp: "6281234567890",
  address: "Jl. Pertanian No. 123, Bandung, Jawa Barat 40123",
  social: {
    instagram: "https://instagram.com/jagofarm.id",
    facebook: "https://facebook.com/jagofarm.id",
    tiktok: "https://tiktok.com/@jagofarm.id",
    youtube: "https://youtube.com/@jagofarm.id",
    twitter: "https://x.com/jagofarm.id",
  },
} as const;

// ── Design Tokens ─────────────────────────────────────

export const DESIGN_TOKENS = {
  colors: {
    primary: "#1B4D3E",      // Deep Forest Green
    secondary: "#F5F0EB",    // Warm Cream
    accent: "#D4A843",       // Gold
    primaryDark: "#143A30",
    primaryLight: "#2A6B56",
    accentDark: "#B89035",
    accentLight: "#E5C36A",
  },
  font: "Inter, system-ui, -apple-system, sans-serif",
} as const;

// ── Roles ─────────────────────────────────────────────

export const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  STAFF: "staff",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Order Statuses ────────────────────────────────────

export const ORDER_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Sudah Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

// ── Payment Statuses ──────────────────────────────────

export const PAYMENT_STATUSES = {
  UNPAID: "unpaid",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Belum Dibayar",
  paid: "Sudah Dibayar",
  refunded: "Dikembalikan",
  failed: "Gagal",
};

// ── Payment Methods ───────────────────────────────────

export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  EWALLET: "ewallet",
  QRIS: "qris",
  CSTORE: "cstore",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "Kartu Kredit/Debit",
  bank_transfer: "Transfer Bank",
  ewallet: "E-Wallet",
  qris: "QRIS",
  cstore: "Convenience Store",
};

export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  credit_card: "CreditCard",
  bank_transfer: "Building2",
  ewallet: "Wallet",
  qris: "QrCode",
  cstore: "Store",
};

// ── Shipping Couriers ─────────────────────────────────

export const SHIPPING_COURIERS = {
  JNE: "jne",
  POS: "pos",
  TIKI: "tiki",
  SICEPAT: "sicepat",
  JNT: "jnt",
  ANTERAJA: "anteraja",
  NINJA: "ninja",
  LION: "lion",
  WAHANA: "wahana",
  PANDU: "pandu",
} as const;

export const SHIPPING_COURIER_LABELS: Record<string, string> = {
  jne: "JNE",
  pos: "POS Indonesia",
  tiki: "TIKI",
  sicepat: "SiCepat",
  jnt: "J&T Express",
  anteraja: "AnterAja",
  ninja: "Ninja Express",
  lion: "Lion Parcel",
  wahana: "Wahana Prestasi Logistik",
  pandu: "Pandu Logistics",
};

export const SHIPPING_COURIER_LOGOS: Record<string, string> = {
  jne: "/images/couriers/jne.png",
  pos: "/images/couriers/pos.png",
  tiki: "/images/couriers/tiki.png",
  sicepat: "/images/couriers/sicepat.png",
  jnt: "/images/couriers/jnt.png",
  anteraja: "/images/couriers/anteraja.png",
  ninja: "/images/couriers/ninja.png",
};

// ── Pagination ────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
  PRODUCT_GRID_LIMIT: 12,
  REVIEW_LIMIT: 5,
  ORDER_LIMIT: 10,
} as const;

// ── Product ───────────────────────────────────────────

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga: Rendah ke Tinggi" },
  { value: "price_desc", label: "Harga: Tinggi ke Rendah" },
  { value: "name_asc", label: "Nama: A-Z" },
  { value: "name_desc", label: "Nama: Z-A" },
  { value: "popular", label: "Paling Populer" },
] as const;

export const PRODUCT_SORT_VALUES = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
  "popular",
] as const;

// ── Coupons ───────────────────────────────────────────

export const COUPON_DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const;

export const COUPON_DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "Persentase (%)",
  fixed: "Nominal (Rp)",
};

// ── Warehouse ─────────────────────────────────────────

export const WAREHOUSE = {
  CITY_ID: process.env.WAREHOUSE_CITY_ID ?? "232", // Default: Bandung
  NAME: "Gudang JagoFarm",
  ADDRESS: "Jl. Pertanian No. 123, Bandung, Jawa Barat 40123",
} as const;

// ── File Upload ───────────────────────────────────────

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],
  MAX_IMAGES_PER_PRODUCT: 8,
} as const;

// ── Rating ────────────────────────────────────────────

export const RATING = {
  MIN: 1,
  MAX: 5,
  LABELS: {
    1: "Sangat Buruk",
    2: "Buruk",
    3: "Cukup",
    4: "Baik",
    5: "Sangat Baik",
  } as Record<number, string>,
} as const;
