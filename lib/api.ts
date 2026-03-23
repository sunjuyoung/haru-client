/**
 * FastAPI 백엔드 API 클라이언트
 * - fetch wrapper + 타입 안전한 요청/응답
 * - 인증 토큰 자동 첨부
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// === API 에러 클래스 ===
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// === fetch wrapper ===
async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  // 인증 토큰 첨부
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}

// === 타입 정의 ===
export interface DiaryResult {
  id: string;
  primary_emotion: string;
  emotion_keywords: string[];
  mood: string;
  emotion_color: string;
  regret_confidence: number;
  poetic_title: string;
  poem_text: string;
  sketch_image_url: string;
  sound_key: string | null;
  created_at: string;
}

export interface DiaryMemory {
  id: string;
  rewritten_scene: string;
  memory_image_url: string | null;
  created_at: string;
}

export interface Diary {
  id: string;
  content: string;
  written_date: string;
  is_overwrite: boolean;
  result?: DiaryResult | null;
  memory?: DiaryMemory | null;
  created_at: string;
  updated_at: string;
}

export interface DiaryListItem {
  id: string;
  written_date: string;
  content_preview: string;
  is_overwrite: boolean;
  has_result: boolean;
  created_at: string;
}

export interface DiaryListResponse {
  year: number;
  month: number;
  diaries: DiaryListItem[];
  total: number;
}

// === API 함수 ===

/** 일기 생성 */
export async function createDiary(
  token: string,
  data: { content: string; written_date: string },
): Promise<Diary> {
  return apiFetch<Diary>("/api/v1/diaries", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

/** 월별 일기 목록 조회 */
export async function getDiaries(
  token: string,
  year: number,
  month: number,
): Promise<DiaryListResponse> {
  return apiFetch<DiaryListResponse>(
    `/api/v1/diaries?year=${year}&month=${month}`,
    { token },
  );
}

/** 일기 상세 조회 */
export async function getDiary(
  token: string,
  diaryId: string,
): Promise<Diary> {
  return apiFetch<Diary>(`/api/v1/diaries/${diaryId}`, { token });
}

// === 책장 갤러리 ===

export interface BookshelfMonth {
  month: number;
  diary_count: number;
  has_result: boolean;
  cover_image_url: string | null;
  cover_emotion_color: string | null;
  cover_title: string | null;
}

export interface BookshelfResponse {
  year: number;
  months: BookshelfMonth[];
}

/** 연간 책장 데이터 조회 */
export async function getBookshelf(
  token: string,
  year: number,
): Promise<BookshelfResponse> {
  return apiFetch<BookshelfResponse>(
    `/api/v1/diaries/bookshelf?year=${year}`,
    { token },
  );
}

// AI 생성은 SSE 스트리밍으로 처리 → hooks/useGenerateDiary.ts 참조
