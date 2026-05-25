import { useState, useEffect, useMemo } from "react";
import PlayerReport from './PlayerReport';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwWI1D9nzEe-1MYHir_fJ3QxwB5OoTjMWikearVfAyASMGgnMESckaeXvjFeZl3FdHbkw/exec";

const PLAYERS = [
  "Ackermann Jules","Akos Abraham Daniel","Baftijaj Vleron",
  "Begolli Ayan","Bencivenga Jimenez Mirco","Brahimi Sofiane",
  "Castejon Hugo","Dutoit Tibo","Ferreira Cruz Samuel",
  "Gilgien Evan","Heiniger Loann","Kissling Ewan",
  "Kloc Karol","Kolata Xavier","Mumpasa Yahnn",
  "Njohole Elijah","Oliveira da Silva Gabriel","Ruppen Rayan",
  "Sebastiao Alex","Sirou Rayane","Testaz Ryan Will",
  "Thomas Joao Andre","Ukaj Adi"
].map((name, i) => ({ id: i + 1, name, num: i + 1 }));

// ─── DEMO DATA ────────────────────────────────────────────
const DEMO_E = [
  { date:"2026-05-10", joueur:"Ferreira Cruz Samuel", rpe:7, sommeil:3, fatigue:6, stress:4, douleurs:5, localisation:"Ischios", type:"entrainement" },
  { date:"2026-05-10", joueur:"Brahimi Sofiane", rpe:5, sommeil:2, fatigue:4, stress:3, douleurs:2, localisation:"Aucune", type:"entrainement" },
  { date:"2026-05-10", joueur:"Castejon Hugo", rpe:8, sommeil:5, fatigue:7, stress:6, douleurs:6, localisation:"Quadriceps", type:"entrainement" },
  { date:"2026-05-13", joueur:"Ferreira Cruz Samuel", rpe:6, sommeil:4, fatigue:5, stress:3, douleurs:4, localisation:"Ischios", type:"entrainement" },
  { date:"2026-05-13", joueur:"Castejon Hugo", rpe:7, sommeil:4, fatigue:6, stress:5, douleurs:5, localisation:"Quadriceps", type:"entrainement" },
  { date:"2026-05-16", joueur:"Ferreira Cruz Samuel", rpe:8, sommeil:5, fatigue:7, stress:5, douleurs:6, localisation:"Ischios", type:"entrainement" },
  { date:"2026-05-16", joueur:"Kissling Ewan", rpe:5, sommeil:2, fatigue:4, stress:3, douleurs:2, localisation:"Aucune", type:"entrainement" },
];
const DEMO_M = [
  { date:"2026-05-04", joueur:"Ferreira Cruz Samuel", sommeil:3, fatigue:4, stress:3, humeur:3, douleurs:4, localisation:"Ischios", heuresSommeil:"7h", parlerStaff:"Non", type:"match" },
  { date:"2026-05-04", joueur:"Brahimi Sofiane", sommeil:2, fatigue:2, stress:2, humeur:4, douleurs:1, localisation:"Aucune", heuresSommeil:"8h et +", parlerStaff:"Non", type:"match" },
  { date:"2026-05-04", joueur:"Castejon Hugo", sommeil:4, fatigue:5, stress:4, humeur:2, douleurs:5, localisation:"Quadriceps", heuresSommeil:"6h", parlerStaff:"Oui", type:"match" },
  { date:"2026-05-04", joueur:"Dutoit Tibo", sommeil:2, fatigue:3, stress:2, humeur:4, douleurs:2, localisation:"Aucune", heuresSommeil:"7h", parlerStaff:"Non", type:"match" },
];
const DEMO_T = [
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Ferreira Cruz Samuel", minutes:90, titulaire:true, buts:1, passes:0 },
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Brahimi Sofiane", minutes:90, titulaire:true, buts:0, passes:1 },
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Castejon Hugo", minutes:60, titulaire:true, buts:0, passes:0 },
  { date:"2026-05-04", adversaire:"Yverdon Sport B", score:"1-2", type:"Championnat", joueur:"Ferreira Cruz Samuel", minutes:90, titulaire:true, buts:0, passes:0 },
  { date:"2026-05-04", adversaire:"Yverdon Sport B", score:"1-2", type:"Championnat", joueur:"Brahimi Sofiane", minutes:75, titulaire:true, buts:1, passes:0 },
];

// ─── HELPERS ──────────────────────────────────────────────
const norm10 = (v, max) => Math.round((v / max) * 10);
function computeRisk(entries) {
  if (!entries.length) return null;
  const last = entries[entries.length - 1];
  const max = last.type === "match" ? 5 : 7;
  return ((norm10(last.fatigue,max) + norm10(last.stress,max) + norm10(last.douleurs,max) + (10 - norm10(last.sommeil,max))) / 4).toFixed(1);
}
const riskLevel = s => !s ? "none" : s >= 6 ? "high" : s >= 4 ? "medium" : "low";
const RC = { high:"#ef4444", medium:"#f59e0b", low:"#22c55e", none:"#475569" };
const RL = { high:"⚠ Risque", medium:"~ Surveiller", low:"✓ OK", none:"—" };
const ZC = { "Ischios":"#f97316","Mollets":"#06b6d4","Quadriceps":"#8b5cf6","Fessiers":"#ec4899","Adducteurs":"#84cc16","Tronc":"#64748b" };

// ─── HOOK MOBILE ──────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ─── UI ATOMS ─────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
    {label}
  </span>
);

const RiskDot = ({ level }) => (
  <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:RC[level], marginRight:5, boxShadow:`0 0 5px ${RC[level]}99` }} />
);

const Bar2 = ({ value, max, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
    <div style={{ flex:1, height:5, background:"#0d1b2a", borderRadius:99, overflow:"hidden" }}>
      <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:99 }} />
    </div>
    <span style={{ color:"#4a6480", fontSize:10, width:18, textAlign:"right" }}>{value}</span>
  </div>
);

const KPI = ({ label, value, sub, color="#38bdf8", icon, mobile }) => (
  <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:12, padding: mobile ? "12px 14px" : "16px 20px", flex:1, minWidth: mobile ? 80 : 110 }}>
    <div style={{ fontSize: mobile ? 16 : 20, marginBottom:3 }}>{icon}</div>
    <div style={{ color:"#4a6480", fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
    <div style={{ color, fontSize: mobile ? 22 : 28, fontWeight:900, lineHeight:1 }}>{value}</div>
    {sub && !mobile && <div style={{ color:"#2d4a63", fontSize:10, marginTop:3 }}>{sub}</div>}
  </div>
);

// ─── CARD JOUEUR MOBILE ───────────────────────────────────
function PlayerCardMobile({ p, onClick }) {
  const isM = p.lastE?.type === "match";
  const mx = isM ? 5 : 7;
  return (
    <div onClick={() => onClick(p)}
      style={{ background:"#0d1b2a", border:`1px solid ${p.level==="high"?"#7f1d1d":p.level==="medium"?"#451a03":"#1a2f45"}`, borderRadius:12, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:`${RC[p.level]}15`, border:`2px solid ${RC[p.level]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:RC[p.level], flexShrink:0 }}>
        {p.num}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:"#e2f4ff", fontWeight:700, fontSize:13, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {p.name} {p.parlerStaff > 0 ? "💬" : ""}
        </div>
        {p.lastE ? (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <Bar2 value={norm10(p.lastE.fatigue,mx)} max={10} color="#ef4444" />
            <Bar2 value={norm10(p.lastE.sommeil,mx)} max={10} color="#38bdf8" />
          </div>
        ) : <div style={{ color:"#1e3a52", fontSize:11 }}>Aucune saisie</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ color:RC[p.level], fontWeight:800, fontSize:16 }}>{p.score||"—"}</div>
        <div style={{ color:"#38bdf8", fontSize:11, fontWeight:600 }}>{p.totalMin}'</div>
      </div>
    </div>
  );
}

// ─── FICHE JOUEUR ─────────────────────────────────────────
function PlayerSheet({ player, allEntries, allTempsJeu, onBack, isMobile }) {
  const entries = allEntries.filter(e => e.joueur === player.name).sort((a,b) => a.date.localeCompare(b.date));
  const ptList = allTempsJeu.filter(t => t.joueur === player.name);
  const lastE = entries[entries.length-1];
  const score = computeRisk(entries);
  const level = riskLevel(score);
  const totalMin = ptList.reduce((s,t) => s+t.minutes, 0);
  const totalButs = ptList.reduce((s,t) => s+t.buts, 0);
  const totalPasses = ptList.reduce((s,t) => s+t.passes, 0);
  const isMatch = lastE?.type === "match";
  const max = isMatch ? 5 : 7;

  const radar = lastE ? [
    { m:"Énergie", v: max - lastE.fatigue },
    { m:"Sommeil", v: lastE.sommeil },
    { m:"Sérénité", v: max - lastE.stress },
    { m:"Santé", v: max - lastE.douleurs },
  ] : [];

  const trend = entries.slice(-6).map(e => {
    const mx = e.type==="match" ? 5 : 7;
    return { date:e.date.slice(5), Fatigue:norm10(e.fatigue,mx), Sommeil:norm10(e.sommeil,mx), Stress:norm10(e.stress,mx) };
  });

  const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:4) && e.localisation && !["Aucune","Aucunes Blessures"].includes(e.localisation));
  const parlerStaff = entries.filter(e => e.parlerStaff === "Oui");
  const matches = [...new Map(ptList.map(t => [t.date+t.adversaire, t])).values()].sort((a,b)=>a.date.localeCompare(b.date));

  const card = (children, mb=14) => (
    <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:12, padding: isMobile ? "14px" : "20px", marginBottom:mb }}>
      {children}
    </div>
  );
  const cardTitle = (t) => <div style={{ color:"#2d5070", fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:10, textTransform:"uppercase" }}>{t}</div>;

  return (
    <div style={{ paddingBottom: isMobile ? 80 : 0 }}>
      <button onClick={onBack} style={{ background:"none", border:"1px solid #1a2f45", borderRadius:8, color:"#4a6480", padding:"6px 14px", cursor:"pointer", marginBottom:16, fontSize:12 }}>
        ← Retour
      </button>

      {/* Header joueur */}
      <div style={{ background:"linear-gradient(135deg,#0d1b2a,#0a2540)", border:`1px solid ${RC[level]}44`, borderRadius:14, padding: isMobile ? "14px" : "20px", marginBottom:14 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:`${RC[level]}15`, border:`2px solid ${RC[level]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:RC[level], flexShrink:0 }}>
            {player.num}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:800, color:"#e2f4ff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace: isMobile ? "nowrap" : "normal" }}>
              {player.name}
            </div>
            <span style={{ color:RC[level], fontWeight:700, fontSize:12 }}><RiskDot level={level}/>{RL[level]} · {score||"—"}/10</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <KPI label="Minutes" value={totalMin+""} icon="⏱" color="#38bdf8" mobile={isMobile} />
          <KPI label="Buts" value={totalButs} icon="⚽" color="#f97316" mobile={isMobile} />
          <KPI label="Passes" value={totalPasses} icon="🅰" color="#a78bfa" mobile={isMobile} />
        </div>
      </div>

      {parlerStaff.length > 0 && (
        <div style={{ background:"#1a0e00", border:"1px solid #92400e", borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>💬</span>
          <div>
            <div style={{ color:"#fbbf24", fontWeight:700, fontSize:12 }}>Souhaite parler au staff</div>
            <div style={{ color:"#78350f", fontSize:11 }}>Demande le {parlerStaff[parlerStaff.length-1].date}</div>
          </div>
        </div>
      )}

      {/* Radar */}
      {radar.length > 0 && card(<>
        {cardTitle("Bilan dernier état")}
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <RadarChart data={radar}>
            <PolarGrid stroke="#1a2f45" />
            <PolarAngleAxis dataKey="m" tick={{ fill:"#4a6480", fontSize: isMobile ? 10 : 12 }} />
            <Radar dataKey="v" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </>)}

      {/* Douleurs */}
      {card(<>
        {cardTitle("Historique douleurs")}
        {blessures.length === 0 ? (
          <div style={{ color:"#22c55e", fontSize:13 }}>✓ Aucun signal significatif</div>
        ) : blessures.slice(-5).reverse().map((b, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #0a1520" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:ZC[b.localisation]||"#64748b" }} />
              <span style={{ color:"#94b8d0", fontSize:12 }}>{b.localisation}</span>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <Pill label={`${b.douleurs}/${b.type==="match"?5:7}`} color={b.douleurs>=5?"#ef4444":b.douleurs>=3?"#f59e0b":"#64748b"} />
              <span style={{ color:"#2d4a63", fontSize:10 }}>{b.date.slice(5)}</span>
            </div>
          </div>
        ))}
      </>)}

      {/* Courbe */}
      {trend.length > 1 && card(<>
        {cardTitle("Évolution wellness")}
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
          <LineChart data={trend}>
            <XAxis dataKey="date" tick={{ fill:"#2d4a63", fontSize:9 }} />
            <YAxis domain={[0,10]} tick={{ fill:"#2d4a63", fontSize:9 }} width={20} />
            <Tooltip contentStyle={{ background:"#0a1520", border:"none", borderRadius:8, color:"#e2f4ff", fontSize:11 }} />
            <ReferenceLine y={7} stroke="#ef444422" strokeDasharray="4 4" />
            <Line dataKey="Fatigue" stroke="#ef4444" dot={false} strokeWidth={2} />
            <Line dataKey="Sommeil" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line dataKey="Stress" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", gap:12, marginTop:6, flexWrap:"wrap" }}>
          {[["Fatigue","#ef4444"],["Sommeil","#38bdf8"],["Stress","#f59e0b"]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:12, height:2, background:c }} />
              <span style={{ color:"#2d4a63", fontSize:10 }}>{l}</span>
            </div>
          ))}
        </div>
      </>)}

      {/* Temps de jeu */}
      {matches.length > 0 && card(<>
        {cardTitle("Temps de jeu par match")}
        <ResponsiveContainer width="100%" height={isMobile ? 140 : 160}>
          <BarChart data={matches}>
            <XAxis dataKey="adversaire" tick={{ fill:"#2d4a63", fontSize:8 }} />
            <YAxis domain={[0,120]} tick={{ fill:"#2d4a63", fontSize:9 }} width={20} />
            <Tooltip contentStyle={{ background:"#0a1520", border:"none", borderRadius:8, color:"#e2f4ff", fontSize:11 }}
              formatter={(v) => [`${v} min`,"Temps"]} />
            <ReferenceLine y={90} stroke="#1a2f45" strokeDasharray="4 4" />
            <Bar dataKey="minutes" radius={[4,4,0,0]}>
              {matches.map((m,i) => <Cell key={i} fill={m.titulaire?"#38bdf8":"#6366f1"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>)}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [entrainement, setEntrainement] = useState(DEMO_E);
  const [matchData, setMatchData] = useState(DEMO_M);
  const [tempsJeu, setTempsJeu] = useState(DEMO_T);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");

  const allEntries = useMemo(() => [...entrainement, ...matchData].sort((a,b) => a.date.localeCompare(b.date)), [entrainement, matchData]);

  const loadData = async () => {
    if (APPS_SCRIPT_URL === "COLLER_ICI_VOTRE_URL_APPS_SCRIPT") return;
    setLoading(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      if (data.entrainement?.length) { setEntrainement(data.entrainement); setIsDemo(false); }
      if (data.match?.length) setMatchData(data.match);
      if (data.tempsJeu?.length) setTempsJeu(data.tempsJeu);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const playerStats = useMemo(() => PLAYERS.map(p => {
    const entries = allEntries.filter(e => e.joueur === p.name).sort((a,b) => a.date.localeCompare(b.date));
    const pt = tempsJeu.filter(t => t.joueur === p.name);
    const score = computeRisk(entries);
    const level = riskLevel(score);
    const lastE = entries[entries.length-1];
    const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:4) && e.localisation && !["Aucune","Aucunes Blessures"].includes(e.localisation));
    return { ...p, entries, score, level, lastE, blessures,
      parlerStaff: entries.filter(e => e.parlerStaff === "Oui").length,
      totalMin: pt.reduce((s,t) => s+t.minutes, 0),
      matchesJoues: pt.length,
      totalButs: pt.reduce((s,t) => s+t.buts, 0),
    };
  }), [allEntries, tempsJeu]);

  const alerts = playerStats.filter(p => p.level === "high");
  const staffCalls = playerStats.filter(p => p.parlerStaff > 0);
  const avgFatigue = allEntries.length ? (allEntries.reduce((s,e) => s+norm10(e.fatigue, e.type==="match"?5:7), 0) / allEntries.length).toFixed(1) : "—";
  const filtered = playerStats.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // ── STYLES ────────────────────────────────────────────────
  const BG = "#060e18";
  const CARD = "#0d1b2a";
  const BORDER = "#1a2f45";
  const P = isMobile ? "0 12px" : "0 24px";
  const MP = isMobile ? 12 : 24;

  const tabActive = { borderBottom:"2px solid #38bdf8", color:"#38bdf8" };
  const tabInactive = { borderBottom:"2px solid transparent", color:"#2d4a63" };

  const TABS = [
    { id:"dashboard", icon:"📊", label:"Bord" },
    { id:"players",   icon:"👥", label:"Effectif" },
    { id:"matches",   icon:"🏆", label:"Matchs" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#c8dff0", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ background:"#080f1a", borderBottom:`1px solid ${BORDER}`, padding:`0 ${MP}px`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height: isMobile ? 50 : 58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#0ea5e9,#1d4ed8)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚽</div>
            <div>
              <div style={{ fontWeight:900, fontSize: isMobile ? 13 : 15, color:"#e2f4ff" }}>Wellness FC</div>
              {!isMobile && <div style={{ fontSize:10, color:"#2d5070", letterSpacing:1.5, textTransform:"uppercase" }}>Saison 2026</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {isDemo && <span style={{ background:"#f59e0b22", color:"#f59e0b", border:"1px solid #f59e0b44", borderRadius:99, padding:"2px 8px", fontSize:10, fontWeight:700 }}>DÉMO</span>}
            <button onClick={loadData} disabled={loading}
              style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, color:"#38bdf8", padding: isMobile ? "5px 10px" : "6px 14px", cursor:"pointer", fontWeight:600, fontSize: isMobile ? 11 : 12 }}>
              {loading ? "⟳" : "↻"}{!isMobile && " Actualiser"}
            </button>
          </div>
        </div>
      </div>

      {/* NAV — desktop en haut, mobile en bas */}
      {!isMobile && (
        <div style={{ background:"#080f1a", borderBottom:`1px solid #060e18`, padding:`0 ${MP}px` }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
                style={{ background:"none", border:"none", ...( tab===t.id ? tabActive : tabInactive ), padding:"12px 18px", cursor:"pointer", fontWeight:700, fontSize:13, transition:"all .2s", fontFamily:"inherit" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding: isMobile ? "16px 12px" : "24px", paddingBottom: isMobile ? 80 : 24 }}>

        {/* Fiche joueur */}
        {selected && (
  <PlayerReport player={selected} allEntries={allEntries} allTempsJeu={tempsJeu} onBack={() => setSelected(null)} />
)}

        {/* DASHBOARD */}
        {!selected && tab === "dashboard" && (
          <div>
            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 8 : 12, marginBottom: isMobile ? 14 : 20 }}>
              <KPI label="Effectif" value={PLAYERS.length} color="#38bdf8" icon="👥" mobile={isMobile} />
              <KPI label="Alertes" value={alerts.length} color={alerts.length>0?"#ef4444":"#22c55e"} icon="⚠" mobile={isMobile} />
              <KPI label="Fatigue moy." value={avgFatigue} color="#f59e0b" icon="📈" mobile={isMobile} />
              <KPI label="Saisies" value={allEntries.length} color="#a78bfa" icon="📋" mobile={isMobile} />
            </div>

            {/* Alertes staff */}
            {staffCalls.length > 0 && (
              <div style={{ background:"#140c00", border:"1px solid #92400e", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                <div style={{ color:"#fbbf24", fontWeight:700, fontSize:12, marginBottom:8 }}>💬 SOUHAITE PARLER AU STAFF</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {staffCalls.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#1a0e00", border:"1px solid #78350f", borderRadius:8, padding:"5px 12px", cursor:"pointer", color:"#fbbf24", fontWeight:600, fontSize:12 }}>
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertes risque */}
            {alerts.length > 0 && (
              <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                <div style={{ color:"#ef4444", fontWeight:700, fontSize:12, marginBottom:8 }}>⚠ JOUEURS À RISQUE ÉLEVÉ</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {alerts.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#1a0000", border:"1px solid #7f1d1d", borderRadius:8, padding:"8px 12px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ color:"#ef4444", fontWeight:700, fontSize:13 }}><RiskDot level="high"/>{p.name}</span>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <Pill label={`${p.score}/10`} color="#ef4444" />
                        {p.blessures[p.blessures.length-1] && <span style={{ color:"#f59e0b", fontSize:11 }}>{p.blessures[p.blessures.length-1].localisation}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau / Liste joueurs */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", borderBottom:`1px solid #0d1b2a`, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                <span style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Effectif</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                  style={{ background:"#060e18", border:`1px solid ${BORDER}`, borderRadius:8, color:"#c8dff0", padding:"5px 10px", fontSize:12, outline:"none", width: isMobile ? 140 : 200 }} />
              </div>

              {isMobile ? (
                // Vue mobile : liste de cartes
                <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                  {filtered.map(p => (
                    <div key={p.id} style={{ borderTop:`1px solid #0a1520` }}>
                      <PlayerCardMobile p={p} onClick={setSelected} />
                    </div>
                  ))}
                </div>
              ) : (
                // Vue desktop : tableau complet
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#080f1a" }}>
                        {["Joueur","Fatigue","Sommeil","Stress","Douleurs","Zone","Score","Min"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", color:"#1e3a52", fontSize:10, fontWeight:700, textAlign:"left", whiteSpace:"nowrap", letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => {
                        const isM = p.lastE?.type === "match";
                        const mx = isM ? 5 : 7;
                        return (
                          <tr key={p.id} onClick={() => setSelected(p)} style={{ borderTop:`1px solid ${BORDER}`, cursor:"pointer" }}
                            onMouseEnter={e => e.currentTarget.style.background="#0a1520"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"11px 14px", whiteSpace:"nowrap" }}>
                              <RiskDot level={p.level} />
                              <span style={{ color:"#c8dff0", fontWeight:600, fontSize:13 }}>{p.name}</span>
                              {p.parlerStaff > 0 && <span style={{ marginLeft:5 }}>💬</span>}
                            </td>
                            {p.lastE ? (
                              <>
                                <td style={{ padding:"11px 14px", minWidth:80 }}><Bar2 value={norm10(p.lastE.fatigue,mx)} max={10} color="#ef4444" /></td>
                                <td style={{ padding:"11px 14px", minWidth:80 }}><Bar2 value={norm10(p.lastE.sommeil,mx)} max={10} color="#38bdf8" /></td>
                                <td style={{ padding:"11px 14px", minWidth:80 }}><Bar2 value={norm10(p.lastE.stress,mx)} max={10} color="#f59e0b" /></td>
                                <td style={{ padding:"11px 14px", minWidth:80 }}><Bar2 value={norm10(p.lastE.douleurs,mx)} max={10} color="#a78bfa" /></td>
                                <td style={{ padding:"11px 14px" }}>
                                  {p.lastE.localisation && !["Aucune","Aucunes Blessures"].includes(p.lastE.localisation)
                                    ? <Pill label={p.lastE.localisation} color={ZC[p.lastE.localisation]||"#64748b"} />
                                    : <span style={{ color:"#1e3a52" }}>—</span>}
                                </td>
                                <td style={{ padding:"11px 14px", color:RC[p.level], fontWeight:800 }}>{p.score}</td>
                              </>
                            ) : <td colSpan={6} style={{ padding:"11px 14px", color:"#1e3a52", fontSize:12 }}>Aucune saisie</td>}
                            <td style={{ padding:"11px 14px", color:"#38bdf8", fontWeight:700 }}>{p.totalMin}'</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EFFECTIF */}
        {!selected && tab === "players" && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un joueur..."
              style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, color:"#c8dff0", padding:"10px 14px", fontSize:13, outline:"none", width:"100%", marginBottom:14, boxSizing:"border-box" }} />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.map(p => <PlayerCardMobile key={p.id} p={p} onClick={setSelected} />)}
            </div>
          </div>
        )}

        {/* MATCHS */}
        {!selected && tab === "matches" && (
          <div>
            {[...new Map(tempsJeu.map(t=>[t.date+t.adversaire,t])).values()].sort((a,b)=>b.date.localeCompare(a.date)).map((m,mi) => {
              const mEntries = tempsJeu.filter(t=>t.date===m.date && t.adversaire===m.adversaire).sort((a,b)=>b.minutes-a.minutes);
              return (
                <div key={mi} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, marginBottom:12, overflow:"hidden" }}>
                  <div style={{ padding:"12px 14px", borderBottom:`1px solid #0d1b2a`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ color:"#38bdf8", fontWeight:800, fontSize: isMobile ? 14 : 16 }}>vs {m.adversaire}</div>
                      <div style={{ color:"#2d5070", fontSize:11 }}>{m.date} · {m.type}</div>
                    </div>
                    <div style={{ color:"#e2f4ff", fontWeight:900, fontSize: isMobile ? 18 : 20 }}>{m.score}</div>
                  </div>
                  {isMobile ? (
                    // Vue mobile matchs
                    <div style={{ padding:"8px 0" }}>
                      {mEntries.map((t,i) => (
                        <div key={i} onClick={() => setSelected(playerStats.find(p=>p.name===t.joueur))}
                          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderBottom:"1px solid #0a1520", cursor:"pointer" }}>
                          <div style={{ flex:1, color:"#c8dff0", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.joueur}</div>
                          <Pill label={t.titulaire?"Tit.":"Rem."} color={t.titulaire?"#22c55e":"#6366f1"} />
                          <span style={{ color:"#38bdf8", fontSize:12, fontWeight:700, minWidth:35 }}>{t.minutes}'</span>
                          {t.buts>0 && <span style={{ color:"#f97316", fontSize:11 }}>⚽{t.buts}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Vue desktop matchs
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#080f1a" }}>
                          {["Joueur","Statut","Temps","Buts","Passes D."].map(h => (
                            <th key={h} style={{ padding:"8px 14px", color:"#1e3a52", fontSize:10, fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:1 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mEntries.map((t,i) => (
                          <tr key={i} onClick={() => setSelected(playerStats.find(p=>p.name===t.joueur))}
                            style={{ borderTop:`1px solid #0d1b2a`, cursor:"pointer" }}
                            onMouseEnter={e => e.currentTarget.style.background="#0a1520"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"10px 14px", color:"#c8dff0", fontWeight:600, fontSize:13 }}>{t.joueur}</td>
                            <td style={{ padding:"10px 14px" }}><Pill label={t.titulaire?"Titulaire":"Remplaçant"} color={t.titulaire?"#22c55e":"#6366f1"} /></td>
                            <td style={{ padding:"10px 14px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:60, height:5, background:CARD, borderRadius:99, overflow:"hidden" }}>
                                  <div style={{ width:`${Math.min((t.minutes/90)*100,100)}%`, height:"100%", background:t.titulaire?"#38bdf8":"#6366f1", borderRadius:99 }} />
                                </div>
                                <span style={{ color:"#4a6480", fontSize:12 }}>{t.minutes}'</span>
                              </div>
                            </td>
                            <td style={{ padding:"10px 14px", color:t.buts>0?"#f97316":"#1e3a52" }}>{t.buts>0?`⚽ ${t.buts}`:"—"}</td>
                            <td style={{ padding:"10px 14px", color:t.passes>0?"#a78bfa":"#1e3a52" }}>{t.passes>0?`🅰 ${t.passes}`:"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
            {tempsJeu.length === 0 && (
              <div style={{ color:"#2d5070", textAlign:"center", padding:60, fontSize:14 }}>
                Aucune donnée de temps de jeu.
              </div>
            )}
          </div>
        )}
      </div>

      {/* NAV MOBILE BAS D'ÉCRAN */}
      {isMobile && !selected && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#080f1a", borderTop:`1px solid ${BORDER}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, background:"none", border:"none", padding:"10px 0 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, fontFamily:"inherit",
                color: tab===t.id ? "#38bdf8" : "#2d4a63",
                borderTop: tab===t.id ? "2px solid #38bdf8" : "2px solid transparent" }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
