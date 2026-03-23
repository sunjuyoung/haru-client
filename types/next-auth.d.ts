/**
 * NextAuth 타입 확장
 * - session에 id_token 필드 추가
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    id_token?: string;
  }
}
