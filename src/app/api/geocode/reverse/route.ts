import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

type NominatimAddress = {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
};

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Koordinat GPS tidak valid." }, { status: 400 });

  const { lat, lon } = parsed.data;
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "JagoFarm/1.0 address-autofill" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Layanan alamat sedang tidak tersedia." }, { status: 502 });

    const payload = (await response.json()) as { display_name?: string; address?: NominatimAddress };
    const address = payload.address ?? {};
    const locality = address.village || address.suburb || address.neighbourhood;
    const detail = [
      [address.road, address.house_number].filter(Boolean).join(" "),
      locality,
    ].filter(Boolean).join(", ");

    return NextResponse.json({
      detail: detail || payload.display_name || "",
      city: address.city || address.town || address.municipality || address.county || "",
      province: address.state || address.state_district || address.city || "",
      postalCode: address.postcode || "",
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json({ error: "Gagal mengubah lokasi menjadi alamat." }, { status: 502 });
  }
}
