import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { password } = await request.json();
  const correctPassword = process.env.APP_VIEW_PASSWORD;

  if (!correctPassword) {
    return new Response(
      JSON.stringify({ error: '서버 설정 오류: 비밀번호가 설정되지 않았습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set('view_access', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
    });
    return Response.json({ success: true });
  } else {
    return new Response(
      JSON.stringify({ error: '비밀번호가 올바르지 않습니다.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
