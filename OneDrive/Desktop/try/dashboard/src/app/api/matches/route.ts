import { NextResponse } from "next/server";

const CONVEX_URL = "https://clear-finch-529.convex.cloud";
const CONVEX_KEY = "dev:clear-finch-529|eyJ2MiI6ImE0ZWExYWRkZDVkZjQ5MjBhZTJmMGRhYjMzZTE4ODcyIn0=";

export async function GET() {
  const r = await fetch(CONVEX_URL + "/api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Convex-Client": "npm-1.42.1",
      Authorization: "Convex " + CONVEX_KEY,
    },
    body: JSON.stringify({
      path: "matches:listAllWithQuarters",
      format: "convex_encoded_json",
      args: [{}],
    }),
  });
  const text = await r.text();
  const parsed = JSON.parse(text);
  return NextResponse.json(parsed.value ?? parsed);
}
