/**
 * 페이지 진입 시 사운드 1회 재생 훅
 * - 마운트 시 지정 사운드를 한 번 재생
 * - 브라우저 자동재생 정책 대응 (차단 시 무시)
 */

"use client";

import { useEffect } from "react";

export function usePageSound(soundPath: string = "/sounds/pencil_default.mp3") {
  useEffect(() => {
    const audio = new Audio(soundPath);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // 브라우저 자동재생 정책에 의해 차단될 수 있음 — 무시
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [soundPath]);
}
