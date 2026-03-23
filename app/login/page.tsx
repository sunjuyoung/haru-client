/**
 * 로그인 페이지
 * - Google OAuth 로그인 버튼
 * - 비로그인 상태에서만 접근
 */

"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 이미 로그인된 경우 메인으로 리다이렉트
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      {/* 로고 및 타이틀 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">하루일기</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          AI가 그려주는 세상에 하나뿐인 일기
        </p>
      </div>

      {/* Google 로그인 버튼 */}
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex items-center gap-3 rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent dark:bg-card"
      >
        {/* Google 아이콘 (SVG) */}
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google로 시작하기
      </button>

      {/* 부가 설명 */}
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        로그인하면 하루의 이야기를 AI가 분석하고, 세상에 하나뿐인
        연필 스케치와 시를 만들어드려요.
      </p>
    </div>
  );
}
