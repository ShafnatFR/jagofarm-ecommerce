import type { Decimal } from "@prisma/client/runtime/library";

// ── Enums (mirror Prisma) ─────────────────────────────

export type Role = "customer" | "admin" | "staff";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

// ── User ──────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  passwordHash: string | null;
  role: Role;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, "passwordHash">;

// ── Category ──────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

// ── Product ───────────────────────────────────────────

export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  basePrice: Decimal;
  discountPrice: Decimal | null;
  sku: string;
  weightGram: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  metaTitle: string | null;
  metaDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  wishlists?: Wishlist[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceModifier: Decimal;
  stock: number;
  attributes: Record<string, unknown> | null;
}

// ── Address ───────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  detail: string | null;
  isDefault: boolean;
}

// ── Cart ──────────────────────────────────────────────

export interface Cart {
  id: string;
  userId: string;
  couponId: string | null;
  coupon?: Coupon | null;
  createdAt: Date;
  updatedAt: Date;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Product;
  variantId: string | null;
  variant?: ProductVariant | null;
  quantity: number;
}

// ── Order ─────────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: SafeUser;
  shippingAddressId: string;
  shippingAddress?: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  midtransOrderId: string | null;
  midtransToken: string | null;
  shippingCourier: string | null;
  shippingService: string | null;
  shippingCost: Decimal;
  shippingEtd: string | null;
  trackingNumber: string | null;
  subtotal: Decimal;
  discount: Decimal;
  total: Decimal;
  notes: string | null;
  couponId: string | null;
  coupon?: Coupon | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  variantId: string | null;
  variant?: ProductVariant | null;
  quantity: number;
  price: Decimal;
  total: Decimal;
}

// ── Review ────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  user?: SafeUser;
  productId: string;
  product?: Product;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  isApproved: boolean;
  createdAt: Date;
}

// ── Wishlist ──────────────────────────────────────────

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  createdAt: Date;
}

// ── Coupon ────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: Decimal;
  minOrderValue: Decimal | null;
  maxDiscount: Decimal | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

// ── API Response Types ────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ── Cart with computed fields ─────────────────────────

export interface CartWithDetails extends Cart {
  items: (CartItem & {
    product: Product & { images: ProductImage[] };
    variant: ProductVariant | null;
  })[];
  subtotal: number;
  itemCount: number;
}

// ── Order with full relations ─────────────────────────

export interface OrderWithDetails extends Order {
  items: (OrderItem & {
    product: Product & { images: ProductImage[] };
    variant: ProductVariant | null;
  })[];
  shippingAddress: Address;
  user: SafeUser;
}

// ── Product with relations (for listing pages) ────────

export interface ProductWithRelations extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: Review[];
  _count?: {
    reviews: number;
    wishlists: number;
  };
  averageRating?: number;
}

// ── Product card (minimal, for grid display) ──────────

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  basePrice: Decimal;
  discountPrice: Decimal | null;
  primaryImage: string | null;
  averageRating: number;
  reviewCount: number;
  isInWishlist: boolean;
  stock: number;
}

// ── Shipping types ────────────────────────────────────

export interface ShippingOption {
  courier: string;
  courierName: string;
  service: string;
  serviceName: string;
  cost: number;
  etd: string;
}

// ── Checkout session ──────────────────────────────────

export interface CheckoutSession {
  addressId: string;
  shipping: ShippingOption;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
}

// ── Dashboard stats (admin) ───────────────────────────

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: Decimal;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  topProducts: (Product & { orderCount: number; totalSold: number })[];
  monthlyRevenue: { month: string; revenue: Decimal }[];
}
