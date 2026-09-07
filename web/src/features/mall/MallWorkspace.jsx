import { useEffect, useMemo, useRef, useState } from 'react';
import { searchMall } from '../../api/client';
import { formatAmount } from '../../lib/format';
import MallResultRow from './MallResultRow';
import { MALL_DESKTOP_GRID_COLS } from './mallGridTemplate';

const SORT_OPTIONS = [
  { value: 'priceAsc', label: '계약단가 낮은순' },
  { value: 'priceDesc', label: '계약단가 높은순' },
  { value: 'corpNm', label: '업체명순' },
  { value: 'endDate', label: '계약종료 빠른순' },
];

const PAGE_SIZE = 100;

export default function MallWorkspace() {
  const [searchType, setSearchType] = useState('name'); // MALL-001
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNo, setPageNo] = useState(1); // MALL-011
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('priceAsc');
  const [corpFilter, setCorpFilter] = useState(null);
  const [regionFilter, setRegionFilter] = useState(null);
  const [priceMinFilter, setPriceMinFilter] = useState(''); // MALL-008
  const [priceMaxFilter, setPriceMaxFilter] = useState('');

  // MALL-002: 자유 입력 중 실시간으로 등록 품명을 미리 보여주는 자동완성
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestBoxRef = useRef(null);

  useEffect(() => {
    if (searchType !== 'name' || keyword.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchMall({ searchType: 'name', keyword, numOfRows: 8 });
        const names = [...new Set(res.items.map((i) => i.prdctSpecNm))].slice(0, 8);
        setSuggestions(names);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, searchType]);

  useEffect(() => {
    function onOutsideClick(e) {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  async function runSearch(targetKeyword, targetPageNo) {
    const res = await searchMall({ searchType, keyword: targetKeyword, numOfRows: PAGE_SIZE, pageNo: targetPageNo });
    setTotalCount(res.totalCount);
    return res.items;
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCorpFilter(null);
    setRegionFilter(null);
    setShowSuggestions(false);
    setPageNo(1);
    try {
      const newItems = await runSearch(keyword, 1);
      setItems(newItems);
    } catch (e2) {
      setError(e2.message);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }

  // MALL-011: 더 보기 — numOfRows=100 단건 조회 한계를 페이지네이션으로 보완
  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const nextPage = pageNo + 1;
      const more = await runSearch(keyword, nextPage);
      setItems((prev) => [...(prev || []), ...more]);
      setPageNo(nextPage);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function selectSuggestion(name) {
    setKeyword(name);
    setShowSuggestions(false);
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
    if (priceMinFilter) list = list.filter((i) => (i.cntrctPrceAmt ?? 0) >= Number(priceMinFilter));
    if (priceMaxFilter) list = list.filter((i) => (i.cntrctPrceAmt ?? 0) <= Number(priceMaxFilter));
    const sorted = [...list];
    if (sort === 'priceAsc') sorted.sort((a, b) => (a.cntrctPrceAmt || 0) - (b.cntrctPrceAmt || 0));
    else if (sort === 'priceDesc') sorted.sort((a, b) => (b.cntrctPrceAmt || 0) - (a.cntrctPrceAmt || 0));
    else if (sort === 'corpNm') sorted.sort((a, b) => (a.cntrctCorpNm || '').localeCompare(b.cntrctCorpNm || ''));
    else if (sort === 'endDate') sorted.sort((a, b) => new Date(a.cntrctEndDate || 0) - new Date(b.cntrctEndDate || 0));
    return sorted;
  }, [items, sort, corpFilter, regionFilter, priceMinFilter, priceMaxFilter]);

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
          <div ref={suggestBoxRef} className="relative mb-3">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={searchType === 'name' ? '예: 노트북컴퓨터' : '물품식별번호'}
              className="w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-md border border-cream-400 bg-cream-50 shadow-lg">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectSuggestion(name)}
                    className="block w-full truncate px-2.5 py-1.5 text-left text-xs text-ink-600 hover:bg-cream-200"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            <div className="mb-3">
              <div className="mb-1 font-medium text-ink-600">계약단가 범위</div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={priceMinFilter}
                  onChange={(e) => setPriceMinFilter(e.target.value)}
                  placeholder="하한"
                  className="w-full rounded border border-cream-400 px-1.5 py-1 text-[12px]"
                />
                <span className="text-ink-300">~</span>
                <input
                  type="number"
                  value={priceMaxFilter}
                  onChange={(e) => setPriceMaxFilter(e.target.value)}
                  placeholder="상한"
                  className="w-full rounded border border-cream-400 px-1.5 py-1 text-[12px]"
                />
              </div>
            </div>
            <div className="mb-1 font-medium text-ink-600">업체</div>
            <div className="mb-3 max-h-32 space-y-0.5 overflow-y-auto lg:max-h-64">
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
              <div className="overflow-x-auto rounded-xl border border-cream-400 bg-cream-50">
                <div className={`hidden ${MALL_DESKTOP_GRID_COLS} gap-3 border-b border-cream-400 bg-cream-100 px-3.5 py-2 text-[12px] font-medium text-ink-400 lg:grid`}>
                  <div>품명·규격</div>
                  <div>제조사</div>
                  <div>원산지</div>
                  <div className="text-right">계약기간</div>
                  <div className="text-right">단가</div>
                </div>
                {filtered.map((item) => (
                  // 물품식별번호가 서로 다른 계약(업체)에 중복 재사용되는 실데이터 사례가 있어 업체명까지 합쳐 키를 만든다
                  <MallResultRow key={`${item.prdctIdntNo}-${item.cntrctCorpNm}-${item.cntrctBgnDate}`} item={item} />
                ))}
              </div>
            )}
            {/* MALL-011: numOfRows=100 단건 조회 한계를 페이지네이션으로 보완 */}
            {items.length < totalCount && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-cream-400 px-4 py-2 text-xs text-ink-600 disabled:opacity-60"
                >
                  {loadingMore ? '불러오는 중…' : `더 보기 (${(totalCount - items.length).toLocaleString()}건 남음)`}
                </button>
              </div>
            )}
          </>
        )}
        {!items && !error && <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">품명을 넣고 상품 조회를 누르세요.</div>}
      </div>
    </div>
  );
}
