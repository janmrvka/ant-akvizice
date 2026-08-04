import { NextResponse } from "next/server";

const USER = "ant";
const PASS = process.env.BASIC_AUTH_PASSWORD || "akvizice2025";

export function middleware(request) {
  // API cron endpoint nepotřebuje basic auth
  if (request.nextUrl.pathname.startsWith("/api/scrape")) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");
      if (user === USER && pass === PASS) {
        return NextResponse.next();
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
