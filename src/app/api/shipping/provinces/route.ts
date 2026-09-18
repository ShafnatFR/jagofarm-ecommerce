import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;

    if (!apiKey) {
      // Mock provinces
      const mockProvinces = [
        { id: "1", name: "DKI Jakarta" },
        { id: "2", name: "Jawa Barat" },
        { id: "3", name: "Jawa Tengah" },
        { id: "4", name: "Jawa Timur" },
        { id: "5", name: "DI Yogyakarta" },
        { id: "6", name: "Banten" },
        { id: "7", name: "Bali" },
        { id: "8", name: "Sumatera Utara" },
        { id: "9", name: "Sumatera Barat" },
        { id: "10", name: "Sulawesi Selatan" },
        { id: "11", name: "Kalimantan Timur" },
        { id: "12", name: "Nusa Tenggara Timur" },
      ];
      return NextResponse.json({ provinces: mockProvinces });
    }

    const response = await fetch(
      "https://api.rajaongkir.com/starter/province",
      { headers: { key: apiKey } }
    );
    const data = await response.json();
    const provinces =
      data.rajaongkir?.results?.map((p: any) => ({
        id: p.province_id,
        name: p.province,
      })) || [];

    return NextResponse.json({ provinces });
  } catch (error) {
    console.error("Provinces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
