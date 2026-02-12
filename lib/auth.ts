import bcrypt from "bcryptjs";
import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

type DbUser = {
  id: number;
  username: string;
  password_hash: string;
  role: "super_admin" | "admin" | "user";
  is_active: 0 | 1;
  is_deleted: 0 | 1;
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "账号密码登录",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        const users = await query<DbUser>(
          "SELECT * FROM users WHERE username = ? LIMIT 1",
          [credentials.username]
        );
        const user = users[0];
        if (!user || user.is_deleted || !user.is_active) {
          return null;
        }
        const ok = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!ok) {
          return null;
        }
        await logOperation({
          userId: user.id,
          action: "login"
        });
        return {
          id: String(user.id),
          name: user.username,
          role: user.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  events: {
    async signOut(message) {
      const tokenUserId = message.token?.sub;
      if (tokenUserId) {
        await logOperation({
          userId: Number(tokenUserId),
          action: "logout"
        });
      }
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  }
};

export const auth = NextAuth(authOptions);
