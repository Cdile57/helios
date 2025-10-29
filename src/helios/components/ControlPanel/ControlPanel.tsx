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
}

const sideLabel: Record<Side, string> = { left: '左', right: '右', back: '奥', front: '手前' }

export default function ControlPanel({
  cfg, setCfg, doorLeft, setDoorLeft, stats, totalSales,
}: Props) {
  const set = (patch: Partial<Config>) => setCfg(p => ({ ...p, ...patch } as Config))
  const onNum = (key: keyof Config, v: any) =>
    set({ [key]: Number(v) || 0 } as Partial<Config>)

  // ===== Styles =====
  const Card: React.CSSProperties = {
    width: 320,
    background: 'linear-gradient(180deg, rgba(17,24,39,.92), rgba(8,12,20,.90))',
    border: '1px solid rgba(147,197,253,.18)',
    boxShadow: '0 10px 30px rgba(0,0,0,.35), inset 0 0 40px rgba(96,165,250,.08)',
    backdropFilter: 'blur(8px)',
    padding: 12,
    borderRadius: 16,
    color: '#e5e7eb',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontSize: 13,
    userSelect: 'none',
    boxSizing: 'border-box',
  }
  const Header: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
  }

  // 各フォーム行（2列グリッド）。縦にも余白を入れて“かぶり”防止
  const Row2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: 10,
    rowGap: 10,                 // ← これで上下の丸角が重ならない
    marginTop: 8,
  }

  const Section: React.CSSProperties = {
    marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.10)',
  }

  // ラベル&入力を縦に並べる部品。上下6pxの内側余白で視覚的な間隔も確保
  const Field: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', rowGap: 6, minWidth: 0,
  }
  const Label: React.CSSProperties = { opacity: 0.9 }
  const In: React.CSSProperties = {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,.12)',
    background: 'rgba(31,41,55,.90)',
    color: '#e5e7eb',
    outline: 'none',
    boxSizing: 'border-box',    // ← 角のはみ出し防止
  }

  return (
    <div style={Card}>
      {/* スクロールは可、バーは非表示 */}
      <style>{`
        .cp-body { overflow:auto; max-height: calc(100vh - 120px); padding: 6px 4px 6px 2px; }
        .cp-body{ scrollbar-width: none; }
        .cp-body::-webkit-scrollbar{ display: none; }
        .pill{
          margin-top:12px; padding:10px 12px; text-align:center; font-weight:800;
          background: linear-gradient(90deg, rgba(59,130,246,.12), rgba(2,132,199,.12));
          border:1px solid rgba(147,197,253,.28); color:#93c5fd; border-radius:12px;
          box-shadow: 0 0 18px rgba(59,130,246,.18) inset;
        }
        .sub{ font-size:11px; opacity:.8; }
      `}</style>

      <div style={Header}>
        <div style={{
          width: 9, height: 9, borderRadius: 9999, background: '#60a5fa',
          boxShadow: '0 0 12px #60a5fa, 0 0 30px rgba(96,165,250,.6)',
        }}/>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>コントロールパネル</h3>
      </div>

      <div className="cp-body">
        {/* レイアウト */}
        <div style={Row2}>
          <label style={Field}>
            <div style={Label}>店舗の横幅 (m)</div>
            <input type="number" min={1} step={0.1}
              value={cfg.width} onChange={e => onNum('width', e.target.value)} style={In}/>
          </label>
          <label style={Field}>
            <div style={Label}>店舗の縦幅 (m)</div>
            <input type="number" min={1} step={0.1}
              value={cfg.depth} onChange={e => onNum('depth', e.target.value)} style={In}/>
          </label>
        </div>

        {/* ドア */}
        <div style={Row2}>
          <label style={Field}>
            <div style={Label}>ドア幅 (m)</div>
            <input type="number" min={0.6} step={0.1}
              value={cfg.doorWidth} onChange={e => onNum('doorWidth', e.target.value)} style={In}/>
          </label>
          <label style={Field}>
            <div style={Label}>ドア高 (m)</div>
            <input type="number" min={1.6} step={0.1}
              value={cfg.doorHeight} onChange={e => onNum('doorHeight', e.target.value)} style={In}/>
          </label>
        </div>

        <label style={{ ...Field, marginTop: 10 }}>
          <div style={Label}>ドアの位置（左端から m）</div>
          <input type="number" step={0.1} min={0}
            value={Number.isFinite(doorLeft) ? Number(doorLeft.toFixed(2)) : 0}
            onChange={e => setDoorLeft(Number(e.target.value))} style={In}/>
          <div className="sub">※3D画面の青いドアをドラッグでも移動可能</div>
        </label>

        {/* 客席 */}
        <div style={Section}/>
        <div style={Row2}>
          <label style={Field}>
            <div style={Label}>4人席の数</div>
            <input type="number" min={0} step={1}
              value={cfg.table4Count} onChange={e => onNum('table4Count', e.target.value)} style={In}/>
          </label>
          <label style={Field}>
            <div style={Label}>2人席の数</div>
            <input type="number" min={0} step={1}
              value={cfg.table2Count} onChange={e => onNum('table2Count', e.target.value)} style={In}/>
          </label>
        </div>

        {/* 料金・滞在・投入 */}
        <div style={Section}/>
        <div style={Row2}>
          <label style={Field}>
            <div style={Label}>平均客単価（円）</div>
            <input type="number" min={0} step={100}
              value={(cfg as any).avgSpend ?? 1500}
              onChange={e => onNum('avgSpend' as any, e.target.value)} style={In}/>
          </label>
          <label style={Field}>
            <div style={Label}>平均滞在時間（秒）</div>
            <input type="number" min={0} step={1}
              value={cfg.avgDwell} onChange={e => onNum('avgDwell', e.target.value)} style={In}/>
          </label>
        </div>

        <label style={{ ...Field, marginTop: 10 }}>
          <div style={Label}>来客数（人数・追加分）</div>
          <input type="number" min={0} step={1}
            value={cfg.incoming} onChange={e => onNum('incoming', e.target.value)} style={In}/>
        </label>

        {/* 設備位置 */}
        <div style={Section}/>
        <div style={Row2}>
          <label style={Field}>
            <div style={Label}>厨房の位置</div>
            <select value={cfg.kitchenSide}
              onChange={e => set({ kitchenSide: e.target.value as Side })}
              style={In as any}>
              {Object.entries(sideLabel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label style={Field}>
            <div style={Label}>トイレの位置</div>
            <select value={cfg.toiletSide}
              onChange={e => set({ toiletSide: e.target.value as Side })}
              style={In as any}>
              {Object.entries(sideLabel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>

        {/* ライブ統計 */}
        <div style={{ ...Section, marginBottom: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>現在の状況</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10, fontSize: 12, lineHeight: 1.3,
          }}>
            <div>待機中: <b>{stats.pending}</b></div>
            <div>店内: <b>{stats.inside}</b></div>
            <div>着席中: <b>{stats.seated}</b></div>
            <div>退店中: <b>{stats.exiting}</b></div>
            <div>退店済: <b>{stats.departed}</b></div>
          </div>
        </div>

        {/* 売上 */}
        <div className="pill">
          総売上（円）：
          <span style={{ color: '#60a5fa', fontWeight: 800 }}>
            {Math.round(totalSales).toLocaleString()}
          </span>
          <div className="sub">売上＝平均客単価 × 累積着席人数</div>
        </div>
      </div>
    </div>
  )
}
