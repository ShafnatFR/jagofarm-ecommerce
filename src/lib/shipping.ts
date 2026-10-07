/**
 * RajaOngkir shipping integration
 *
 * Sumber ongkir:
 *  - "rajaongkir" -> API RajaOngkir dipakai (RAJAONGKIR_API_KEY tersedia & lookup sukses)
 *  - "mock"       -> fallback deterministik (API key kosong / lookup gagal / city id tidak ditemukan)
 *
 * PENTING: endpoint RajaOngkir hanya menerima city_id numerik. Nama kota harus
 * di-resolve lebih dulu lewat lookup kota (di-cache in-memory), JANGAN pernah
 * mengirim UUID alamat ke RajaOngkir.
 */

import { SHIPPING_COURIER_LABELS } from "@/lib/constants";

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY ?? "";
const RAJAONGKIR_BASE_URL =
  process.env.RAJAONGKIR_BASE_URL ?? "https://rajaongkir.komerce.id/api/v1";

const USE_MOCK = !RAJAONGKIR_API_KEY;

/** Kurir yang didukung secara default */
export const DEFAULT_COURIERS = ["jne", "pos", "tiki"];

// ── Types ─────────────────────────────────────────────

export interface Province {
  province_id: string;
  province: string;
}

export interface City {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
}

export interface ShippingCostResult {
  code: string;
  name: string;
  costs: ShippingCostEntry[];
}

export interface ShippingCostEntry {
  service: string;
  description: string;
  cost: ShippingCostDetail[];
}

export interface ShippingCostDetail {
  value: number;
  etd: string;
  note: string;
}

/** Bentuk datar yang dibaca halaman checkout */
export interface ShippingOptionResult {
  courier: string;
  courierName: string;
  service: string;
  cost: number;
  etd: string;
}

export interface DestinationInput {
  /** Nama kota tujuan, mis. "Bandung" (dari form alamat) */
  destinationCity?: string | null;
  /** city_id RajaOngkir (numerik) kalau sudah diketahui */
  destinationCityId?: string | null;
  /** district_id RajaOngkir/aggregator jika tersedia */
  destinationDistrictId?: string | null;
}

export interface ResolvedDestination {
  cityId: string | null;
  cityName: string | null;
  resolved: boolean;
}

export type ShippingSource = "rajaongkir" | "mock";

// ── Helpers ───────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function normalizeCityName(value: string): string {
  return value
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.?|kodya|administrasi)\s+/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCityMatch(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  if (candidate === query) return 3;
  if (query.length < 3) return 0;
  if (candidate.startsWith(query) || query.startsWith(candidate)) return 2;
  if (candidate.includes(query) || query.includes(candidate)) return 1;
  return 0;
}

export function courierLabel(code: string): string {
  const key = code.toLowerCase();
  return SHIPPING_COURIER_LABELS[key] ?? key.toUpperCase();
}

/**
 * Normalisasi input kurir dari request (string "jne", "jne:pos", array, atau kosong)
 */
export function normalizeCouriers(input?: unknown): string[] {
  let raw: string[] = [];
  if (typeof input === "string") {
    raw = input.split(/[:,]/);
  } else if (Array.isArray(input)) {
    raw = input.filter((c): c is string => typeof c === "string");
  }

  const cleaned = raw
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.length > 0 && DEFAULT_COURIERS.includes(c));

  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : DEFAULT_COURIERS;
}

// ── RajaOngkir API calls ──────────────────────────────

async function rajaOngkirFetch<T>(endpoint: string): Promise<T> {
  const url = `${RAJAONGKIR_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      key: RAJAONGKIR_API_KEY,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RajaOngkir API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.data ?? data.rajaongkir?.results ?? data.rajaongkir ?? data;
}

// ── Mock data ─────────────────────────────────────────

const MOCK_PROVINCES: Province[] = [
  { province_id: "1", province: "Bali" },
  { province_id: "2", province: "Bangka Belitung" },
  { province_id: "3", province: "Banten" },
  { province_id: "4", province: "Bengkulu" },
  { province_id: "5", province: "DI Yogyakarta" },
  { province_id: "6", province: "DKI Jakarta" },
  { province_id: "7", province: "Gorontalo" },
  { province_id: "8", province: "Jambi" },
  { province_id: "9", province: "Jawa Barat" },
  { province_id: "10", province: "Jawa Tengah" },
  { province_id: "11", province: "Jawa Timur" },
  { province_id: "12", province: "Kalimantan Barat" },
  { province_id: "13", province: "Kalimantan Selatan" },
  { province_id: "14", province: "Kalimantan Tengah" },
  { province_id: "15", province: "Kalimantan Timur" },
  { province_id: "16", province: "Kalimantan Utara" },
  { province_id: "17", province: "Kepulauan Riau" },
  { province_id: "18", province: "Lampung" },
  { province_id: "19", province: "Maluku" },
  { province_id: "20", province: "Maluku Utara" },
  { province_id: "21", province: "Nusa Tenggara Barat" },
  { province_id: "22", province: "Nusa Tenggara Timur" },
  { province_id: "23", province: "Papua" },
  { province_id: "24", province: "Papua Barat" },
  { province_id: "25", province: "Riau" },
  { province_id: "26", province: "Sulawesi Barat" },
  { province_id: "27", province: "Sulawesi Selatan" },
  { province_id: "28", province: "Sulawesi Tengah" },
  { province_id: "29", province: "Sulawesi Tenggara" },
  { province_id: "30", province: "Sulawesi Utara" },
  { province_id: "31", province: "Sumatera Barat" },
  { province_id: "32", province: "Sumatera Selatan" },
  { province_id: "33", province: "Sumatera Utara" },
];

const MOCK_CITIES: City[] = [
  { city_id: "1", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Selatan", postal_code: "12230" },
  { city_id: "2", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Pusat", postal_code: "10540" },
  { city_id: "3", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Barat", postal_code: "11220" },
  { city_id: "4", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Timur", postal_code: "13330" },
  { city_id: "5", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Utara", postal_code: "14110" },
  { city_id: "6", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bandung", postal_code: "40111" },
  { city_id: "7", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bekasi", postal_code: "17121" },
  { city_id: "8", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bogor", postal_code: "16111" },
  { city_id: "9", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Depok", postal_code: "16411" },
  { city_id: "10", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Semarang", postal_code: "50111" },
  { city_id: "11", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Solo", postal_code: "57111" },
  { city_id: "12", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Surabaya", postal_code: "60111" },
  { city_id: "13", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Malang", postal_code: "65111" },
  { city_id: "14", province_id: "5", province: "DI Yogyakarta", type: "Kota", city_name: "Yogyakarta", postal_code: "55111" },
  { city_id: "15", province_id: "1", province: "Bali", type: "Kota", city_name: "Denpasar", postal_code: "80111" },
  { city_id: "16", province_id: "27", province: "Sulawesi Selatan", type: "Kota", city_name: "Makassar", postal_code: "90111" },
  { city_id: "17", province_id: "25", province: "Riau", type: "Kota", city_name: "Pekanbaru", postal_code: "28111" },
  { city_id: "18", province_id: "33", province: "Sumatera Utara", type: "Kota", city_name: "Medan", postal_code: "20111" },
];

/** Faktor harga per kurir untuk mock (deterministik, tidak random) */
const MOCK_COURIER_FACTORS: Record<string, number> = {
  jne: 1,
  pos: 0.85,
  tiki: 1.1,
  sicepat: 1.05,
  jnt: 1.02,
  anteraja: 1.0,
  ninja: 1.15,
  lion: 1.2,
  wahana: 0.9,
  pandu: 0.8,
};

/** Layanan per kurir untuk mock: [nama service, etd, multiplier] */
const MOCK_COURIER_SERVICES: Record<
  string,
  { service: string; etd: string; multiplier: number }[]
> = {
  jne: [
    { service: "REG", etd: "2-3", multiplier: 1 },
    { service: "YES", etd: "1-1", multiplier: 2 },
    { service: "OKE", etd: "3-5", multiplier: 0.7 },
  ],
  pos: [
    { service: "Pos Reguler", etd: "3-5", multiplier: 1 },
    { service: "Pos Express", etd: "1-2", multiplier: 1.9 },
  ],
  tiki: [
    { service: "REG", etd: "2-3", multiplier: 1 },
    { service: "ECO", etd: "4-6", multiplier: 0.7 },
  ],
  sicepat: [
    { service: "REG", etd: "2-3", multiplier: 1 },
    { service: "BEST", etd: "1-2", multiplier: 1.8 },
  ],
  jnt: [
    { service: "EZ", etd: "2-3", multiplier: 1 },
    { service: "Express", etd: "1-1", multiplier: 1.9 },
  ],
  anteraja: [
    { service: "Reguler", etd: "2-3", multiplier: 1 },
    { service: "Same Day", etd: "1-1", multiplier: 2.2 },
  ],
  ninja: [
    { service: "Standard", etd: "2-4", multiplier: 1 },
    { service: "Express", etd: "1-2", multiplier: 1.8 },
  ],
  lion: [
    { service: "JAGUAR", etd: "2-3", multiplier: 1.2 },
    { service: "REGPACK", etd: "3-5", multiplier: 0.85 },
  ],
  wahana: [{ service: "Reguler", etd: "3-5", multiplier: 1 }],
  pandu: [{ service: "Logistik", etd: "3-6", multiplier: 1 }],
};

function roundTo500(value: number): number {
  return Math.max(1000, Math.round(value / 500) * 500);
}

/**
 * Mock ongkir deterministik: berat + faktor kurir + service.
 * Dipakai saat RAJAONGKIR_API_KEY kosong / lookup gagal.
 */
function generateMockCost(
  destinationCity: string,
  weightGram: number,
  couriers: string[] = DEFAULT_COURIERS
): ShippingCostResult[] {
  const kg = Math.max(1, Math.ceil(weightGram / 1000));
  const base = 9000 + (kg - 1) * 3000;
  // Catatan tujuan dipasang di `note` supaya respons mock tetap bisa ditelusuri
  const destination = destinationCity.trim();

  return couriers.map((code) => {
    const key = code.toLowerCase();
    const factor = MOCK_COURIER_FACTORS[key] ?? 1.05;
    const services =
      MOCK_COURIER_SERVICES[key] ??
      [{ service: "REG", etd: "2-4", multiplier: 1 }];

    return {
      code: key,
      name: courierLabel(key),
      costs: services.map((s) => ({
        service: s.service,
        description: `${courierLabel(key)} ${s.service}`,
        cost: [
          {
            value: roundTo500(base * factor * s.multiplier),
            etd: s.etd,
            note: destination ? `Tujuan: ${destination}` : "",
          },
        ],
      })),
    };
  });
}

// ── In-memory cache ───────────────────────────────────

const citiesByProvinceCache = new Map<string, City[]>();
let allCitiesCache: City[] | null = null;
let provincesCache: Province[] | null = null;

// ── Public API ────────────────────────────────────────

/** Daftar provinsi (mock atau RajaOngkir) */
export async function getProvinces(): Promise<Province[]> {
  if (USE_MOCK) {
    if (process.env.NODE_ENV === "production") throw new Error("RajaOngkir belum dikonfigurasi untuk production");
    return MOCK_PROVINCES;
  }
  if (provincesCache) return provincesCache;

  try {
    const rows = await rajaOngkirFetch<Array<{ id?: number; name?: string }>>(
      "/destination/province"
    );
    provincesCache = (rows ?? [])
      .filter((row) => row.id && row.name)
      .map((row) => ({ province_id: String(row.id), province: String(row.name) }));
    return provincesCache;
  } catch (error) {
    console.error("RajaOngkir provinces lookup failed:", error);
    if (process.env.NODE_ENV === "production") throw error;
    return MOCK_PROVINCES;
  }
}

/** Daftar kota, opsional difilter province_id */
export async function getCities(
  provinceId?: string,
  searchTerm?: string
): Promise<City[]> {
  if (USE_MOCK) {
    if (process.env.NODE_ENV === "production") throw new Error("RajaOngkir belum dikonfigurasi untuk production");
    if (!provinceId) return MOCK_CITIES;
    return MOCK_CITIES.filter((c) => c.province_id === provinceId);
  }

  const cacheKey = `${provinceId ?? "__all__"}:${searchTerm?.trim().toLowerCase() ?? ""}`;
  const cached = citiesByProvinceCache.get(cacheKey);
  if (cached) return cached;

  try {
    const province = provinceId ? await resolveProvince(provinceId) : null;
    const query = searchTerm?.trim() || province?.province || "";
    const endpoint = `/destination/domestic-destination?search=${encodeURIComponent(query)}&limit=100&offset=0`;
    const rows = await rajaOngkirFetch<Array<{
      id?: number;
      province_name?: string;
      city_name?: string;
      zip_code?: string;
    }>>(endpoint);
    const seen = new Set<string>();
    const list: City[] = [];
    for (const row of rows ?? []) {
      const rowProvince = String(row.province_name ?? "").trim();
      if (
        province &&
        normalizeCityName(rowProvince) !== normalizeCityName(province.province)
      ) continue;
      const name = String(row.city_name ?? "").trim();
      if (!row.id || !name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      list.push({
        city_id: String(row.id),
        province_id: provinceId ?? "",
        province: row.province_name ?? province?.province ?? "",
        type: "",
        city_name: name,
        postal_code: row.zip_code ?? "",
      });
    }
    citiesByProvinceCache.set(cacheKey, list);
    if (!provinceId) allCitiesCache = list;
    return list;
  } catch (error) {
    console.error("RajaOngkir cities lookup failed:", error);
    if (process.env.NODE_ENV === "production") throw error;
    if (!provinceId) return MOCK_CITIES;
    return MOCK_CITIES.filter((c) => c.province_id === provinceId);
  }
}

/** Semua kota (dipakai untuk resolve nama kota -> city_id) */
async function getAllCities(): Promise<City[]> {
  if (USE_MOCK) return MOCK_CITIES;
  if (allCitiesCache) return allCitiesCache;
  const cities = await getCities();
  return cities;
}

/** Cari provinsi berdasarkan id numerik atau nama */
export async function resolveProvince(
  identifier: string
): Promise<Province | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  const provinces = await getProvinces();

  const numeric = raw.match(/^\d+$/)?.[0];
  if (numeric) {
    return provinces.find((p) => p.province_id === numeric) ?? null;
  }

  const query = raw.toLowerCase().replace(/^(provinsi|prov\.?|di)\s+/i, "").trim();
  return (
    provinces.find((p) => p.province.toLowerCase() === query) ??
    provinces.find((p) => p.province.toLowerCase().includes(query)) ??
    provinces.find((p) => query.includes(p.province.toLowerCase())) ??
    null
  );
}

/** Cari kota berdasarkan city_id numerik; V2 menerima destination ID langsung. */
export async function findCityById(cityId: string): Promise<City | null> {
  const numeric = cityId.trim().match(/\d+/)?.[0];
  if (!numeric) return null;
  return {
    city_id: numeric,
    province_id: "",
    province: "",
    type: "",
    city_name: "",
    postal_code: "",
  };
}

/** Cari lokasi V2 berdasarkan label kota/kecamatan. */
export async function findCityByName(cityName: string): Promise<City | null> {
  const query = normalizeCityName(cityName);
  if (!query) return null;
  if (USE_MOCK) {
    const cities = await getAllCities();
    const scored = cities
      .map((city) => ({ city, score: scoreCityMatch(query, normalizeCityName(city.city_name)) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || Number(a.city.city_id) - Number(b.city.city_id));
    return scored[0]?.city ?? null;
  }

  const rows = await rajaOngkirFetch<Array<{
    id?: number;
    label?: string;
    province_name?: string;
    city_name?: string;
    district_name?: string;
    zip_code?: string;
  }>>(`/destination/domestic-destination?search=${encodeURIComponent(cityName)}&limit=20&offset=0`);
  const first = rows.find((row) =>
    [row.city_name, row.district_name, row.label]
      .filter(Boolean)
      .some((value) => normalizeCityName(String(value)).includes(query))
  ) ?? rows[0];
  if (!first?.id) return null;
  return {
    city_id: String(first.id),
    province_id: "",
    province: first.province_name ?? "",
    type: "",
    city_name: first.city_name ?? first.district_name ?? cityName,
    postal_code: first.zip_code ?? "",
  };
}

/**
 * Resolve tujuan pengiriman dari nama kota dan/atau city_id.
 * UUID alamat TIDAK pernah dianggap sebagai city id.
 */
export async function resolveDestination(
  input: DestinationInput
): Promise<ResolvedDestination> {
  const rawId =
    typeof input.destinationDistrictId === "string" && !isUuid(input.destinationDistrictId)
      ? input.destinationDistrictId.trim()
      : typeof input.destinationCityId === "string"
        ? input.destinationCityId.trim()
        : "";
  const rawName =
    typeof input.destinationCity === "string" ? input.destinationCity.trim() : "";

  if (rawId && !isUuid(rawId)) {
    const numericId = rawId.match(/\d+/)?.[0];
    if (numericId) {
      const city = await findCityById(numericId);
      return {
        cityId: numericId,
        cityName: city?.city_name ?? (rawName || null),
        resolved: true,
      };
    }
  }

  if (rawName && !isUuid(rawName)) {
    const city = await findCityByName(rawName);
    if (city) {
      return { cityId: city.city_id, cityName: city.city_name, resolved: true };
    }
    // Nama kota tidak dikenal di RajaOngkir -> biarkan route fallback ke mock
    return { cityId: null, cityName: rawName, resolved: false };
  }

  return { cityId: null, cityName: null, resolved: false };
}

/** Ubah hasil RajaOngkir (nested) jadi bentuk datar yang dibaca halaman checkout */
export function flattenCostResults(
  results: ShippingCostResult[]
): ShippingOptionResult[] {
  return results.flatMap((result) =>
    (result.costs ?? []).map((entry) => {
      const first = entry.cost?.[0];
      return {
        courier: (result.code ?? "").toLowerCase(),
        courierName: result.name || courierLabel(result.code ?? ""),
        service: entry.service,
        cost: Number(first?.value ?? 0),
        etd: first?.etd ?? "-",
      };
    })
  );
}

/**
 * Hitung opsi ongkir.
 * Mock dipakai kalau API key kosong ATAU lookup tujuan gagal.
 */
export async function getShippingOptions(
  originCityId: string,
  destination: DestinationInput,
  weightGram: number,
  couriers: string[] = DEFAULT_COURIERS
): Promise<{
  options: ShippingOptionResult[];
  source: ShippingSource;
  destination: ResolvedDestination;
}> {
  const resolved = await resolveDestination(destination);

  const mocked = (): ShippingOptionResult[] =>
    flattenCostResults(
      generateMockCost(
        resolved.cityName ?? destination.destinationCity ?? "",
        weightGram,
        couriers
      )
    );

  if (USE_MOCK) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RajaOngkir belum dikonfigurasi untuk production");
    }
    return { options: mocked(), source: "mock", destination: resolved };
  }

  if (!resolved.cityId) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Kota tujuan tidak memiliki area ID RajaOngkir yang valid");
    }
    // Kota tujuan tidak bisa di-resolve ke city_id RajaOngkir
    return { options: mocked(), source: "mock", destination: resolved };
  }

  try {
    const results = await getCost(
      originCityId,
      resolved.cityId,
      weightGram,
      couriers
    );
    const options = flattenCostResults(results);
    if (options.length === 0) throw new Error("RajaOngkir returned no costs");
    return { options, source: "rajaongkir", destination: resolved };
  } catch (error) {
    console.error("RajaOngkir cost lookup failed:", error);
    if (process.env.NODE_ENV === "production") throw error;
    return { options: mocked(), source: "mock", destination: resolved };
  }
}

/**
 * Hitung ongkir mentah dari RajaOngkir (atau mock).
 *
 * @param originCityId - city_id asal (mis. kota gudang)
 * @param destinationCityId - city_id tujuan (numerik!)
 * @param weightGram - berat dalam gram
 * @param couriers - kode kurir (default: jne,pos,tiki)
 */
export async function getCost(
  originCityId: string,
  destinationCityId: string,
  weightGram: number,
  couriers: string[] = DEFAULT_COURIERS
): Promise<ShippingCostResult[]> {
  if (USE_MOCK) {
    const dest = await findCityById(destinationCityId);
    return generateMockCost(dest?.city_name ?? "", weightGram, couriers);
  }

  const body = new URLSearchParams({
    origin: originCityId,
    destination: destinationCityId,
    weight: String(Math.max(1, Math.round(weightGram))),
    courier: couriers.join(":"),
    price: "lowest",
  });

  const response = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
    method: "POST",
    headers: {
      key: RAJAONGKIR_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "JagoFarm shipping/2.0",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RajaOngkir cost API error: ${response.status} - ${text}`);
  }

  const envelope = (await response.json()) as {
    data?: Array<{
      name?: string;
      code?: string;
      service?: string;
      description?: string;
      cost?: number;
      etd?: string;
    }>;
    meta?: { message?: string };
  };
  const rows = envelope.data ?? [];
  return rows.map((row) => ({
    code: (row.code ?? "").toLowerCase(),
    name: row.name ?? courierLabel(row.code ?? ""),
    costs: [{
      service: row.service ?? "REG",
      description: row.description ?? row.service ?? "",
      cost: [{
        value: Number(row.cost ?? 0),
        etd: row.etd ?? "-",
        note: "",
      }],
    }],
  }));
}

/** True kalau ongkir sedang memakai data mock (tanpa RAJAONGKIR_API_KEY) */
export function isUsingMockShipping(): boolean {
  return USE_MOCK;
}

/** Daftar kode kurir yang punya data mock lengkap */
export function supportedMockCouriers(): string[] {
  return Object.keys(MOCK_COURIER_SERVICES);
}
