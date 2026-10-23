import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/", "/login", "/catalogo/:path*", "/meus-emprestimos/:path*", "/operacoes/:path*"],
};
