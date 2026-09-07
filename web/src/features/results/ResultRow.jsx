import { useState } from 'react';
import { formatAmount, formatRate, formatDateTime, deadlineBadge } from '../../lib/format';
import { DESKTOP_GRID_COLS } from './gridTemplate';
import { isItemSaved, toggleSavedItem } from '../../lib/savedItems';

function Badge({ tone, children }) {
  const toneClass = {
    success: 'bg-sage-100 text-sage-600',
    warning: 'bg-amber-100 text-amber-600',
    neutral: 'bg-ink-100 text-ink-400',
  }[tone];
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${toneClass} whitespace-nowrap`}>{children}</span>;
}

function barColor(item) {
  if (item.kind === 'award') return 'border-sage-600';
  const badge = deadlineBadge(item.bidDeadline);
  if (badge) return 'border-amber-600';
  return 'border-cream-400';
}

function kindBadge(item, badge) {
  if (item.kind === 'award') return <Badge tone="success">낙찰</Badge>;
  if (item.kind === 'bid') return badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : <Badge tone="neutral">공고</Badge>;
  return <Badge tone="neutral">사전규격</Badge>;
}

// SAV-001: 공고 저장/해제
function SaveIcon({ item, onToggleSave }) {
  const [saved, setSaved] = useState(() => isItemSaved(item.id));
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        const nowSaved = toggleSavedItem(item);
        setSaved(nowSaved);
        onToggleSave?.(item, nowSaved);
      }}
      className={saved ? 'text-clay-600' : 'text-ink-300 hover:text-clay-600'}
      title={saved ? '저장 해제' : '저장'}
    >
      {saved ? '★' : '☆'}
    </button>
  );
}

function CopyIcon({ bidNo, onCopyBidNo }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCopyBidNo(bidNo);
      }}
      className="text-ink-300 hover:text-clay-600"
      title="공고번호 복사"
    >
      ⧉
    </button>
  );
}

// 열2 "업체·기관"
function OrgCell({ item }) {
  if (item.kind === 'award') {
    return (
      <>
        <div className="truncate text-ink-800">{item.winner?.name || '-'}</div>
        <div className="truncate text-[12px] text-ink-400">{item.winner?.bizNo || '사업자번호 미제공'}</div>
      </>
    );
  }
  return (
    <>
      <div className="truncate text-ink-800">{item.orderOrg || '-'}</div>
      {item.demandOrg && item.demandOrg !== item.orderOrg && (
        <div className="truncate text-[12px] text-ink-400">{item.demandOrg}</div>
      )}
    </>
  );
}

// 열3 "금액·일정"
function AmountCell({ item }) {
  if (item.kind === 'award') {
    return (
      <>
        <div className="tabular-nums text-ink-800">{formatAmount(item.awardAmount)}</div>
        <div className="tabular-nums text-[12px] text-ink-400">
          {item.estimatedPrice != null ? `예산 ${formatAmount(item.estimatedPrice)}` : '예산 미제공'}
        </div>
      </>
    );
  }
  if (item.kind === 'bid') {
    return (
      <>
        <div className="tabular-nums text-ink-800">{formatAmount(item.estimatedPrice)}</div>
        <div className="text-[12px] text-ink-400">개찰 {formatDateTime(item.openingAt)}</div>
      </>
    );
  }
  return <div className="tabular-nums text-ink-800">{formatAmount(item.estimatedPrice)}</div>;
}

// 열4 "핵심지표"
function MetricCell({ item, badge }) {
  if (item.kind === 'award') return <span className="tabular-nums text-ink-800">낙찰률 {formatRate(item.awardRate)}</span>;
  if (badge) return <Badge tone={badge.tone}>{badge.label}</Badge>;
  return <span className="text-ink-300">-</span>;
}

export default function ResultRow({ item, dense, onOpenDetail, onCopyBidNo, onToggleSave }) {
  const badge = item.kind === 'bid' ? deadlineBadge(item.bidDeadline) : null;

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`cursor-pointer border-b border-cream-400 border-l-[3px] last:border-b-0 hover:bg-cream-100/60 ${barColor(item)}`}
    >
      {/* 모바일 카드 (7.4절: lg 미만은 1열 카드) */}
      <div className={`flex items-start gap-3 px-3.5 py-3 lg:hidden`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm text-ink-800">{item.title}</span>
            {kindBadge(item, badge)}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-400">
            <span>{item.bidNo}</span>
            <CopyIcon bidNo={item.bidNo} onCopyBidNo={onCopyBidNo} />
            <SaveIcon item={item} onToggleSave={onToggleSave} />
            {!dense && <span>· {formatDateTime(item.postedAt, { seconds: true })}</span>}
          </div>
          {!dense && (
            <div className="mt-0.5 truncate text-[12px] text-ink-400">
              {item.orderOrg}
              {item.demandOrg && item.demandOrg !== item.orderOrg ? ` / ${item.demandOrg}` : ''}
              {item.winner && ` · ${item.winner.name} (${item.winner.bizNo || '사업자번호 미제공'})`}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right text-sm">
          <AmountCell item={item} />
        </div>
      </div>

      {/* 데스크톱 4열 테이블 (7.4절: 공고·사업명 / 업체·기관 / 금액·일정 / 핵심지표) */}
      <div className={`hidden lg:grid ${DESKTOP_GRID_COLS} items-center gap-3 px-3.5 py-2.5 text-xs`}>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm text-ink-800">{item.title}</span>
            {kindBadge(item, badge)}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-400">
            <span>{item.bidNo}</span>
            <CopyIcon bidNo={item.bidNo} onCopyBidNo={onCopyBidNo} />
            <SaveIcon item={item} onToggleSave={onToggleSave} />
            {!dense && <span>· {formatDateTime(item.postedAt, { seconds: true })}</span>}
          </div>
        </div>
        <div className="min-w-0">
          <OrgCell item={item} />
        </div>
        <div className="min-w-0 text-right">
          <AmountCell item={item} />
        </div>
        <div className="flex justify-end">
          <MetricCell item={item} badge={badge} />
        </div>
      </div>
    </div>
  );
}
