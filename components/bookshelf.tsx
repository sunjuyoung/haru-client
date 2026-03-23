/**
 * 책장 갤러리 컴포넌트
 * - 12개월을 책 형태로 시각화
 * - 대표 스케치가 있으면 커버 이미지, 없으면 빈 책
 * - 클릭 시 해당 월 리스트로 전환
 */

"use client";

import { type BookshelfMonth } from "@/lib/api";

// === 월 이름 (한국어) ===
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface BookshelfProps {
  year: number;
  months: BookshelfMonth[];
  onMonthClick: (month: number) => void;
}

export function Bookshelf({ year, months, onMonthClick }: BookshelfProps) {
  const totalDiaries = months.reduce((sum, m) => sum + m.diary_count, 0);
  const monthsWithDiaries = months.filter((m) => m.diary_count > 0).length;

  return (
    <div>
      {/* 연간 요약 */}
      {totalDiaries > 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {year}년에 {monthsWithDiaries}개월, 총 {totalDiaries}편의 일기를 썼어요.
        </p>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {year}년에는 아직 일기가 없어요.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            오늘의 이야기를 적어보세요.
          </p>
        </div>
      )}

      {/* 12개월 책장 그리드 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
        {months.map((m) => (
          <BookItem
            key={m.month}
            month={m}
            onClick={() => onMonthClick(m.month)}
          />
        ))}
      </div>
    </div>
  );
}

/** 개별 책 아이템 */
function BookItem({
  month,
  onClick,
}: {
  month: BookshelfMonth;
  onClick: () => void;
}) {
  const hasContent = month.diary_count > 0;
  const hasCover = !!month.cover_image_url;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      {/* 책 커버 영역 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {hasCover ? (
          /* 대표 스케치 이미지 */
          <img
            src={month.cover_image_url!}
            alt={month.cover_title || `${MONTH_NAMES[month.month - 1]} 스케치`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : hasContent ? (
          /* 일기는 있지만 AI 결과 없음 */
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundColor: month.cover_emotion_color
                ? `${month.cover_emotion_color}20`
                : undefined,
            }}
          >
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-muted-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {month.diary_count}편
              </p>
            </div>
          </div>
        ) : (
          /* 빈 달 */
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-6 w-[1px] bg-border" />
          </div>
        )}

        {/* 감정 색상 스트라이프 (커버 이미지 위 하단) */}
        {month.cover_emotion_color && hasCover && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: month.cover_emotion_color }}
          />
        )}
      </div>

      {/* 책 하단 — 월 이름 + 일기 수 */}
      <div className="flex items-center justify-between px-2.5 py-2">
        <span className="text-xs font-medium">
          {MONTH_NAMES[month.month - 1]}
        </span>
        {hasContent && (
          <span className="text-[10px] text-muted-foreground">
            {month.diary_count}
          </span>
        )}
      </div>
    </button>
  );
}
