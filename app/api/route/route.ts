import { NextRequest, NextResponse } from "next/server";

type Coordinate = [number, number];

const validCoordinate = (value: unknown): value is Coordinate => Array.isArray(value)
  && value.length === 2
  && value.every((item) => typeof item === "number" && Number.isFinite(item));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coordinates = body?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.every(validCoordinate)) {
      return NextResponse.json({ error: "2地点以上の緯度・経度が必要です。" }, { status: 400 });
    }

    // OSRM 互換 URL。自前 OSRM / 有償経路APIのプロキシに切り替え可能です。
    const baseUrl = (process.env.ROUTING_API_URL || "https://router.project-osrm.org").replace(/\/$/, "");
    const path = coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";");
    const response = await fetch(`${baseUrl}/route/v1/driving/${path}?overview=full&geometries=geojson`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) throw new Error(`Routing service returned ${response.status}`);
    const payload = await response.json();
    const route = payload?.routes?.[0];
    if (!route?.geometry?.coordinates) throw new Error("経路データが取得できませんでした。");

    return NextResponse.json({ geometry: route.geometry.coordinates, distance: route.distance, duration: route.duration, source: "routing" });
  } catch {
    return NextResponse.json({ error: "経路サービスに接続できませんでした。簡易ルートを表示します。" }, { status: 503 });
  }
}
