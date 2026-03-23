/**
 * NextAuth v5 인증 설정
 * - Google OAuth 프로바이더
 * - JWT callback에서 Google id_token을 세션에 전달
 * - FastAPI 호출 시 Authorization: Bearer <id_token>으로 사용
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // id_token 갱신을 위해 refresh_token 요청
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // JWT에 Google id_token 저장
    async jwt({ token, account }) {
      if (account) {
        token.id_token = account.id_token;
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;
      }
      return token;
    },
    // 세션에 id_token 노출 (클라이언트에서 FastAPI 호출용)
    async session({ session, token }) {
      session.id_token = token.id_token as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
