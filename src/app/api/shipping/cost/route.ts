import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WAREHOUSE } from "@/lib/constants";
import {
  getShippingOptions,
  isUuid,
  normalizeCouriers,
  type ShippingOptionResult,
} from "@/lib/shipping";
import { calculateChargeableWeight, type ShippingQuoteItem } from "@/lib/shipping-quote";

/** Ambil nama kota dari alamat milik user (kalau yang dikirim ternyata UUID alamat). */
async function resolveCityFromAddress(addressId: string): Promise<{ city: string; cityId: string | null; districtId: string | null } | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
      select: { city: true, cityId: true, districtId: true },
    });

    return address ? { city: address.city, cityId: address.cityId, districtId: address.districtId } : null;
  } catch (error) {
    console.error("Resolve address city failed:", error);
    return null;
  }
}

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const weight = Number(body.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "Berat pengiriman (gram) wajib diisi dan lebih dari 0" },
        { status: 400 }
      );
    }

    const couriers = normalizeCouriers(body.courier);

    let destinationCity = readString(body.destinationCity);
    const destinationCityId = readString(body.destinationCityId);

    // Kompatibilitas field lama `destination` (dulu dikirim UUID alamat).
    const legacyDestination = readString(body.destination);
    if (!destinationCity && !destinationCityId) {
      if (isUuid(legacyDestination)) {
        // UUID alamat TIDAK boleh dikirim ke RajaOngkir -> resolve ke nama kota.
        const address = await resolveCityFromAddress(legacyDestination);
        if (address) {
          destinationCity = address.city;
          body.destinationCityId = address.cityId;
          body.destinationDistrictId = address.districtId;
        } else {
          return NextResponse.json(
            {
              error:
                "Kota tujuan tidak dapat dibaca dari alamat. Kirim destinationCity (nama kota) atau destinationCityId.",
            },
            { status: 400 }
          );
        }
      } else if (legacyDestination) {
        destinationCity = legacyDestination;
      }
    }

    if (!destinationCity && !destinationCityId) {
      return NextResponse.json(
        {
          error:
            "Kota tujuan wajib diisi (destinationCity atau destinationCityId)",
        },
        { status: 400 }
      );
    }

    let dimensions = Array.isArray(body.dimensions)
      ? (body.dimensions as ShippingQuoteItem[])
      : [];

    // Checkout tidak boleh menentukan sendiri berat/dimensi quote. Jika user
    // terautentikasi, ambil paket dari cart server sebagai sumber kebenaran.
    const session = await auth();
    if (session?.user?.id) {
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            select: {
              quantity: true,
              product: {
                select: {
                  weightGram: true,
                  lengthCm: true,
                  widthCm: true,
                  heightCm: true,
                },
              },
            },
          },
        },
      });
      if (cart?.items.length) {
        dimensions = cart.items.map((item) => ({
          quantity: item.quantity,
          weightGram: item.product.weightGram,
          lengthCm: item.product.lengthCm,
          widthCm: item.product.widthCm,
          heightCm: item.product.heightCm,
        }));
      }
    }

    const divisor = Number(process.env.SHIPPING_VOLUMETRIC_DIVISOR ?? 5000);
    const weightQuote = dimensions.length > 0
      ? calculateChargeableWeight(dimensions, divisor)
      : { actualWeightGram: Math.round(weight), volumetricWeightGram: 0, chargeableWeightGram: Math.round(weight), divisor };

    const { options, source, destination } = await getShippingOptions(
      WAREHOUSE.CITY_ID,
      {
        destinationCity: destinationCity || null,
        destinationCityId: readString(body.destinationCityId) || destinationCityId || null,
        destinationDistrictId: readString(body.destinationDistrictId) || null,
      },
      weightQuote.chargeableWeightGram,
      couriers
    );

    const results: ShippingOptionResult[] = options;

    return NextResponse.json({
      // `results` = bentuk yang dibaca halaman checkout
      results,
      // `costs` dipertahankan untuk kompatibilitas klien lama
      costs: results,
      source,
      destination,
      weight: weightQuote.chargeableWeightGram,
      weightBreakdown: weightQuote,
      couriers,
    });
  } catch (error) {
    console.error("Shipping cost error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghitung biaya pengiriman";
    const isClientInputError = /tujuan|area id|destination|no costs|tidak ditemukan/i.test(message);
    return NextResponse.json(
      { error: isClientInputError ? message : "Gagal menghitung biaya pengiriman" },
      { status: isClientInputError ? 400 : 503 }
    );
  }
}
