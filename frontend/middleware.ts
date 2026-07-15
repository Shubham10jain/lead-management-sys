import { NextRequest, NextResponse } from "next/server";

const TOKEN_KEY = "lead_mgmt_token";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    const isAttorneyRoute = request.nextUrl.pathname.startsWith("/attorney");
    const redirectPath = isAttorneyRoute ? "/attorney/login" : "/sign-in";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/complete-profile", "/attorney/leads/:path*"],
};
