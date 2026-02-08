"use client";
import { useState, useEffect, useRef } from 'react';
import symbolImg from './symbol.png';

const PAGE_SIZE = 100;

export default function ContainerFare() {
  const [dbData, setDbData] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [type, setType] = useState('왕복');
  const [selectedOrigins, setSelectedOrigins] = useState([]);
  const [searchRegion, setSearchRegion] = useState('');
  const [search, setSearch] = useState('');
  const [size, setSize] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef(null);

  const loadData = () => {
    let cancelled = false;
    setDataError(null);
    fetch('/api/data')
      .then((res) => {
        if (res.status === 403) {
          if (!cancelled) setPasswordRequired(true);
          throw new Error('비밀번호가 필요합니다.');
        }
        if (!res.ok) throw new Error(res.status === 401 ? '로그인이 필요합니다.' : '데이터를 불러올 수 없습니다.');
        return res.json();
      })
      .then((data) => { if (!cancelled) { setDbData(data); setPasswordRequired(false); } })
      .catch((err) => { if (!cancelled && err.message !== '비밀번호가 필요합니다.') setDataError(err.message); });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    const res = await fetch('/api/check-view-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setPasswordInput('');
      loadData();
    } else {
      setPasswordError(data.error || '비밀번호가 올바르지 않습니다.');
    }
  };

  const db = dbData || { '편도': {}, '왕복': {} };
  const originKeys = db[type] ? Object.keys(db[type]) : [];

  // 타입 변경 시 해당 타입의 출발지 중 유효한 것만 유지 (선택 없었으면 그대로 없음, 있으면 첫 출발지)
  useEffect(() => {
    if (originKeys.length > 0) {
      setSelectedOrigins((prev) => {
        const valid = prev.filter((s) => originKeys.includes(s));
        if (valid.length > 0) return valid;
        if (prev.length === 0) return []; // 아무것도 안 고른 상태였으면 그대로
        return [originKeys[0]];
      });
    } else {
      setSelectedOrigins([]);
    }
  }, [type]);

  const toggleOrigin = (sheet) => {
    setSelectedOrigins((prev) =>
      prev.includes(sheet) ? prev.filter((s) => s !== sheet) : [...prev, sheet]
    );
  };

  const selectAllOrigins = () => setSelectedOrigins([...originKeys]);
  const clearAllOrigins = () => setSelectedOrigins([]);

  // 선택한 출발지들 OR 합침 (아무것도 선택 안 하면 데이터 없음)
  const effectiveOrigins = selectedOrigins;
  const currentData = effectiveOrigins.flatMap((sheet) =>
    (db[type][sheet] || []).map((row) => ({ ...row, _origin: sheet }))
  );

  // 검색 필터링 (비어 있으면 해당 조건 무시 → 전체)
  const filteredData = currentData.filter((row) => {
    if (searchRegion) {
      const siDo = String(row['시·도'] ?? '');
      const gunGu = String(row['시·군·구'] ?? '');
      if (!siDo.includes(searchRegion) && !gunGu.includes(searchRegion)) return false;
    }
    if (search) {
      const dong = row['읍·면·동'] || row['읍면동'] || '';
      if (!String(dong).includes(search)) return false;
    }
    return true;
  });

  // 시·도 / 시·군·구 기준으로 묶여 나오도록 정렬
  const sortedData = [...filteredData].sort((a, b) => {
    const siDoA = String(a['시·도'] ?? '');
    const siDoB = String(b['시·도'] ?? '');
    if (siDoA !== siDoB) return siDoA.localeCompare(siDoB);
    const gunGuA = String(a['시·군·구'] ?? '');
    const gunGuB = String(b['시·군·구'] ?? '');
    if (gunGuA !== gunGuB) return gunGuA.localeCompare(gunGuB);
    const dongA = String(a['읍·면·동'] ?? a['읍면동'] ?? '');
    const dongB = String(b['읍·면·동'] ?? b['읍면동'] ?? '');
    return dongA.localeCompare(dongB);
  });

  // 필터/출발지 변경 시 보이는 개수 초기화
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [type, searchRegion, search, size, effectiveOrigins.join(',')]);

  // 스크롤 시 100개씩 더 보기 (IntersectionObserver)
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || sortedData.length <= PAGE_SIZE) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedData.length));
        }
      },
      { root: null, rootMargin: '100px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sortedData.length, visibleCount]);

  const visibleData = sortedData.slice(0, visibleCount);
  const hasMore = visibleCount < sortedData.length;

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">데이터 보기 비밀번호</h2>
            <p className="text-gray-600 text-sm">운임 데이터를 보기 위해 비밀번호를 입력하세요.</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900 flex items-center justify-center">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-xl max-w-md">
          <p className="font-bold">데이터를 불러올 수 없습니다</p>
          <p className="mt-2 text-sm">{dataError}</p>
        </div>
      </div>
    );
  }

  if (!dbData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-600">데이터 로딩 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <div className="max-w-[90%] mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        
        {/* 헤더 - PANTONE 285 C / #2780FF */}
        <div className="p-6 text-white" style={{ backgroundColor: '#2780FF' }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <img src={symbolImg.src} alt="" className="h-9 w-auto object-contain" />
            수출입 컨테이너 운임 조회
          </h1>
          <p className="text-blue-200 mt-2">안전운송운임 포함 (2026년 2월 기준)</p>
        </div>

        {/* 컨트롤 패널 - 1줄: 운행구분+규격 묶음 | 도착지 검색 */}
        <div className="p-6 bg-gray-100 border-b space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* 운행 구분 + 컨테이너 규격 한 공간 */}
            <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl border border-gray-300 p-3 shadow-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">운행 구분</label>
                <div className="flex bg-gray-100 rounded-lg p-1 border">
                  {['편도', '왕복'].map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        type === t ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200 shrink-0" aria-hidden />
              <div className="min-w-[180px]">
                <label className="block text-xs font-bold text-gray-500 mb-1">컨테이너 규격</label>
                <select
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  <option value="all">전체 보기 (20FT + 40FT)</option>
                  <option value="20">20FT 전용</option>
                  <option value="40">40FT 전용</option>
                </select>
              </div>
            </div>

            {/* 도착지 검색 - 시·도/시·군·구 + 읍·면·동 두 칸 */}
            <div className="flex-1 flex flex-wrap items-end gap-4 min-w-0">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-bold mb-2 text-gray-700">시·도 / 시·군·구 검색</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="비우면 전체 (예: 서울, 종로구)"
                  value={searchRegion}
                  onChange={(e) => setSearchRegion(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-bold mb-2 text-gray-700">읍·면·동 검색</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="비우면 전체 (예: 사직동)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 출발지 (기점) - 두 번째 줄 */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">출발지 (기점) </label>
            <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-[140px] overflow-y-auto">
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 pb-2 border-b border-gray-200">
                <button
                  type="button"
                  onClick={selectAllOrigins}
                  className="text-xs text-blue-600 hover:underline"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={clearAllOrigins}
                  className="text-xs text-gray-500 hover:underline"
                >
                  선택 해제
                </button>
                <span className="text-xs text-gray-500 ml-auto">
                  {effectiveOrigins.length}개 선택
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {originKeys.map((sheet) => (
                  <label key={sheet} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedOrigins.includes(sheet)}
                      onChange={() => toggleOrigin(sheet)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{sheet}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 결과 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-700 border-b-2 border-gray-200">
              <tr>
                <th className="p-3 border sticky left-0 bg-gray-100 z-10 w-[120px] min-w-[120px]">기점</th>
                <th className="p-3 border sticky left-[120px] bg-gray-100 z-10 w-[140px] min-w-[140px]">읍·면·동</th>
                <th className="p-3 border sticky left-[260px] bg-gray-100 z-10 w-[130px] min-w-[130px]">시·도 / 시·군·구</th>
                <th className="p-3 border font-bold text-gray-900">구간거리</th>
                
                {(size === 'all' || size === '40') && (
                  <>
                    <th className="p-3 border bg-teal-100 text-teal-900 border-l-4 border-l-white">40FT 안전위탁</th>
                    <th className="p-3 border bg-blue-100 text-blue-900">40FT 운수사간</th>
                    <th className="p-3 border bg-amber-100 text-amber-900 font-extrabold">40FT 안전운송</th>
                  </>
                )}
                
                {(size === 'all' || size === '20') && (
                  <>
                    <th className="p-3 border bg-teal-100 text-teal-900 border-l-4 border-l-white">20FT 안전위탁</th>
                    <th className="p-3 border bg-blue-100 text-blue-900">20FT 운수사간</th>
                    <th className="p-3 border bg-amber-100 text-amber-900 font-extrabold">20FT 안전운송</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                <>
                  {visibleData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 border-b">
                      <td className="p-3 text-left border sticky left-0 bg-white w-[120px] min-w-[120px]">
                        <span className="text-gray-700 text-sm">{row._origin}</span>
                      </td>
                      <td className="p-3 text-left border sticky left-[120px] bg-white w-[140px] min-w-[140px]">
                        <span className="font-bold text-gray-900">{row['읍·면·동'] || row['읍면동'] || '-'}</span>
                      </td>
                      <td className="p-3 text-left border sticky left-[260px] bg-white w-[130px] min-w-[130px]">
                        <span className="text-gray-600">{row['시·도']} {row['시·군·구']}</span>
                      </td>
                      
                      <td className="p-3 border font-mono text-gray-600">
                        {row['구간거리(km)'] ?? row['구간거리'] ?? row['__EMPTY'] ?? '-'}km
                      </td>
                      
                      {(size === 'all' || size === '40') && (
                        <>
                          <td className="p-3 border text-right bg-teal-50 text-teal-900">{Number(row['안전위탁운임(원)'] || 0).toLocaleString()}</td>
                          <td className="p-3 border text-right text-blue-900 bg-blue-50">{Number(row['운수사업자 간 운임(원)'] || 0).toLocaleString()}</td>
                          <td className="p-3 border text-right font-bold text-amber-900 bg-amber-50">{Number(row['안전운송운임(원)'] || 0).toLocaleString()}</td>
                        </>
                      )}
                      
                      {(size === 'all' || size === '20') && (
                        <>
                          <td className="p-3 border text-right bg-teal-50 text-teal-900">{Number(row['안전위탁운임(원)_1'] || 0).toLocaleString()}</td>
                          <td className="p-3 border text-right text-blue-900 bg-blue-50">{Number(row['운수사업자 간 운임(원)_1'] || 0).toLocaleString()}</td>
                          <td className="p-3 border text-right font-bold text-amber-900 bg-amber-50">{Number(row['안전운송운임(원)_1'] || 0).toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {hasMore && (
                    <tr ref={loadMoreRef}>
                      <td colSpan="11" className="p-4 text-center text-gray-500 bg-gray-50 text-sm">
                        스크롤하면 더 불러옵니다… ({visibleData.length} / {sortedData.length}건)
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan="11" className="p-12 text-center text-gray-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 text-center text-xs text-gray-500">
          * 부가세 별도 금액입니다.
        </div>
      </div>
    </div>
  );
}