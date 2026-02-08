const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. 경로 설정 (엑셀 파일 위치와 결과물 저장 위치)
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_PATH = path.join(__dirname, '../src/data/db.json');

// 결과 저장할 객체 초기화
const result = {
  '편도': {},
  '왕복': {}
};

// src/data 폴더가 없으면 에러가 나므로 미리 만들어주는 안전장치
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 2. data 폴더 내의 모든 엑셀 파일(.xlsx) 찾기
// (임시 파일 ~$... 은 제외)
const files = fs.readdirSync(DATA_DIR).filter(file => 
  file.endsWith('.xlsx') && !file.startsWith('~$')
);

console.log(`🚀 총 ${files.length}개의 엑셀 파일을 찾았습니다.`);

files.forEach(fileName => {
  let type = '';

  // 3. 파일명으로 타입 자동 구분 (파일명에 '편도'나 '왕복' 글자가 있어야 함)
  if (fileName.includes('편도')) {
    type = '편도';
  } else if (fileName.includes('왕복')) {
    type = '왕복';
  } else {
    console.warn(`⚠️ 스킵: "${fileName}" (파일명에 '편도' 또는 '왕복'이 없어 건너뜁니다.)`);
    return;
  }

  console.log(`📂 처리 중: [${type}] ${fileName}`);
  
  const filePath = path.join(DATA_DIR, fileName);
  const workbook = XLSX.readFile(filePath);

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    
    // 4. 데이터 변환 (중요: range: 1 옵션)
    // 엑셀의 맨 윗줄(40FT, 20FT 병합셀)은 무시하고, 두 번째 줄부터 헤더로 인식합니다.
    const sheetData = XLSX.utils.sheet_to_json(sheet, { range: 1 });

    if (sheetData.length > 0) {
        // D열(구간거리) 헤더가 비어 있으면 xlsx가 __EMPTY 로 넣음 → 구간거리(km) 로 통일
        result[type][sheetName] = sheetData.map((row) => {
          if (row.hasOwnProperty('__EMPTY') && row['구간거리(km)'] == null) {
            const r = { ...row };
            r['구간거리(km)'] = r['__EMPTY'];
            delete r['__EMPTY'];
            return r;
          }
          return row;
        });
    }
  });
  
  console.log(`   └─ ${workbook.SheetNames.length}개 시트 변환 완료`);
});

// 5. 최종 JSON 파일로 저장
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result)); 

console.log(`🎉 변환 성공! 데이터가 저장되었습니다: ${OUTPUT_PATH}`);