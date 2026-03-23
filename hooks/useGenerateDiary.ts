/**
 * SSE 기반 AI 일기 생성 훅
 * - fetch + ReadableStream으로 SSE 파싱 (POST 지원)
 * - 단계별 진행 상태 관리
 * - 에러/타임아웃 핸들링
 */

"use client";

import { useState, useCallback, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// === SSE 이벤트 타입 ===

export interface EmotionData {
  primary_emotion: string;
  emotion_keywords: string[];
  mood: string;
  emotion_color: string;
  regret_confidence: number;
}

export interface PoetData {
  poetic_title: string;
  poem_text: string;
}

export interface ArtData {
  sketch_prompt: string;
  sketch_image_url: string;
}

export interface MemoryData {
  rewritten_scene: string;
}

export type GenerationPhase =
  | "idle"        // 시작 전
  | "analyzing"   // 감정 분석 중
  | "analyzed"    // 감정 분석 완료
  | "creating"    // 시 + 스케치 생성 중
  | "drawing"     // 스케치 마무리 중
  | "imagining"   // "존재하지 않은 기억" 생성 중
  | "finishing"   // DB 저장 중
  | "complete"    // 완료
  | "error";      // 에러

export interface GenerationState {
  phase: GenerationPhase;
  message: string;
  emotion: EmotionData | null;
  poet: PoetData | null;
  art: ArtData | null;
  memory: MemoryData | null;
  soundKey: string | null;
  error: string | null;
  isGenerating: boolean;
}

const INITIAL_STATE: GenerationState = {
  phase: "idle",
  message: "",
  emotion: null,
  poet: null,
  art: null,
  memory: null,
  soundKey: null,
  error: null,
  isGenerating: false,
};

// === SSE 파서 ===

function parseSSEEvents(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  // 이벤트 블록은 빈 줄(\n\n)로 구분
  const blocks = chunk.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    let event = "";
    let data = "";

    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        event = line.slice(7);
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    if (event) {
      events.push({ event, data });
    }
  }

  return events;
}

// === 훅 ===

export function useGenerateDiary() {
  const [state, setState] = useState<GenerationState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (token: string, diaryId: string, force: boolean = false) => {
    // 이전 요청 취소
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // 상태 초기화
    setState({
      ...INITIAL_STATE,
      phase: "analyzing",
      message: "AI에게 일기를 보여주는 중...",
      isGenerating: true,
    });

    try {
      const url = `${API_BASE}/api/v1/diaries/${diaryId}/generate${force ? "?force=true" : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      // HTTP 에러 처리
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail || `생성 실패 (${res.status})`);
      }

      // ReadableStream으로 SSE 파싱
      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 완전한 이벤트 블록만 처리 (마지막 \n\n 기준)
        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline === -1) continue;

        const complete = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSEEvents(complete);

        for (const { event, data } of events) {
          const parsed = data ? JSON.parse(data) : {};

          switch (event) {
            case "started":
              setState((prev) => ({
                ...prev,
                phase: "analyzing",
                message: "오늘의 이야기를 읽고 있어요...",
              }));
              break;

            case "step":
              setState((prev) => {
                const next = { ...prev, message: parsed.message || prev.message };
                if (parsed.phase) next.phase = parsed.phase as GenerationPhase;
                if (parsed.emotion) next.emotion = parsed.emotion;
                if (parsed.poet) next.poet = parsed.poet;
                return next;
              });
              break;

            case "complete":
              setState((prev) => ({
                ...prev,
                phase: "complete",
                message: "완성!",
                emotion: parsed.emotion || prev.emotion,
                poet: parsed.poet || prev.poet,
                art: parsed.art || null,
                memory: parsed.memory || null,
                soundKey: parsed.sound_key || null,
                isGenerating: false,
              }));
              break;

            case "error":
              setState((prev) => ({
                ...prev,
                phase: "error",
                message: parsed.message || "생성 중 문제가 발생했어요.",
                error: parsed.message || "알 수 없는 오류",
                isGenerating: false,
              }));
              break;
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return; // 사용자 취소

      setState((prev) => ({
        ...prev,
        phase: "error",
        message: err.message || "생성 중 문제가 발생했어요.",
        error: err.message || "알 수 없는 오류",
        isGenerating: false,
      }));
    }
  }, []);

  // 상태 리셋
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, generate, reset };
}
