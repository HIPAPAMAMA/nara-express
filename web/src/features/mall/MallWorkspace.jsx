import { useMemo, useState } from 'react';
import { searchMall } from '../../api/client';
import { formatAmount, formatDate } from '../../lib/format';

const SORT_OPTIONS = [
  { value: 'priceAsc', label: '계약단가 낮은순' },
  { value: 'priceDesc', label: '계약단가 높은순' },
  { value: 'corpNm', label: '업체명순' },
  { value: 'endDate', label: '계약종료 빠른순' },
];

export default function MallWorkspace() {
  const [searchType, setSearchType] = useState('name'); // MALL-001
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('priceAsc');
  const [corpFilter, setCorpFilter] = useState(null);
  const [regionFilter, setRegionFilter] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCorpFilter(null);
    setRegionFilter(null);
    try {
      const res = await searchMall({ searchType, keyword, numOfRows: 100 });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch (e2) {
      setError(e2.message);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }

  const corpCounts = useMemo(() => {
    if (!items) return [];
    const map = new Map();
    for (const it of items) map.set(it.cntrctCorpNm, (map.get(it.cntrctCorpNm) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const regionCounts = useMemo(() => {
    if (!items) return [];
    const map = new Map();
    for (const it of items) {
      const region = (it.prdctOrgplceNm || '기타').replace(/\[.*\]/, '');
      map.set(region, (map.get(region) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    let list = items || [];
    if (corpFilter) list = list.filter((i) => i.cntrctCorpNm === corpFilter);
    if (regionFilter) list = list.filter((i) => (i.prdctOrgplceNm || '').startsWith(regionFilter));
    const sorted = [...list];
    if (sort === 'priceAsc') sorted.sort((a, b) => (a.cntrctPrceAmt || 0) - (b.cntrctPrceAmt || 0));
    else if (sort === 'priceDesc') sorted.sort((a, b) => (b.cntrctPrceAmt || 0) - (a.cntrctPrceAmt || 0));
    else if (sort === 'corpNm') sorted.sort((a, b) => (a.cntrctCorpNm || '').localeCompare(b.cntrctCorpNm || ''));
    else if (sort === 'endDate') sorted.sort((a, b) => new Date(a.cntrctEndDate || 0) - new Date(b.cntrctEndDate || 0));
    return sorted;
  }, [items, sort, corpFilter, regionFilter]);

  const prices = filtered.map((i) => i.cntrctPrceAmt).filter((n) => n != null);
  const priceMin = prices.length ? Math.min(...prices) : null;
  const priceMax = prices.length ? Math.max(...prices) : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="rounded-xl border border-cream-400 bg-cream-100 p-4">
          <h2 className="mb-1 text-sm font-medium text-ink-800">쇼핑몰 상품검색</h2>
          <p className="mb-3 text-xs text-ink-400">품명이나 물품식별번호로 등록 상품을 찾습니다.</p>
          <div className="mb-2 flex rounded-lg border border-cream-400 text-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setSearchType('name')}
              className={`flex-1 py-1.5 ${searchType === 'name' ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-400'}`}
            >
              품명
            </button>
            <button
              type="button"
              onClick={() => setSearchType('ident')}
              className={`flex-1 border-l border-cream-400 py-1.5 ${searchType === 'ident' ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-400'}`}
            >
              물품식별번호
            </button>
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={searchType === 'name' ? '예: 노트북컴퓨터' : '물품식별번호'}
            className="mb-3 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
          />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-clay-400 py-2 text-sm font-medium text-white disabled:opacity-60">
            {loading ? '조회 중…' : '상품 조회'}
          </button>
        </form>

        {items && (
          <div className="rounded-xl border border-cream-400 bg-cream-100 p-4 text-xs">
            <div className="mb-2 font-medium text-ink-600">
              등록 상품 <span className="tabular-nums">{totalCount}</span>건
            </div>
            <div className="mb-3 grid grid-cols-2 gap-1 text-ink-400">
              <div>판매 업체</div>
              <div className="text-right tabular-nums">{corpCounts.length}곳</div>
              <div>가격대</div>
              <div className="text-right tabular-nums">{priceMin != null ? `${formatAmount(priceMin)} ~ ${formatAmount(priceMax)}` : '-'}</div>
            </div>
            <div className="mb-1 font-medium text-ink-600">업체</div>
            <div className="mb-3 max-h-32 space-y-0.5 overflow-y-auto">
              <button onClick={() => setCorpFilter(null)} className={`block w-full text-left ${!corpFilter ? 'text-clay-600 font-medium' : 'text-ink-400'}`}>
                전체 {corpCounts.length}곳
              </button>
              {corpCounts.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setCorpFilter(name)}
                  className={`block w-full truncate text-left ${corpFilter === name ? 'text-clay-600 font-medium' : 'text-ink-400'}`}
                >
                  {name} {count}건
                </button>
              ))}
            </div>
            <div className="mb-1 font-medium text-ink-600">원산지</div>
            <div className="space-y-0.5">
              <button onClick={() => setRegionFilter(null)} className={`block w-full text-left ${!regionFilter ? 'text-clay-600 font-medium' : 'text-ink-400'}`}>
                전체
              </button>
              {regionCounts.map(([region, count]) => (
                <button
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  className={`block w-full truncate text-left ${regionFilter === region ? 'text-clay-600 font-medium' : 'text-ink-400'}`}
                >
                  {region} {count}건
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {error && <div className="rounded-xl border border-amber-400 bg-amber-100 p-4 text-sm text-amber-800">{error}</div>}
        {items && (
          <>
            <div className="mb-3 flex justify-end">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-cream-400 px-2 py-1 text-xs">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">조건에 맞는 상품이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((item) => (
                  <div key={item.prdctIdntNo} className="rounded-lg border border-cream-400 bg-cream-50 p-3 text-xs">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[10px] font-medium text-sage-600">{item.entrprsDivNm}</span>
                      <span className="text-ink-800">{item.prdctSpecNm}</span>
                    </div>
                    <div className="mb-1 flex flex-wrap gap-x-3 text-ink-400">
                      <span>물품식별번호 {item.prdctIdntNo}</span>
                      <span>제조사 {item.cntrctCorpNm}</span>
                      <span>원산지 {item.prdctOrgplceNm}</span>
                      <span>공급지역 {item.splyJrsdctRgnNm}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-ink-400">
                        계약 {formatDate(item.cntrctBgnDate)} ~ {formatDate(item.cntrctEndDate)} · 납품기한 {item.dlvrTmlmtDaynum}일
                      </div>
                      <div className="tabular-nums font-medium text-ink-800">
                        {item.cntrctPrceAmt?.toLocaleString()}원 / {item.prdctUnit}
                      </div>
                    </div>
                    {item.certList.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.certList.map((c) => (
                          <span key={c} className="rounded bg-cream-200 px-1.5 py-0.5 text-[10px] text-ink-400">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {!items && !error && <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">품명을 넣고 상품 조회를 누르세요.</div>}
      </div>
    </div>
  );
}
