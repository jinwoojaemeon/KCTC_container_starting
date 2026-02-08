This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 환경 변수 (로컬 / Vercel)

- **Clerk** (로그인 필수): [Clerk 대시보드](https://dashboard.clerk.com)에서 앱 생성 후
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- **데이터 보기 비밀번호**: Clerk 로그인 후 추가로 입력해야 하는 비밀번호
  - `APP_VIEW_PASSWORD` (영어+숫자 조합, 예: `mUZCe0yV`)
  - `.env.local.example` 파일 참고
- **Vercel Blob** (배포 시 데이터): Vercel 프로젝트에 Blob 스토어 연결 후
  - `BLOB_READ_WRITE_TOKEN` (자동 주입됨)
  - 로컬에서 업로드: `BLOB_READ_WRITE_TOKEN`을 `.env.local`에 넣고 `npm run upload-db` 실행

`data/`, `src/data/db.json`은 .gitignore 되어 있으며, 배포 시에는 Blob에 업로드한 db.json을 API에서 불러옵니다. 로컬에서는 `src/data/db.json`이 있으면 API가 해당 파일을 사용합니다.

**보안 흐름**: Clerk 로그인 → 비밀번호 입력 (`APP_VIEW_PASSWORD`) → 데이터 표시

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
