"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "@/components/ui/use-toast";

export interface CartItem {
  /** id lokal (dipakai UI/zustand), format `${productId}` atau `${productId}-${variantId}` */
  id: string;
  productId: string;
  variantId?: string;
  /**
   * UUID baris cart_items di server. WAJIB dipakai untuk operasi server
   * (PATCH/DELETE /api/cart/items/[id]) karena `id` lokal bukan UUID.
   */
  serverItemId?: string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  weightGram: number;
  /** slug produk (untuk link ke halaman detail) */
  slug?: string;
}

export interface ServerCoupon {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number | null;
}

export interface ServerCartSummary {
  id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  coupon: ServerCoupon | null;
  couponError: string | null;
}

interface ApiCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  product?: {
    id: string;
    name: string;
    slug?: string;
    weightGram?: number;
    images?: { url: string }[] | null;
  } | null;
  variant?: { name: string } | null;
}

interface ApiCart {
  id: string | null;
  items?: ApiCartItem[];
  subtotal?: number;
  discount?: number;
  total?: number;
  itemCount?: number;
  coupon?: ServerCoupon | null;
  couponError?: string | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** Ringkasan cart server (null = belum login / belum dimuat) */
  serverCart: ServerCartSummary | null;
  isLoggedIn: boolean;
  cartLoaded: boolean;
  isSyncing: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  /** Muat cart dari server (GET /api/cart). Aman dipanggil berkali-kali. */
  hydrate: () => Promise<void>;
  totalItems: () => number;
  totalPrice: () => number;
  totalWeight: () => number;
}

const MAX_QUANTITY = 99;

type ServerCartFetch =
  | { status: "ok"; cart: ApiCart }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

function localIdFor(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}-${variantId}` : productId;
}

/** Ubah error API (string atau fieldErrors zod) jadi satu pesan yang bisa dibaca. */
function toErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const parts = Object.values(error as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === "string");
    if (parts.length > 0) return parts.join(", ");
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (data?.error) return toErrorMessage(data.error);
  } catch {
    /* body bukan JSON */
  }
  return `Terjadi kesalahan (${response.status}). Silakan coba lagi.`;
}

function mapServerItem(item: ApiCartItem): CartItem {
  const variantId = item.variantId ?? undefined;
  const productName = item.product?.name ?? "Produk";
  return {
    id: localIdFor(item.productId, variantId ?? null),
    productId: item.productId,
    variantId,
    serverItemId: item.id,
    name: item.variant?.name ? `${productName} (${item.variant.name})` : productName,
    price: Number(item.unitPrice ?? 0),
    quantity: Number(item.quantity ?? 0),
    image: item.product?.images?.[0]?.url ?? undefined,
    weightGram: Number(item.product?.weightGram ?? 0),
    slug: item.product?.slug,
  };
}

function summarize(cart: ApiCart): ServerCartSummary {
  return {
    id: cart.id ?? null,
    subtotal: Number(cart.subtotal ?? 0),
    discount: Number(cart.discount ?? 0),
    total: Number(cart.total ?? 0),
    itemCount: Number(
      cart.itemCount ??
        (cart.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
    ),
    coupon: cart.coupon ?? null,
    couponError: cart.couponError ?? null,
  };
}

async function fetchServerCart(): Promise<ServerCartFetch> {
  try {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) return { status: "error", message: await readError(res) };

    const data = (await res.json()) as { cart?: ApiCart };
    if (!data?.cart) {
      return { status: "error", message: "Respons keranjang tidak valid." };
    }
    return { status: "ok", cart: data.cart };
  } catch {
    return { status: "error", message: "Gagal memuat keranjang dari server." };
  }
}

async function postCartItem(
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<Response | null> {
  try {
    return await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
  } catch {
    return null;
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /** Merge cart lokal -> server hanya sekali per sesi halaman (saat pertama login). */
      let mergeAttempted = false;

      /**
       * URL item keranjang server.
       *
       * Kalau `id` lokal bukan UUID (mis. `${productId}-${variantId}`), route
       * `/api/cart/items/[id]` akan fallback mencari baris lewat query
       * (productId [+ variantId]) — jadi id lokal tetap boleh dikirim, bukan
       * endpoint terpisah yang tidak ada.
       */
      function itemUrl(item: CartItem): string {
        if (item.serverItemId) return `/api/cart/items/${item.serverItemId}`;
        const params = new URLSearchParams({ productId: item.productId });
        if (item.variantId) params.set("variantId", item.variantId);
        return `/api/cart/items/${encodeURIComponent(item.id)}?${params.toString()}`;
      }

      async function refreshFromServer() {
        const result = await fetchServerCart();
        if (result.status === "ok") {
          set({
            items: (result.cart.items ?? []).map(mapServerItem),
            serverCart: summarize(result.cart),
            isLoggedIn: true,
            cartLoaded: true,
            isSyncing: false,
          });
          return;
        }
        if (result.status === "unauthorized") {
          set({
            isLoggedIn: false,
            serverCart: null,
            cartLoaded: true,
            isSyncing: false,
          });
          return;
        }
        set({ cartLoaded: true, isSyncing: false });
      }

      async function syncAdd(
        productId: string,
        variantId: string | null,
        quantity: number
      ) {
        const res = await postCartItem(productId, variantId, quantity);
        if (!res) {
          toast({
            variant: "destructive",
            title: "Gagal menyinkronkan keranjang",
            description: "Periksa koneksi internet Anda.",
          });
        } else if (!res.ok) {
          toast({
            variant: "destructive",
            title: "Gagal menyinkronkan keranjang",
            description: await readError(res),
          });
        }
        await refreshFromServer();
      }

      async function syncUpdate(item: CartItem, quantity: number) {
        try {
          const res = await fetch(itemUrl(item), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quantity,
              productId: item.productId,
              variantId: item.variantId ?? null,
            }),
          });
          if (!res.ok) {
            toast({
              variant: "destructive",
              title: "Gagal memperbarui keranjang",
              description: await readError(res),
            });
          }
        } catch {
          toast({
            variant: "destructive",
            title: "Gagal memperbarui keranjang",
            description: "Periksa koneksi internet Anda.",
          });
        }
        await refreshFromServer();
      }

      async function syncRemove(item: CartItem) {
        try {
          const res = await fetch(itemUrl(item), { method: "DELETE" });
          if (!res.ok) {
            toast({
              variant: "destructive",
              title: "Gagal menghapus item",
              description: await readError(res),
            });
          }
        } catch {
          toast({
            variant: "destructive",
            title: "Gagal menghapus item",
            description: "Periksa koneksi internet Anda.",
          });
        }
        await refreshFromServer();
      }

      return {
        items: [],
        isOpen: false,
        serverCart: null,
        isLoggedIn: false,
        cartLoaded: false,
        isSyncing: false,

        addItem: (item) => {
          const quantity = Math.min(
            Math.max(1, item.quantity ?? 1),
            MAX_QUANTITY
          );
          const id = localIdFor(item.productId, item.variantId ?? null);

          // UI instan (optimistic) lalu sinkron ke server cart.
          set((state) => {
            const index = state.items.findIndex((i) => i.id === id);
            if (index >= 0) {
              const items = [...state.items];
              items[index] = {
                ...items[index],
                quantity: Math.min(items[index].quantity + quantity, MAX_QUANTITY),
              };
              return { items };
            }
            return { items: [...state.items, { ...item, id, quantity }] };
          });

          if (get().isLoggedIn) {
            void syncAdd(item.productId, item.variantId ?? null, quantity);
          }
        },

        removeItem: (id) => {
          const item = get().items.find((i) => i.id === id);
          set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
          if (item && get().isLoggedIn) void syncRemove(item);
        },

        updateQuantity: (id, quantity) => {
          const item = get().items.find((i) => i.id === id);
          if (!item) return;

          if (quantity <= 0) {
            get().removeItem(id);
            return;
          }

          const next = Math.min(quantity, MAX_QUANTITY);
          set((state) => ({
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: next } : i
            ),
          }));

          if (get().isLoggedIn) void syncUpdate(item, next);
        },

        clearCart: () =>
          set((state) => ({
            items: [],
            serverCart: state.serverCart
              ? {
                  ...state.serverCart,
                  subtotal: 0,
                  discount: 0,
                  total: 0,
                  itemCount: 0,
                  coupon: null,
                  couponError: null,
                }
              : null,
          })),

        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),

        hydrate: async () => {
          if (get().isSyncing) return;
          set({ isSyncing: true });

          const result = await fetchServerCart();

          if (result.status === "unauthorized") {
            // Belum login: cart lokal tetap dipakai, tidak ada sinkronisasi.
            set({
              isSyncing: false,
              isLoggedIn: false,
              serverCart: null,
              cartLoaded: true,
            });
            return;
          }

          if (result.status === "error") {
            set({ isSyncing: false, cartLoaded: true });
            return;
          }

          let cart = result.cart;
          let serverItems = (cart.items ?? []).map(mapServerItem);

          // Merge sekali saat pertama login: server kosong tapi lokal ada isinya.
          const localItems = get().items;
          if (
            serverItems.length === 0 &&
            localItems.length > 0 &&
            !mergeAttempted
          ) {
            mergeAttempted = true;
            for (const item of localItems) {
              await postCartItem(
                item.productId,
                item.variantId ?? null,
                Math.min(Math.max(1, item.quantity), MAX_QUANTITY)
              );
            }

            const refetched = await fetchServerCart();
            if (refetched.status === "ok") {
              cart = refetched.cart;
              serverItems = (cart.items ?? []).map(mapServerItem);
            }
          }

          set({
            items: serverItems,
            serverCart: summarize(cart),
            isLoggedIn: true,
            cartLoaded: true,
            isSyncing: false,
          });
        },

        totalItems: () =>
          get().items.reduce((sum, item) => sum + item.quantity, 0),

        totalPrice: () =>
          get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),

        totalWeight: () =>
          get().items.reduce(
            (sum, item) => sum + item.weightGram * item.quantity,
            0
          ),
      };
    },
    {
      name: "jagofarm-cart",
      // Hanya item lokal yang dipersist; ringkasan server selalu diambil ulang.
      partialize: (state) => ({ items: state.items }),
    }
  )
);
