/**
 * 메인 페이지 — 하이브리드 뷰 (책장 갤러리 ↔ 월별 리스트)
 * - 책장 뷰: 연간 12개월을 책 형태로 표시
 * - 리스트 뷰: 해당 월의 일기 목록 표시
 * - 뷰 전환 토글 버튼
 * - 일기 작성 FAB 버튼
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/header";
import { Bookshelf } from "@/components/bookshelf";
import {
  getDiaries,
  getBookshelf,
  type DiaryListItem,
  type BookshelfMonth,
} from "@/lib/api";
import Link from "next/link";

type ViewMode = "bookshelf" | "list";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>("bookshelf");

  // 리스트 뷰 데이터
  const [diaries, setDiaries] = useState<DiaryListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // 책장 뷰 데이터
  const [bookshelfMonths, setBookshelfMonths] = useState<BookshelfMonth[]>([]);
  const [bookshelfLoading, setBookshelfLoading] = useState(false);

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // 책장 데이터 조회
  const fetchBookshelf = useCallback(async () => {
    if (!session?.id_token) return;
    setBookshelfLoading(true);
    try {
      const res = await getBookshelf(session.id_token, year);
      setBookshelfMonths(res.months);
    } catch (err) {
      console.error("Bookshelf fetch error:", err);
    } finally {
      setBookshelfLoading(false);
    }
  }, [session?.id_token, year]);

  // 리스트 데이터 조회
  const fetchDiaries = useCallback(async () => {
    if (!session?.id_token) return;
    setListLoading(true);
    try {
      const res = await getDiaries(session.id_token, year, month);
      setDiaries(res.diaries);
    } catch (err) {
      console.error("Diaries fetch error:", err);
    } finally {
      setListLoading(false);
    }
  }, [session?.id_token, year, month]);

  // 뷰 모드에 따라 데이터 조회
  useEffect(() => {
    if (viewMode === "bookshelf") {
      fetchBookshelf();
    } else {
      fetchDiaries();
    }
  }, [viewMode, fetchBookshelf, fetchDiaries]);

  // 월 이동 핸들러
  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // 연도 이동 핸들러 (책장 뷰)
  const goToPrevYear = () => setYear((y) => y - 1);
  const goToNextYear = () => setYear((y) => y + 1);

  // 책장에서 월 클릭 → 리스트 뷰로 전환
  const handleMonthClick = (clickedMonth: number) => {
    setMonth(clickedMonth);
    setViewMode("list");
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
        {/* 뷰 전환 토글 + 연도/월 네비게이션 */}
        {viewMode === "bookshelf" ? (
          /* 책장 뷰 헤더: 연도 네비게이션 */
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={goToPrevYear}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              ← {year - 1}
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{year}년</h2>
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
            <button
              onClick={goToNextYear}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              {year + 1} →
            </button>
          </div>
        ) : (
          /* 리스트 뷰 헤더: 월 네비게이션 */
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              ← 이전
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {year}년 {month}월
              </h2>
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
            <button
              onClick={goToNextMonth}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              다음 →
            </button>
          </div>
        )}

        {/* 콘텐츠 영역 */}
        {viewMode === "bookshelf" ? (
          /* 책장 갤러리 */
          bookshelfLoading ? (
            <p className="py-12 text-center text-muted-foreground">
              불러오는 중...
            </p>
          ) : (
            <Bookshelf
              year={year}
              months={bookshelfMonths}
              onMonthClick={handleMonthClick}
            />
          )
        ) : (
          /* 리스트 뷰 */
          <DiaryList
            diaries={diaries}
            loading={listLoading}
          />
        )}

        {/* 일기 작성 FAB 버튼 */}
        <Link
          href="/diary/write"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          aria-label="일기 쓰기"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </Link>
      </main>
    </>
  );
}

// === 하위 컴포넌트 ===

/** 뷰 전환 토글 버튼 */
function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border p-0.5">
      {/* 책장 아이콘 */}
      <button
        onClick={() => onChange("bookshelf")}
        className={`rounded-md px-2 py-1 transition-colors ${
          viewMode === "bookshelf"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="책장 보기"
        title="책장 보기"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v14H4V6zm6 0a2 2 0 012-2h2a2 2 0 012 2v14h-6V6zm8-2h2a2 2 0 012 2v14h-4V6a2 2 0 012-2z" />
        </svg>
      </button>
      {/* 리스트 아이콘 */}
      <button
        onClick={() => onChange("list")}
        className={`rounded-md px-2 py-1 transition-colors ${
          viewMode === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="리스트 보기"
        title="리스트 보기"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}

/** 일기 리스트 뷰 */
function DiaryList({
  diaries,
  loading,
}: {
  diaries: DiaryListItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        불러오는 중...
      </p>
    );
  }

  if (diaries.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          이 달에는 아직 일기가 없어요.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 이야기를 적어보세요.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {diaries.map((diary) => (
        <li key={diary.id}>
          <Link
            href={`/diary/${diary.id}`}
            className="block rounded-xl border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {diary.written_date}
              </span>
              <div className="flex items-center gap-2">
                {diary.has_result && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    생성완료
                  </span>
                )}
                {diary.is_overwrite && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    수정됨
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {diary.content_preview}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
