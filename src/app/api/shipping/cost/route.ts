import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    if (!destination || !weight) {
      return NextResponse.json(
        { error: "origin, destination, and weight are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;

    if (!apiKey) {
      // Mock response when no API key
      const couriers = courier ? [courier] : ["jne", "pos", "tiki"];
      const mockResults = couriers.flatMap((c: string) => [
        {
          courier: c.toUpperCase(),
          service: `${c.toUpperCase()} REG`,
          cost: 18000,
          etd: "2-3",
        },
        {
          courier: c.toUpperCase(),
          service: `${c.toUpperCase()} OKE`,
          cost: 15000,
          etd: "3-5",
        },
        {
          courier: c.toUpperCase(),
          service: `${c.toUpperCase()} YES`,
          cost: 25000,
          etd: "1-2",
        },
      ]);

      return NextResponse.json({ costs: mockResults });
    }

    // Real RajaOngkir API call
    const response = await fetch(
      "https://api.rajaongkir.com/starter/cost",
      {
        method: "POST",
        headers: {
          key: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          origin: String(origin),
          destination: String(destination),
          weight: String(weight),
          courier: courier || "jne",
        }),
      }
    );

    const data = await response.json();
    const results =
      data.rajaongkir?.results?.flatMap((r: any) =>
        r.costs.map((c: any) => ({
          courier: r.code.toUpperCase(),
          service: c.service,
          cost: c.cost[0]?.value || 0,
          etd: c.cost[0]?.etd || "-",
        }))
      ) || [];

    return NextResponse.json({ costs: results });
  } catch (error) {
    console.error("Shipping cost error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
