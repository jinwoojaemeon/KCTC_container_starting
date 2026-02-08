import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 비밀번호 통과 확인 (view_access 쿠키)
  const cookieStore = await cookies();
  const viewAccess = cookieStore.get('view_access');
  if (!viewAccess || viewAccess.value !== '1') {
    return new Response(
      JSON.stringify({ error: '데이터 보기를 위해 비밀번호를 입력해 주세요.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1) Vercel Blob에서 db.json 로드 시도
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { blobs } = await list({ prefix: '' });
      const dbBlob = blobs.find((b) => b.pathname === 'db.json' || b.pathname?.endsWith('/db.json'));
      if (dbBlob?.url) {
        const res = await fetch(dbBlob.url);
        if (res.ok) {
          const data = await res.json();
          return Response.json(data);
        }
      }
    }

    // 2) 로컬 개발: src/data/db.json 폴백
    const localPath = path.join(process.cwd(), 'src', 'data', 'db.json');
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
      const data = JSON.parse(raw);
      return Response.json(data);
    }

    return new Response(
      JSON.stringify({ error: '데이터를 찾을 수 없습니다. Blob 업로드 또는 로컬 db.json을 확인하세요.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[api/data]', err);
    return new Response(
      JSON.stringify({ error: '데이터 로드 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
