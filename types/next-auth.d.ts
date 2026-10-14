import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'volunteer' | 'category_responsible' | 'admin';
      firstName: string;
      lastName: string;
      phone: string;
      responsibleForCategories: string[];
    } & DefaultSession['user'];
  }
}
