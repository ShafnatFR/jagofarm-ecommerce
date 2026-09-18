import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get("province_id");

    if (!provinceId) {
      return NextResponse.json(
        { error: "province_id is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;

    if (!apiKey) {
      // Mock cities by province
      const mockCities: Record<string, { id: string; name: string }[]> = {
        "1": [
          { id: "1", name: "Jakarta Pusat" },
          { id: "2", name: "Jakarta Selatan" },
          { id: "3", name: "Jakarta Barat" },
          { id: "4", name: "Jakarta Timur" },
          { id: "5", name: "Jakarta Utara" },
        ],
        "2": [
          { id: "6", name: "Bandung" },
          { id: "7", name: "Bekasi" },
          { id: "8", name: "Bogor" },
          { id: "9", name: "Depok" },
          { id: "10", name: "Cimahi" },
        ],
        "3": [
          { id: "11", name: "Semarang" },
          { id: "12", name: "Solo" },
          { id: "13", name: "Magelang" },
        ],
        "4": [
          { id: "14", name: "Surabaya" },
          { id: "15", name: "Malang" },
          { id: "16", name: "Sidoarjo" },
        ],
      };
      return NextResponse.json({
        cities: mockCities[provinceId] || [],
      });
    }

    const response = await fetch(
      `https://api.rajaongkir.com/starter/city?province=${provinceId}`,
      { headers: { key: apiKey } }
    );
    const data = await response.json();
    const cities =
      data.rajaongkir?.results?.map((c: any) => ({
        id: c.city_id,
        name: c.city_name,
        type: c.type,
      })) || [];

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Cities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
