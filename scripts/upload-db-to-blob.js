/**
 * db.json을 Vercel Blob에 한 번 업로드하는 스크립트.
 * 사용 전: npm run build 등으로 src/data/db.json 생성 후
 * BLOB_READ_WRITE_TOKEN 환경 변수 설정 (또는 .env.local) 후 실행.
 *
 * 실행: node scripts/upload-db-to-blob.js
 * 또는: npm run upload-db
 */
const path = require('path');
const fs = require('fs');
const { put } = require('@vercel/blob');

const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN 환경 변수를 설정하거나 .env.local에 넣어 주세요.');
    process.exit(1);
  }
  if (!fs.existsSync(dbPath)) {
    console.error('src/data/db.json 파일이 없습니다. 먼저 scripts/convert-excel.js로 생성하세요.');
    process.exit(1);
  }

  const content = fs.readFileSync(dbPath, 'utf-8');
  const blob = await put('db.json', content, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  console.log('업로드 완료:', blob.url);
  console.log('pathname:', blob.pathname);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
