import { formatDate } from '../../lib/format';
import { MALL_DESKTOP_GRID_COLS } from './mallGridTemplate';

export default function MallResultRow({ item }) {
  return (
    <>
      {/* 모바일 카드 */}
      <div className="border-b border-cream-400 p-3 text-xs last:border-b-0 lg:hidden">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[11px] font-medium text-sage-600">{item.entrprsDivNm}</span>
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
              <span key={c} className="rounded bg-cream-200 px-1.5 py-0.5 text-[11px] text-ink-400">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 데스크톱 표 행 */}
      <div className={`hidden ${MALL_DESKTOP_GRID_COLS} items-center gap-3 border-b border-cream-400 px-3.5 py-2.5 text-xs last:border-b-0 lg:grid`}>
        <div>
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[11px] font-medium text-sage-600">{item.entrprsDivNm}</span>
            <span className="text-ink-800">{item.prdctSpecNm}</span>
          </div>
          <div className="text-[12px] text-ink-400">물품식별번호 {item.prdctIdntNo}</div>
          {item.certList.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {item.certList.map((c) => (
                <span key={c} className="rounded bg-cream-200 px-1.5 py-0.5 text-[11px] text-ink-400">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-ink-600">{item.cntrctCorpNm}</div>
        <div className="text-ink-600">{item.prdctOrgplceNm}</div>
        <div className="text-right text-ink-400">
          {formatDate(item.cntrctBgnDate)} ~ {formatDate(item.cntrctEndDate)}
          <br />
          납품기한 {item.dlvrTmlmtDaynum}일
        </div>
        <div className="text-right tabular-nums font-medium text-ink-800">
          {item.cntrctPrceAmt?.toLocaleString()}원
          <br />
          <span className="text-[12px] font-normal text-ink-400">/ {item.prdctUnit}</span>
        </div>
      </div>
    </>
  );
}
