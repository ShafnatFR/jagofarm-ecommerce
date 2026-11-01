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
  url.searchParams.set("zoom", "17");
  url.searchParams.set("addressdetails", "1");
  
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "JagoFarm/1.0 address-autofill" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Layanan alamat sedang tidak tersedia." }, { status: 502 });

    const payload = (await response.json()) as { display_name?: string; address?: NominatimAddress };
    const address = payload.address ?? {};
    type Addr = NominatimAddress & {
      city_district?: string;
      district?: string;
      hamlet?: string;
      quarter?: string;
      residential?: string;
    };
    const a = address as Addr;
    // OSM Indonesia: kecamatan biasanya di `suburb`, kadang `city_district`/
    // `district`; kelurahan di `village`/`hamlet`/`neighbourhood`.
    const district =
      a.suburb || a.city_district || a.district || a.quarter || a.residential || "";
    const locality =
      a.village || a.hamlet || a.neighbourhood || "";
    const road = [a.road, a.house_number].filter(Boolean).join(" ");

    // Fallback: bila field kosong, pecah display_name
    // ("Jl. X, Sukapura, Dayeuhkolot, Bandung, Jawa Barat, 40257").
    const parts = (payload.display_name ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const pickPostcode = (a.postcode || parts.find((p) => /^\d{5}$/.test(p)) || "").trim();

    const detail =
      [road, locality].filter(Boolean).join(", ") ||
      parts.slice(0, 2).join(", ") ||
      payload.display_name ||
      "";
    // Kecamatan = segmen ke-3 dari depan bila district masih kosong.
    const districtFb = parts.length >= 4 ? parts[2] : "";

    return NextResponse.json({
      detail,
      district: district || districtFb,
      city: a.city || a.town || a.municipality || a.county || parts[parts.length - 4] || "",
      province: a.state || a.state_district || parts[parts.length - 3] || "",
      postalCode: pickPostcode,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json({ error: "Gagal mengubah lokasi menjadi alamat." }, { status: 502 });
  }
}
