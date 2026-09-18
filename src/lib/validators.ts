import { z } from "zod";

// ── Auth ──────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama harus minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    phone: z
      .string()
      .min(10, "Nomor telepon minimal 10 digit")
      .max(20, "Nomor telepon maksimal 20 digit")
      .regex(/^[0-9+\-\s()]+$/, "Format nomor telepon tidak valid")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password harus minimal 8 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password harus mengandung huruf besar, huruf kecil, dan angka"
      ),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// ── Address ───────────────────────────────────────────

export const addressSchema = z.object({
  label: z
    .string()
      .min(1, "Label alamat wajib diisi")
      .max(50, "Label maksimal 50 karakter"),
  recipientName: z
    .string()
    .min(2, "Nama penerima harus minimal 2 karakter")
    .max(100, "Nama penerima maksimal 100 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(20, "Nomor telepon maksimal 20 digit")
    .regex(/^[0-9+\-\s()]+$/, "Format nomor telepon tidak valid"),
  province: z
    .string()
    .min(1, "Provinsi wajib diisi")
    .max(100, "Provinsi maksimal 100 karakter"),
  city: z
    .string()
    .min(1, "Kota/kabupaten wajib diisi")
    .max(100, "Kota/kabupaten maksimal 100 karakter"),
  district: z
    .string()
    .min(1, "Kecamatan wajib diisi")
    .max(100, "Kecamatan maksimal 100 karakter"),
  postalCode: z
    .string()
    .min(5, "Kode pos harus 5 digit")
    .max(5, "Kode pos harus 5 digit")
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
  detail: z
    .string()
    .max(500, "Detail alamat maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
  isDefault: z.boolean().optional(),
});

// ── Checkout ──────────────────────────────────────────

export const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid("Alamat pengiriman tidak valid"),
  shippingCourier: z.string().min(1, "Kurir pengiriman wajib dipilih"),
  shippingService: z.string().min(1, "Layanan pengiriman wajib dipilih"),
  shippingCost: z.number().min(0, "Biaya pengiriman tidak valid"),
  shippingEtd: z.string().optional(),
  paymentMethod: z.enum(
    [
      "credit_card",
      "bank_transfer",
      "ewallet",
      "qris",
      "cstore",
    ],
    { required_error: "Metode pembayaran wajib dipilih" }
  ),
  couponCode: z
    .string()
    .max(50, "Kode kupon maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

// ── Product Filter ────────────────────────────────────

export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  minPrice: z
    .number()
    .min(0, "Harga minimum tidak boleh negatif")
    .optional(),
  maxPrice: z
    .number()
    .min(0, "Harga minimum tidak boleh negatif")
    .optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  sortBy: z
    .enum(["newest", "price_asc", "price_desc", "name_asc", "name_desc", "popular"])
    .optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(12),
});

// ── Review ────────────────────────────────────────────

export const reviewSchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  rating: z
    .number()
    .int("Rating harus bilangan bulat")
    .min(1, "Rating minimal 1")
    .max(5, "Rating maksimal 5"),
  comment: z
    .string()
    .min(10, "Ulasan harus minimal 10 karakter")
    .max(1000, "Ulasan maksimal 1000 karakter"),
  imageUrl: z
    .string()
    .url("URL gambar tidak valid")
    .optional()
    .or(z.literal("")),
});

// ── Cart ──────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(1, "Jumlah minimal 1")
    .max(99, "Jumlah maksimal 99"),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(1, "Jumlah minimal 1")
    .max(99, "Jumlah maksimal 99"),
});

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Kode kupon wajib diisi")
    .max(50, "Kode kupon maksimal 50 karakter"),
});

// ── Type exports for form handling ────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
