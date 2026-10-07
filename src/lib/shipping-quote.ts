export interface ShippingQuoteItem {
  quantity: number;
  weightGram: number;
  lengthCm: number | null | undefined;
  widthCm: number | null | undefined;
  heightCm: number | null | undefined;
}

export interface ShippingWeightBreakdown {
  actualWeightGram: number;
  volumetricWeightGram: number;
  chargeableWeightGram: number;
  divisor: number;
}

export interface LiveShippingOption {
  courier: string;
  courierName?: string;
  service: string;
  cost: number;
  etd: string;
}

const positive = (value: number | null | undefined): number =>
  Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0;

/** Calculates shipment weights without depending on Prisma, fetch, or Next.js. */
export function calculateChargeableWeight(
  items: ShippingQuoteItem[],
  divisor = Number(process.env.SHIPPING_VOLUMETRIC_DIVISOR ?? 5000)
): ShippingWeightBreakdown {
  if (!Number.isFinite(divisor) || divisor <= 0) {
    throw new Error("Pembagi berat volumetrik tidak valid");
  }

  let actualWeightGram = 0;
  let volumetricWeightGram = 0;
  for (const item of items) {
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    const weight = positive(item.weightGram);
    actualWeightGram += weight * quantity;

    const volume =
      positive(item.lengthCm) * positive(item.widthCm) * positive(item.heightCm);
    volumetricWeightGram += (volume / divisor) * 1000 * quantity;
  }

  const actual = Math.ceil(actualWeightGram);
  const volumetric = Math.ceil(volumetricWeightGram);
  return {
    actualWeightGram: actual,
    volumetricWeightGram: volumetric,
    chargeableWeightGram: Math.max(actual, volumetric),
    divisor,
  };
}

/** Matches the selected pair to the exact options returned by the provider. */
export function validateSelectedShippingOption(
  options: LiveShippingOption[],
  courier: string,
  service: string
): LiveShippingOption {
  const normalizedCourier = courier.trim().toLowerCase();
  const normalizedService = service.trim().toLowerCase();
  if (!normalizedCourier) throw new Error("Kurir pengiriman wajib dipilih");
  if (!normalizedService) throw new Error("Layanan pengiriman wajib dipilih");

  const option = options.find(
    (candidate) =>
      candidate.courier.trim().toLowerCase() === normalizedCourier &&
      candidate.service.trim().toLowerCase() === normalizedService
  );
  if (!option) {
    if (!options.some((candidate) => candidate.courier.trim().toLowerCase() === normalizedCourier)) {
      throw new Error("Kurir pengiriman tidak tersedia pada quote terbaru");
    }
    throw new Error("Layanan pengiriman tidak tersedia pada quote terbaru");
  }
  if (!Number.isFinite(option.cost) || option.cost < 0) {
    throw new Error("Biaya pengiriman dari provider tidak valid");
  }
  return option;
}
