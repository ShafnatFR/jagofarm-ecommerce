/**
 * RajaOngkir shipping cost integration
 * Falls back to mock data when RAJAONGKIR_API_KEY is not set
 */

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY ?? "";
const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL ?? "https://api.rajaongkir.com/starter";

const USE_MOCK = !RAJAONGKIR_API_KEY;

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
  return data.rajaongkir?.results ?? data.rajaongkir;
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

function generateMockCost(
  destinationCity: string,
  weightGram: number
): ShippingCostResult[] {
  // Seed stable mock pricing based on city name length and weight
  const baseCostJne = 9000 + Math.floor(weightGram / 1000) * 3000;
  const baseCostPos = 7000 + Math.floor(weightGram / 1000) * 2000;
  const baseCostTiki = 10000 + Math.floor(weightGram / 1000) * 3500;

  return [
    {
      code: "jne",
      name: "Jalur Nugraha Ekakurir (JNE)",
      costs: [
        {
          service: "REG",
          description: "Layanan Reguler",
          cost: [{ value: baseCostJne, etd: "2-3", note: "" }],
        },
        {
          service: "YES",
          description: "Yakin Esok Sampai",
          cost: [{ value: baseCostJne * 2, etd: "1-1", note: "" }],
        },
        {
          service: "OKE",
          description: "Ongkos Kirim Ekonomis",
          cost: [{ value: Math.floor(baseCostJne * 0.7), etd: "3-5", note: "" }],
        },
      ],
    },
    {
      code: "pos",
      name: "POS Indonesia (POS)",
      costs: [
        {
          service: "Pos Reguler",
          description: "Pos Reguler",
          cost: [{ value: baseCostPos, etd: "3-5", note: "" }],
        },
        {
          service: "Pos Express",
          description: "Pos Express",
          cost: [{ value: baseCostPos * 2, etd: "1-2", note: "" }],
        },
      ],
    },
    {
      code: "tiki",
      name: "Citra Van Titipan Kilat (TIKI)",
      costs: [
        {
          service: "REG",
          description: "Regular Service",
          cost: [{ value: baseCostTiki, etd: "2-3", note: "" }],
        },
        {
          service: "ECO",
          description: "Economy Service",
          cost: [{ value: Math.floor(baseCostTiki * 0.7), etd: "4-6", note: "" }],
        },
      ],
    },
  ];
}

// ── Public API ────────────────────────────────────────

/**
 * Get list of provinces
 */
export async function getProvinces(): Promise<Province[]> {
  if (USE_MOCK) {
    return MOCK_PROVINCES;
  }
  return rajaOngkirFetch<Province[]>("/province");
}

/**
 * Get cities, optionally filtered by province ID
 */
export async function getCities(
  provinceId?: string
): Promise<City[]> {
  if (USE_MOCK) {
    if (!provinceId) return MOCK_CITIES;
    return MOCK_CITIES.filter((c) => c.province_id === provinceId);
  }
  const query = provinceId ? `?province=${provinceId}` : "";
  return rajaOngkirFetch<City[]>(`/city${query}`);
}

/**
 * Calculate shipping cost
 *
 * @param originCityId - Origin city ID (e.g., warehouse city)
 * @param destinationCityId - Destination city ID
 * @param weightGram - Weight in grams
 * @param couriers - Courier codes to query (default: jne,pos,tiki)
 */
export async function getCost(
  originCityId: string,
  destinationCityId: string,
  weightGram: number,
  couriers: string[] = ["jne", "pos", "tiki"]
): Promise<ShippingCostResult[]> {
  if (USE_MOCK) {
    const dest = MOCK_CITIES.find((c) => c.city_id === destinationCityId);
    return generateMockCost(dest?.city_name ?? "Unknown", weightGram);
  }

  const courierList = couriers.join(":");

  const url = `/cost?origin=${originCityId}&destination=${destinationCityId}&weight=${weightGram}&courier=${courierList}`;

  const response = await fetch(`${RAJAONGKIR_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      key: RAJAONGKIR_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `origin=${originCityId}&destination=${destinationCityId}&weight=${weightGram}&courier=${courierList}`,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RajaOngkir cost API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.rajaongkir?.results ?? [];
}

/**
 * Check if we're using mock/shipping data (no real API key configured)
 */
export function isUsingMockShipping(): boolean {
  return USE_MOCK;
}
