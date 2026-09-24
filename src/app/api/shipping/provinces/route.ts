import { NextRequest, NextResponse } from "next/server";
import { getProvinces, isUsingMockShipping } from "@/lib/shipping";

/**
 * GET /api/shipping/provinces
 *
 * Query (opsional):
 *  - q / search : filter nama provinsi
 *
 * Bentuk respons: { provinces: [{ id, name }], source }
 * Daftar ini dipakai form alamat (field provinsi) dan sebagai acuan filter kota.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get("q") ?? searchParams.get("search") ?? "")
      .trim()
      .toLowerCase();

    let provinces = await getProvinces();

    if (searchQuery) {
      provinces = provinces.filter((province) =>
        province.province.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      provinces: provinces.map((province) => ({
        id: province.province_id,
        name: province.province,
      })),
      source: isUsingMockShipping() ? "mock" : "rajaongkir",
    });
  } catch (error) {
    console.error("Provinces error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar provinsi", provinces: [] },
      { status: 500 }
    );
  }
}
