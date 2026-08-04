import { NextResponse } from "next/server";

const USER = "ant";
const PASS = process.env.BASIC_AUTH_PASSWORD || "akvizice2025";

export function middleware(request) {
  if (request.nextUrl.pathname.startsWith("/api/scrape")) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = Buffer.from(encoded, "base64").toString("utf-8");
        const colonIndex = decoded.indexOf(":");
        const user = decoded.slice(0, colonIndex);
        const pass = decoded.slice(colonIndex + 1);
        if (user === USER && pass === PASS) {
          return NextResponse.next();
        }
      } catch {
        // invalid base64
      }
    }
  }

  return new NextResponse("Přístup odepřen", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ANT Akvizice"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
