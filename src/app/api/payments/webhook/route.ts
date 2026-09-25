import { NextRequest } from "next/server";
import { handleWebhookFor } from "@/lib/payments";

/**
 * POST /api/payments/webhook (URL lama — tetap kompatibel)
 *
 * Diteruskan ke handler generik untuk provider `midtrans`, sehingga perilakunya
 * identik dengan sebelumnya: verifikasi signature SHA512, idempoten, dan mesin
 * status yang sama dengan GET /api/payments/status/[orderId].
 */
export async function POST(request: NextRequest) {
  return handleWebhookFor("midtrans", request);
}
