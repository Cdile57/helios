// src/components/ControlPanel/ControlPanel.tsx
import React from 'react'
import type { Config, Side, LiveStats } from '../../App'

type Props = {
  cfg: Config
  setCfg: React.Dispatch<React.SetStateAction<Config>>
  doorLeft: number
  setDoorLeft: (v: number) => void
  stats: LiveStats
  totalSales: number
  elapsedSeconds: number
  effectiveAvgSpend: number

  // ?追加
  isRunning: boolean
  remainingSec: number // -1 = 無制限
  onToggleRun: () => void
  onResetTimer: () => void
}

type DraftNumberInputProps = {
  value: number
  onCommit: (n: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

const clampNumber = (n: number, min?: number, max?: number) => {
  let next = n
  if (min != null) next = Math.max(min, next)
  if (max != null) next = Math.min(max, next)
  return next
}

function DraftNumberInput({
  value,
  onCommit,
  min,
  max,
  step,
  className,
  disabled,
}: DraftNumberInputProps) {
  const [draft, setDraft] = React.useState(() => String(value))
  const isFocusedRef = React.useRef(false)

  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(String(value))
    }
  }, [value])

  const commitDraft = React.useCallback(() => {
    const raw = draft.trim()
    const parsed = raw === '' ? NaN : Number(raw)
    const next = Number.isFinite(parsed) ? clampNumber(parsed, min, max) : value
    onCommit(next)
    setDraft(String(next))
  }, [draft, min, max, onCommit, value])

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onFocus={() => {
        isFocusedRef.current = true
      }}
      onBlur={() => {
        isFocusedRef.current = false
        commitDraft()
      }}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commitDraft()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setDraft(String(value))
        }
      }}
      className={className}
      disabled={disabled}
    />
  )
}

const sideLabel: Record<Side, string> = {
  left: '左',
  right: '右',
  back: '奥',
  front: '手前',
}

type SectionKey =
  | 'timer'
  | 'layout'
  | 'seats'
  | 'pricing'
  | 'stay'
  | 'staff'
  | 'flow'
  | 'facility'
  | 'stats'

export default function ControlPanel({
  cfg,
  setCfg,
  doorLeft,
  setDoorLeft,
  stats,
  totalSales,
  effectiveAvgSpend,
  isRunning,
  remainingSec,
  onToggleRun,
  onResetTimer,
}: Props) {
  const set = (patch: Partial<Config>) =>
    setCfg(p => ({
      ...p,
      ...patch,
      avoidance: patch.avoidance
        ? {
            ...p.avoidance,
            ...patch.avoidance,
            radius: patch.avoidance.radius
              ? { ...p.avoidance.radius, ...patch.avoidance.radius }
              : p.avoidance.radius,
          }
        : p.avoidance,
      repulsion: patch.repulsion
        ? { ...p.repulsion, ...patch.repulsion }
        : p.repulsion,
    }))
  const setNum = (key: keyof Config, n: number) =>
    set({ [key]: n } as Partial<Config>)
  const setAvoidanceRadius = (key: keyof Config['avoidance']['radius'], v: any) =>
    setCfg(p => ({
      ...p,
      avoidance: {
        ...p.avoidance,
        radius: { ...p.avoidance.radius, [key]: Number(v) || 0 },
      },
    }))
  const commitAvoidanceRadius = (key: keyof Config['avoidance']['radius'], n: number) =>
    setCfg(p => ({
      ...p,
      avoidance: {
        ...p.avoidance,
        radius: { ...p.avoidance.radius, [key]: n },
      },
    }))
  const setRepulsion = (key: keyof Config['repulsion'], v: any) =>
    setCfg(p => ({
      ...p,
      repulsion: { ...p.repulsion, [key]: Number(v) || 0 },
    }))
  const commitRepulsion = (key: keyof Config['repulsion'], n: number) =>
    setCfg(p => ({
      ...p,
      repulsion: { ...p.repulsion, [key]: n },
    }))
  const setToiletProbPct = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct))
    set({ toiletProb: clamped / 100 })
  }

  const [open, setOpen] = React.useState<Record<SectionKey, boolean>>({
    timer: false,
    layout: false,
    seats: false,
    pricing: false,
    stay: false,
    staff: false,
    flow: false,
    facility: false,
    stats: true,
  })
  const toggle = (key: SectionKey) =>
    setOpen(s => ({ ...s, [key]: !s[key] }))

  // 回転率＝累計退店人数 ÷ 総席数
  const totalSeats = cfg.table4Count * 4 + cfg.table2Count * 2
  const rotation = totalSeats > 0 ? stats.departed / totalSeats : 0
  const revPashPerSec = stats.revPASHPerSec
  const staffUtil = Math.min(1, Math.max(0, stats.staffUtilization ?? 0))

  const remainLabel = remainingSec < 0 ? 'INF' : String(Math.ceil(remainingSec))
  const activeTables = stats.activeTables || 0
  const staffForLoad = Math.max(1, cfg.staffCount || 0)
  const threshold = cfg.thresholdTablesPerStaff || 0
  const load = activeTables / staffForLoad
  const LOAD_K = 0.25
  const coef = load <= threshold ? 1.0 : 1.0 + LOAD_K * (load - threshold)
  const loadState =
    load < threshold * 0.95 ? 'ok' : load <= threshold * 1.05 ? 'warn' : 'bad'
  const loadColor =
    loadState === 'ok' ? '#22c55e' : loadState === 'warn' ? '#f59e0b' : '#ef4444'
  const priceRatio =
    cfg.basePrice > 0 && cfg.currentPrice > 0
      ? cfg.currentPrice / cfg.basePrice
      : 1
  const effectiveIncoming =
    (cfg.incoming || 0) * Math.pow(priceRatio, cfg.priceElasticity || 0)
  const baseStaySec = Math.max(0, cfg.baseStaySec || 0)
  const stayRawSec = baseStaySec * coef
  const stayCapSec = Math.max(0, cfg.timeCapSec || 0)
  const staySec = cfg.timeLimitOn ? Math.min(stayRawSec, stayCapSec) : stayRawSec

  const summaryPricing = `${effectiveIncoming.toFixed(1)}人/単位 → ${Math.round(
    effectiveAvgSpend,
  ).toLocaleString()}円`
  const summaryStaff = `負荷 ${load.toFixed(2)} → 係数 ${coef.toFixed(2)}`
  const summaryLayout = `${cfg.width.toFixed(1)}×${cfg.depth.toFixed(1)}m`
  const summarySeats = `${cfg.table4Count * 4 + cfg.table2Count * 2}席`
  const summaryStay = `${staySec.toFixed(1)}s`
  const summaryFlow = `k ${cfg.repulsion.humanHuman.toFixed(2)} / R ${cfg.avoidance.radius.humanHuman.toFixed(2)}`
  const summaryFacility = `${sideLabel[cfg.kitchenSide]} / ${sideLabel[cfg.toiletSide]}`
  const summaryStats = `売上 ${Math.round(totalSales).toLocaleString()}円`

  return (
    <div className="cp-card">
      <style>{`
        .cp-card{
          width: 340px;
          background: linear-gradient(180deg, rgba(12,18,32,.94), rgba(7,12,20,.92));
          border: 1px solid rgba(147,197,253,.2);
          box-shadow: 0 12px 35px rgba(0,0,0,.4), inset 0 0 40px rgba(56,189,248,.10);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          color: #e5e7eb;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          font-size: 13px;
          user-select: none;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }
        .cp-card::before{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at 20% 10%, rgba(56,189,248,.10), transparent 55%),
            radial-gradient(circle at 80% 0%, rgba(14,165,233,.10), transparent 60%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0, rgba(255,255,255,.025) 1px, transparent 1px, transparent 3px);
          opacity:.4;
          pointer-events:none;
        }
        .cp-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:12px 14px 8px 14px;
          position: sticky;
          top: 0;
          z-index: 5;
          background: linear-gradient(180deg, rgba(10,16,28,.9), rgba(10,16,28,.6));
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(56,189,248,.12);
        }
        .cp-title{
          display:flex;
          align-items:center;
          gap:10px;
          font-size:14px;
          font-weight:800;
          letter-spacing:.06em;
        }
        .glow-dot{
          width:9px;height:9px;border-radius:999px;background:#60a5fa;
          box-shadow:0 0 12px #60a5fa,0 0 30px rgba(96,165,250,.6);
        }
        .status-badge{
          padding:4px 10px;border-radius:999px;font-weight:800;font-size:11px;
          border:1px solid rgba(255,255,255,.12);
          letter-spacing:.08em;
        }
        .status-run{
          color:#86efac;background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.35);
          box-shadow:0 0 12px rgba(34,197,94,.25) inset;
        }
        .status-stop{
          color:#fecaca;background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);
          box-shadow:0 0 12px rgba(239,68,68,.2) inset;
        }
        .cp-body{ overflow:auto; max-height: calc(100vh - 120px); padding: 10px 10px 14px 10px; position:relative; }
        .cp-body{ scrollbar-width:none; }
        .cp-body::-webkit-scrollbar{ display:none; }

        .section{
          margin-top:10px;
          padding:10px;
          border:1px solid rgba(56,189,248,.16);
          border-radius:14px;
          background:rgba(2,10,22,.35);
          box-shadow: inset 0 0 18px rgba(56,189,248,.08);
        }
        .section-title{
          font-size:12px;
          font-weight:900;
          letter-spacing:.12em;
          color:#93c5fd;
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:10px;
          text-transform:uppercase;
        }
        .section-title::after{
          content:"";
          display:block;
          height:1px;
          flex:1;
          margin-left:10px;
          background:linear-gradient(90deg, rgba(34,211,238,.6), rgba(34,211,238,0));
        }

        .acc{
          margin-top:10px;
          border:1px solid rgba(56,189,248,.18);
          border-radius:14px;
          overflow:hidden;
          background:rgba(6,12,24,.5);
        }
        .acc-head{
          width:100%;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding:10px 12px;
          font-weight:800;
          letter-spacing:.06em;
          background:linear-gradient(90deg, rgba(14,165,233,.10), rgba(2,132,199,.08));
          border:0;
          color:#e5e7eb;
          cursor:pointer;
          text-align:left;
        }
        .acc-head .acc-label{
          display:flex;align-items:center;gap:10px;
        }
        .acc-head .acc-label::before{
          content:"";
          width:16px;height:2px;border-radius:999px;
          background:linear-gradient(90deg, rgba(34,211,238,.85), rgba(34,211,238,.2));
          box-shadow:0 0 8px rgba(34,211,238,.45);
        }
        .acc-summary{
          font-weight:700;
          font-size:11px;
          opacity:.85;
          white-space:nowrap;
        }
        .acc-body{
          padding:10px 12px 12px 12px;
          border-top:1px solid rgba(255,255,255,.08);
        }

        .row2{ display:grid; grid-template-columns:1fr 1fr; column-gap:10px; row-gap:10px; }
        .field{ display:flex; flex-direction:column; row-gap:6px; min-width:0; }
        .label{ opacity:.9; }
        .input{
          width:100%; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12);
          background:rgba(31,41,55,.90); color:#e5e7eb; outline:none; box-sizing:border-box;
        }
        .btn{
          width:100%; padding:10px 12px; border-radius:12px;
          border:1px solid rgba(147,197,253,.22); font-weight:900; cursor:pointer;
          background:rgba(34,211,238,.12); color:#e5e7eb; box-shadow:0 0 18px rgba(59,130,246,.10) inset;
        }
        .btn.stop{ background:rgba(239,68,68,.14); }
        .btn.secondary{
          background:rgba(31,41,55,.75); border:1px solid rgba(255,255,255,.12); font-weight:800;
        }
        .pill{
          margin-top:12px; padding:10px 12px; text-align:center; font-weight:800;
          background: linear-gradient(90deg, rgba(59,130,246,.12), rgba(2,132,199,.12));
          border:1px solid rgba(147,197,253,.28); color:#93c5fd; border-radius:12px;
          box-shadow: 0 0 18px rgba(59,130,246,.18) inset;
        }
        .sub{ font-size:11px; opacity:.8; }
        .mono{ font-variant-numeric: tabular-nums; }

        .toggle{
          display:flex; align-items:center; gap:10px;
        }
        .toggle input{ display:none; }
        .toggle .switch{
          width:38px; height:20px; border-radius:999px;
          background:rgba(148,163,184,.25); border:1px solid rgba(148,163,184,.4);
          position:relative; transition:all .2s ease;
          box-shadow: inset 0 0 10px rgba(2,132,199,.15);
        }
        .toggle .switch::after{
          content:""; width:16px; height:16px; border-radius:999px;
          background:#e2e8f0; position:absolute; top:1px; left:2px;
          transition:transform .2s ease, background .2s ease;
          box-shadow:0 2px 6px rgba(0,0,0,.35);
        }
        .toggle input:checked + .switch{
          background:rgba(34,211,238,.25); border-color:rgba(34,211,238,.55);
        }
        .toggle input:checked + .switch::after{
          transform:translateX(16px);
          background:#67e8f9;
        }
      `}</style>

      <div className="cp-header">
        <div className="cp-title">
          <span className="glow-dot" />
          コントロールパネル
        </div>
        <div className={`status-badge ${isRunning ? 'status-run' : 'status-stop'}`}>
          {isRunning ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="cp-body">
        <div className="section">
          <div className="section-title">
            <span>固定項目</span>
          </div>
          <div className="row2">
            <label className="field">
              <div className="label">制限時間（秒）</div>
              <DraftNumberInput
                min={0}
                step={1}
                value={cfg.timeLimitSec}
                onCommit={n => setNum('timeLimitSec', n)}
                className="input"
              />
              <div className="sub">0 = 無制限（設定変更で今からカウント）</div>
            </label>
            <div className="field">
              <div className="label">残り時間</div>
              <div className="input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 900 }}>
                <span className="mono">{remainLabel}</span>
                <span className="sub">sec</span>
              </div>
              <div className="sub">状態: <b>{isRunning ? 'RUNNING' : 'STOPPED'}</b></div>
            </div>
          </div>
          <div className="row2" style={{ marginTop: 10 }}>
            <button className={`btn ${isRunning ? 'stop' : ''}`} onClick={onToggleRun}>
              {isRunning ? '停止' : '再開'}
            </button>
            <button className="btn secondary" onClick={onResetTimer}>
              タイマーリセット
            </button>
          </div>
          <div className="row2" style={{ marginTop: 10 }}>
            <label className="field">
              <div className="label">基準来客数（人数・追加分）</div>
              <DraftNumberInput
                min={0}
                step={1}
                value={cfg.incoming}
                onCommit={n => setNum('incoming', n)}
                className="input"
              />
            </label>
            <label className="field">
              <div className="label">店員の数</div>
              <DraftNumberInput
                min={0}
                step={1}
                value={cfg.staffCount ?? 0}
                onCommit={n => setNum('staffCount', n)}
                className="input"
              />
            </label>
          </div>
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('layout')} aria-expanded={open.layout}>
            <span className="acc-label">店舗の大きさ</span>
            <span className="acc-summary">{summaryLayout}</span>
          </button>
          {open.layout && (
            <div className="acc-body">
              <div className="row2">
                <label className="field">
                  <div className="label">店の横幅 (m)</div>
                  <DraftNumberInput
                    min={1}
                    step={0.1}
                    value={cfg.width}
                    onCommit={n => setNum('width', n)}
                    className="input"
                  />
                </label>
                <label className="field">
                  <div className="label">店の縦幅 (m)</div>
                  <DraftNumberInput
                    min={1}
                    step={0.1}
                    value={cfg.depth}
                    onCommit={n => setNum('depth', n)}
                    className="input"
                  />
                </label>
              </div>
              <div className="row2" style={{ marginTop: 10 }}>
                <label className="field">
                  <div className="label">ドア幅 (m)</div>
                  <DraftNumberInput
                    min={0.6}
                    step={0.1}
                    value={cfg.doorWidth}
                    onCommit={n => setNum('doorWidth', n)}
                    className="input"
                  />
                </label>
                <label className="field">
                  <div className="label">ドア高 (m)</div>
                  <DraftNumberInput
                    min={1.6}
                    step={0.1}
                    value={cfg.doorHeight}
                    onCommit={n => setNum('doorHeight', n)}
                    className="input"
                  />
                </label>
              </div>
              <label className="field" style={{ marginTop: 10 }}>
                <div className="label">ドアの位置（左端から m）</div>
                <DraftNumberInput
                  step={0.1}
                  min={0}
                  value={Number.isFinite(doorLeft) ? Number(doorLeft.toFixed(2)) : 0}
                  onCommit={n => setDoorLeft(n)}
                  className="input"
                />
                <div className="sub">3D画面の青いドアをドラッグでも移動可能</div>
              </label>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('seats')} aria-expanded={open.seats}>
            <span className="acc-label">座席設定</span>
            <span className="acc-summary">{summarySeats}</span>
          </button>
          {open.seats && (
            <div className="acc-body">
              <div className="row2">
                <label className="field">
                  <div className="label">4人席の数</div>
                  <DraftNumberInput
                    min={0}
                    step={1}
                    value={cfg.table4Count}
                    onCommit={n => setNum('table4Count', n)}
                    className="input"
                  />
                </label>
                <label className="field">
                  <div className="label">2人席の数</div>
                  <DraftNumberInput
                    min={0}
                    step={1}
                    value={cfg.table2Count}
                    onCommit={n => setNum('table2Count', n)}
                    className="input"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('pricing')} aria-expanded={open.pricing}>
            <span className="acc-label">値段設定</span>
            <span className="acc-summary">{summaryPricing}</span>
          </button>
          {open.pricing && (
            <div className="acc-body">
              <div className="row2">
                <label className="field">
                  <div className="label">トイレ確率(%)</div>
                  <DraftNumberInput
                    min={0}
                    max={100}
                    step={0.1}
                    value={Number(((cfg.toiletProb ?? 0.51) * 100).toFixed(1))}
                    onCommit={n => setToiletProbPct(n)}
                    className="input"
                  />
                </label>
              </div>
              <div className="row2" style={{ marginTop: 10 }}>
                <label className="field">
                  <div className="label">基準価格 P0</div>
                  <DraftNumberInput
                    min={0}
                    step={1}
                    value={cfg.basePrice ?? 0}
                    onCommit={n => setNum('basePrice', n)}
                    className="input"
                  />
                </label>
                <label className="field">
                  <div className="label">現在価格 P</div>
                  <DraftNumberInput
                    min={0}
                    step={1}
                    value={cfg.currentPrice ?? 0}
                    onCommit={n => setNum('currentPrice', n)}
                    className="input"
                  />
                </label>
              </div>
              <label className="field" style={{ marginTop: 10 }}>
                <div className="label">価格補正 ε（価格弾力性）</div>
                <DraftNumberInput
                  min={-3.0}
                  max={-0.2}
                  step={0.1}
                  value={cfg.priceElasticity ?? -1.0}
                  onCommit={n => setNum('priceElasticity', n)}
                  className="input"
                />
                <div className="sub">負の値を想定</div>
              </label>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('stay')} aria-expanded={open.stay}>
            <span className="acc-label">時間設定</span>
            <span className="acc-summary">{summaryStay}</span>
          </button>
          {open.stay && (
            <div className="acc-body">
              <div className="row2">
                <label className="field">
                  <div className="label">基準滞在時間 T0 (sec)</div>
                  <DraftNumberInput
                    min={0}
                    step={1}
                    value={cfg.baseStaySec ?? 0}
                    onCommit={n => setNum('baseStaySec', n)}
                    className="input"
                  />
                </label>
                <label className="field">
                  <div className="label">時間制上限 T_cap (sec)</div>
                  <DraftNumberInput
                    min={0}
                    step={1}
                    value={cfg.timeCapSec ?? 0}
                    onCommit={n => setNum('timeCapSec', n)}
                    className="input"
                    disabled={!cfg.timeLimitOn}
                  />
                </label>
              </div>
              <div className="row2" style={{ marginTop: 10 }}>
                <label className="field">
                  <div className="label">時間制 ON/OFF</div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!cfg.timeLimitOn}
                      onChange={e => set({ timeLimitOn: e.target.checked })}
                    />
                    <span className="switch" />
                    <span className="sub">{cfg.timeLimitOn ? 'ON' : 'OFF'}</span>
                  </label>
                </label>
                <label className="field">
                  <div className="label">客単価割引率 (%)</div>
                  <DraftNumberInput
                    min={0}
                    max={30}
                    step={1}
                    value={cfg.timeDiscountPct ?? 0}
                    onCommit={n => setNum('timeDiscountPct', n)}
                    className="input"
                    disabled={!cfg.timeLimitOn}
                  />
                  <div className="sub">時間制ONのときのみ適用</div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('staff')} aria-expanded={open.staff}>
            <span className="acc-label">従業員設定</span>
            <span className="acc-summary">{summaryStaff}</span>
          </button>
          {open.staff && (
            <div className="acc-body">
              <div className="row2">
                <label className="field">
                  <div className="label">店員サービス余白 (m)</div>
                  <DraftNumberInput
                    min={0}
                    step={0.1}
                    value={cfg.staffServiceMargin ?? 0}
                    onCommit={n => setNum('staffServiceMargin', n)}
                    className="input"
                  />
                </label>
                <label className="field">
                  <div className="label">閾値（負荷の閾値）</div>
                  <DraftNumberInput
                    min={0}
                    step={0.1}
                    value={cfg.thresholdTablesPerStaff ?? 0}
                    onCommit={n => setNum('thresholdTablesPerStaff', n)}
                    className="input"
                  />
                  <div className="sub">1人の店員が同時に対応できる卓数上限</div>
                </label>
              </div>
              <div className="row2" style={{ marginTop: 10 }}>
                <div className="field">
                  <div className="label">負荷 (卓/人)</div>
                  <div className="input" style={{ fontWeight: 800 }}>
                    <b style={{ color: loadColor }}>{load.toFixed(2)}</b>
                  </div>
                </div>
                <div className="field">
                  <div className="label">提供時間係数</div>
                  <div className="input" style={{ fontWeight: 800 }}>
                    <b style={{ color: loadColor }}>{coef.toFixed(2)}</b>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('flow')} aria-expanded={open.flow}>
            <span className="acc-label">パラメーター設定</span>
            <span className="acc-summary">{summaryFlow}</span>
          </button>
          {open.flow && (
            <div className="acc-body">
              <div className="sub" style={{ marginBottom: 6 }}>反発係数 k</div>
              <div className="row2">
                {([
                  ['humanHuman', '客→客'],
                  ['humanStaff', '客→店員'],
                  ['humanObstacle', '客→障害物'],
                  ['staffHuman', '店員→客'],
                  ['staffObstacle', '店員→障害物'],
                ] as const).map(([key, label]) => (
                  <label key={`rep-${key}`} className="field">
                    <div className="label">{label}</div>
                    <DraftNumberInput
                      min={0}
                      max={4}
                      step={0.05}
                      value={cfg.repulsion[key]}
                      onCommit={n => commitRepulsion(key, n)}
                      className="input"
                    />
                    <input
                      type="range"
                      min={0}
                      max={4}
                      step={0.05}
                      value={cfg.repulsion[key]}
                      onChange={e => setRepulsion(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="sub" style={{ marginTop: 10, marginBottom: 6 }}>
                影響半径 R
              </div>
              <div className="row2">
                {([
                  ['humanHuman', '客→客'],
                  ['humanStaff', '客→店員'],
                  ['humanObstacle', '客→障害物'],
                  ['staffHuman', '店員→客'],
                  ['staffObstacle', '店員→障害物'],
                ] as const).map(([key, label]) => (
                  <label key={`rad-${key}`} className="field">
                    <div className="label">{label}</div>
                    <DraftNumberInput
                      min={0.2}
                      max={3}
                      step={0.05}
                      value={cfg.avoidance.radius[key]}
                      onCommit={n => commitAvoidanceRadius(key, n)}
                      className="input"
                    />
                    <input
                      type="range"
                      min={0.2}
                      max={3}
                      step={0.05}
                      value={cfg.avoidance.radius[key]}
                      onChange={e => setAvoidanceRadius(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('facility')} aria-expanded={open.facility}>
            <span className="acc-label">店内配置設定</span>
            <span className="acc-summary">{summaryFacility}</span>
          </button>
          {open.facility && (
            <div className="acc-body">
              <div className="row2">
                <label className="field">
                  <div className="label">厨房の位置</div>
                  <select
                    value={cfg.kitchenSide}
                    onChange={e => set({ kitchenSide: e.target.value as Side })}
                    className="input"
                  >
                    {Object.entries(sideLabel).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <div className="label">トイレの位置</div>
                  <select
                    value={cfg.toiletSide}
                    onChange={e => set({ toiletSide: e.target.value as Side })}
                    className="input"
                  >
                    {Object.entries(sideLabel).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="acc">
          <button className="acc-head" onClick={() => toggle('stats')} aria-expanded={open.stats}>
            <span className="acc-label">モニタリング</span>
            <span className="acc-summary">{summaryStats}</span>
          </button>
          {open.stats && (
            <div className="acc-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  fontSize: 12,
                  lineHeight: 1.3,
                }}
              >
                <div>待機中: <b>{stats.pending}</b></div>
                <div>店内: <b>{stats.inside}</b></div>
                <div>着席中: <b>{stats.seated}</b></div>
                <div>退店中: <b>{stats.exiting}</b></div>
                <div>退店済: <b>{stats.departed}</b></div>
                <div>回転率: <b>{rotation.toFixed(2)}</b></div>
                <div>基準来客数: <b>{Math.floor(cfg.incoming || 0)}</b></div>
                <div>実効来客数: <b>{effectiveIncoming.toFixed(2)}</b></div>
                <div>稼働卓数: <b>{activeTables}</b></div>
                <div>店員数: <b>{stats.staffCount}</b></div>
                <div>負荷(卓/人): <b style={{ color: loadColor }}>{load.toFixed(2)}</b></div>
                <div>閾値: <b>{threshold.toFixed(2)}</b></div>
                <div>提供時間係数: <b style={{ color: loadColor }}>{coef.toFixed(2)}</b></div>
                <div>平均滞在時間: <b>{staySec.toFixed(1)}秒</b></div>
                <div>時間制: <b>{cfg.timeLimitOn ? 'ON' : 'OFF'}</b></div>
                <div>時間制上限: <b>{cfg.timeLimitOn ? `${stayCapSec.toFixed(1)}秒` : '-'}</b></div>
                <div>実効客単価: <b>{Math.round(effectiveAvgSpend).toLocaleString()}円</b></div>
                <div>RevPASH: <b>{revPashPerSec == null ? '-' : `${revPashPerSec.toFixed(3)} 円/席/秒`}</b></div>
                <div>従業員稼働率: <b>{Math.round(staffUtil * 100)}%</b></div>
              </div>
              <div className="pill">
                総売上
                <span style={{ color: '#60a5fa', fontWeight: 800, marginLeft: 8 }}>
                  {Math.round(totalSales).toLocaleString()} 円
                </span>
                <div className="sub">売上 = 実効客単価 × 累積着席人数</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
