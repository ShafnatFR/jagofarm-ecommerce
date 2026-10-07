import { NextRequest, NextResponse } from "next/server";
import { getCities, isUsingMockShipping, resolveProvince } from "@/lib/shipping";

/**
 * GET /api/shipping/cities
 *
 * Query (opsional, semua boleh kosong):
 *  - province_id / province : id numerik ATAU nama provinsi (mis. "Jawa Barat")
 *  - q / search             : filter nama kota (mis. "band")
 *
 * Bentuk respons: { cities: [{ id, name, type, postalCode, provinceId, province }], source }
 * `id` = city_id RajaOngkir yang siap dipakai endpoint shipping/cost.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceParam = (
      searchParams.get("province_id") ??
      searchParams.get("province") ??
      ""
    ).trim();
    const searchQuery = (
      searchParams.get("q") ??
      searchParams.get("search") ??
      ""
    )
      .trim()
      .toLowerCase();

    let provinceId: string | undefined;
    let provinceName: string | null = null;

    if (provinceParam) {
      const province = await resolveProvince(provinceParam);
      if (province) {
        provinceId = province.province_id;
        provinceName = province.province;
      }
      // Provinsi tidak dikenal: kembalikan daftar kosong (tidak bikin form error)
    }

    let cities = await getCities(provinceId, searchQuery);

    if (searchQuery) {
      cities = cities.filter((city) =>
        city.city_name.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      cities: cities.map((city) => ({
        id: city.city_id,
        name: city.city_name,
        type: city.type,
        postalCode: city.postal_code,
        provinceId: city.province_id,
        province: city.province,
      })),
      provinceId: provinceId ?? null,
      province: provinceName,
      source: isUsingMockShipping() ? "mock" : "rajaongkir",
      message:
        provinceParam && !provinceId
          ? `Provinsi "${provinceParam}" tidak ditemukan`
          : undefined,
    });
  } catch (error) {
    console.error("Cities error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar kota", cities: [] },
      { status: 500 }
    );
  }
}
