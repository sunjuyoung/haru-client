/**
 * 클라이언트 프로바이더 래퍼
 * - NextAuth SessionProvider로 세션 컨텍스트 제공
 */

"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
