/**
 * 일기 상세 페이지
 * - 일기 내용 표시
 * - AI 생성 SSE 스트리밍 (단계별 진행 + 결과)
 * - 감정 분석, 시, 스케치 이미지, "존재하지 않은 기억" 표시
 * - 덮어쓰기(재생성) 확인 다이얼로그
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "@/components/header";
import { getDiary, type Diary } from "@/lib/api";
import { useGenerateDiary, type GenerationPhase } from "@/hooks/useGenerateDiary";
import Link from "next/link";

export default function DiaryDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const diaryId = params.id as string;

  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

  // SSE 생성 훅
  const gen = useGenerateDiary();

  // 비로그인 시 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // 일기 상세 조회
  const fetchDiary = useCallback(async () => {
    if (!session?.id_token || !diaryId) return;
    setLoading(true);
    try {
      const data = await getDiary(session.id_token, diaryId);
      setDiary(data);
    } catch (err: any) {
      setError(err.message || "일기를 불러올 수 없어요.");
    } finally {
      setLoading(false);
    }
  }, [session?.id_token, diaryId]);

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  // SSE 생성 완료 시 일기 다시 조회
  useEffect(() => {
    if (gen.phase === "complete") {
      fetchDiary();
    }
  }, [gen.phase, fetchDiary]);

  // AI 생성 트리거
  const handleGenerate = (force = false) => {
    if (!session?.id_token || !diaryId) return;
    setShowOverwriteDialog(false);
    gen.generate(session.id_token, diaryId, force);
  };

  // 재생성 버튼 클릭 — 기존 결과가 있으면 확인 다이얼로그
  const handleRegenerateClick = () => {
    if (diary?.result) {
      setShowOverwriteDialog(true);
    } else {
      handleGenerate(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{error}</p>
          <Link href="/" className="text-sm text-primary hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  if (!diary) return null;

  const result = diary.result;
  const memory = diary.memory;
  const isGenerating = gen.isGenerating;
  const hasResult = result || gen.phase === "complete";

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* 날짜 + 상태 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{diary.written_date}</h2>
          <div className="flex items-center gap-2">
            {diary.is_overwrite && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                수정됨
              </span>
            )}
            {/* 재생성 버튼 (결과가 있을 때만) */}
            {result && !isGenerating && (
              <button
                onClick={handleRegenerateClick}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                다시 생성
              </button>
            )}
          </div>
        </div>

        {/* 일기 내용 */}
        <div className="rounded-xl border border-border p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {diary.content}
          </p>
        </div>

        {/* AI 결과 / 생성 중 / 에러 / 미생성 */}
        {hasResult ? (
          <ResultSection
            result={result}
            memory={memory}
            sseEmotion={gen.emotion}
            ssePoet={gen.poet}
            sseArt={gen.art}
            sseMemory={gen.memory}
            sseSoundKey={gen.soundKey}
          />
        ) : isGenerating ? (
          <GeneratingSection phase={gen.phase} message={gen.message} emotion={gen.emotion} />
        ) : gen.phase === "error" ? (
          <ErrorSection message={gen.error || ""} onRetry={() => handleGenerate(false)} />
        ) : (
          <IdleSection onGenerate={() => handleGenerate(false)} />
        )}

        {/* 뒤로 가기 */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 목록으로
          </Link>
        </div>
      </main>

      {/* 덮어쓰기 확인 다이얼로그 */}
      {showOverwriteDialog && (
        <OverwriteDialog
          onConfirm={() => handleGenerate(true)}
          onCancel={() => setShowOverwriteDialog(false)}
        />
      )}
    </>
  );
}

// === 하위 컴포넌트 ===

/** 덮어쓰기 확인 다이얼로그 */
function OverwriteDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
        <h3 className="mb-2 text-base font-semibold">다시 생성할까요?</h3>
        <p className="mb-5 text-sm text-muted-foreground">
          기존 AI 결과(감정 분석, 시, 스케치)가 새로운 결과로 대체됩니다.
          이전 결과는 복구할 수 없어요.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            다시 생성
          </button>
        </div>
      </div>
    </div>
  );
}

/** AI 미생성 상태 */
function IdleSection({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">
        아직 AI가 이 일기를 읽지 않았어요.
      </p>
      <button
        onClick={onGenerate}
        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        AI에게 일기 보여주기
      </button>
    </div>
  );
}

/** 생성 진행 중 UI */
function GeneratingSection({
  phase,
  message,
  emotion,
}: {
  phase: GenerationPhase;
  message: string;
  emotion: any;
}) {
  const phases: GenerationPhase[] = ["analyzing", "analyzed", "creating", "drawing", "imagining", "finishing"];
  const currentIdx = phases.indexOf(phase);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / phases.length) * 100 : 10;

  return (
    <div className="mt-6 rounded-xl border border-border p-8">
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm font-medium">{message}</p>
        {emotion && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: emotion.emotion_color }}
            />
            <span className="text-xs text-muted-foreground">
              {emotion.primary_emotion} · {emotion.mood}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** 에러 UI */
function ErrorSection({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="text-sm text-destructive">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
      >
        다시 시도하기
      </button>
    </div>
  );
}

/** AI 생성 결과 표시 (감정 + 시 + 스케치 + 사운드 + 기억) */
function ResultSection({
  result,
  memory,
  sseEmotion,
  ssePoet,
  sseArt,
  sseMemory,
  sseSoundKey,
}: {
  result: Diary["result"];
  memory: Diary["memory"];
  sseEmotion: any;
  ssePoet: any;
  sseArt: any;
  sseMemory: any;
  sseSoundKey: string | null;
}) {
  // DB 결과 우선, 없으면 SSE 실시간 결과
  const emotion = result
    ? {
        primary_emotion: result.primary_emotion,
        emotion_keywords: result.emotion_keywords,
        mood: result.mood,
        emotion_color: result.emotion_color,
      }
    : sseEmotion;

  const poet = result
    ? { poetic_title: result.poetic_title, poem_text: result.poem_text }
    : ssePoet;

  const sketchUrl = result?.sketch_image_url || sseArt?.sketch_image_url;
  const memoryScene = memory?.rewritten_scene || sseMemory?.rewritten_scene;
  const soundKey = result?.sound_key || sseSoundKey;

  if (!emotion) return null;

  return (
    <div className="mt-6 space-y-5">
      {/* 감정 분석 결과 */}
      <div className="rounded-xl border border-border p-5">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: emotion.emotion_color }}
          />
          <h3 className="text-sm font-semibold">{emotion.primary_emotion}</h3>
          <span className="text-xs text-muted-foreground">{emotion.mood}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {emotion.emotion_keywords?.map((kw: string) => (
            <span
              key={kw}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 시적 제목 + 시 본문 */}
      {poet && (
        <div className="rounded-xl border border-border p-5 text-center">
          <h3 className="mb-3 text-base font-semibold">{poet.poetic_title}</h3>
          <p className="whitespace-pre-wrap text-sm leading-loose text-muted-foreground">
            {poet.poem_text}
          </p>
        </div>
      )}

      {/* 스케치 이미지 */}
      {sketchUrl && (
        <div className="overflow-hidden rounded-xl border border-border">
          <img
            src={sketchUrl}
            alt={poet?.poetic_title || "스케치"}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* ASMR 사운드 플레이어 */}
      {soundKey && <SoundPlayer soundKey={soundKey} />}

      {/* "존재하지 않은 기억" 카드 */}
      {memoryScene && <MemoryCard scene={memoryScene} />}
    </div>
  );
}

/** ASMR 사운드 플레이어 */
function SoundPlayer({ soundKey }: { soundKey: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundUrl = `/sounds/${soundKey}`;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        // 브라우저 자동재생 정책에 의해 차단될 수 있음
      });
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        aria-label={isPlaying ? "일시정지" : "재생"}
      >
        {isPlaying ? (
          /* 일시정지 아이콘 */
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          /* 재생 아이콘 */
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <p className="text-xs font-medium">연필 소리 ASMR</p>
        <p className="text-[10px] text-muted-foreground">{soundKey}</p>
      </div>
      <audio
        ref={audioRef}
        src={soundUrl}
        loop
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
}

/** "존재하지 않은 기억" 카드 */
function MemoryCard({ scene }: { scene: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          존재하지 않은 기억
        </span>
        <span className="text-xs text-muted-foreground/70">
          — 만약 그때 다르게 행동했다면
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-muted-foreground">
        {scene}
      </p>
    </div>
  );
}
