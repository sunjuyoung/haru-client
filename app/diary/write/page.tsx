/**
 * 일기 작성 페이지
 * - 날짜 선택 + 일기 내용 입력
 * - 저장 → FastAPI POST /api/v1/diaries
 * - 저장 성공 시 일기 상세 페이지로 이동
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { createDiary } from "@/lib/api";

export default function DiaryWritePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 오늘 날짜를 기본값으로
  const today = new Date().toISOString().split("T")[0];
  const [writtenDate, setWrittenDate] = useState(today);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 비로그인 시 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.id_token || !content.trim()) return;

    setSaving(true);
    setError("");

    try {
      const diary = await createDiary(session.id_token, {
        content: content.trim(),
        written_date: writtenDate,
      });
      router.push(`/diary/${diary.id}`);
    } catch (err: any) {
      setError(err.message || "저장 중 문제가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h2 className="mb-6 text-xl font-semibold">오늘의 일기</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 날짜 선택 */}
          <div>
            <label
              htmlFor="written_date"
              className="mb-1.5 block text-sm font-medium"
            >
              날짜
            </label>
            <input
              id="written_date"
              type="date"
              value={writtenDate}
              onChange={(e) => setWrittenDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* 일기 내용 */}
          <div>
            <label
              htmlFor="content"
              className="mb-1.5 block text-sm font-medium"
            >
              오늘 하루는 어땠나요?
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="오늘 하루의 이야기를 자유롭게 적어보세요..."
              rows={10}
              maxLength={5000}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {content.length} / 5,000
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* 저장 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "일기 저장하기"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
