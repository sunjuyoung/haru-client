/**
 * NextAuth v5 API 라우트 핸들러
 * - GET/POST 요청을 NextAuth가 자동 처리
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
