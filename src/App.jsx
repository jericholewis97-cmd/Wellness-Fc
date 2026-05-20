import { useState, useEffect, useMemo } from "react";
import PlayerReport from './PlayerReport';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from "recharts";

// ─── CONFIG — REMPLACER PAR VOTRE URL APPS SCRIPT ────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwWI1D9nzEe-1MYHir_fJ3QxwB5OoTjMWikearVfAyASMGgnMESckaeXvjFeZl3FdHbkw/exec";
// Exemple : "https://script.google.com/macros/s/AKfycb.../exec"

// ─── LISTE JOUEURS (vos 23 joueurs réels) ─────────────────
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

// ─── DONNÉES DE DÉMO (actives tant que l'URL n'est pas renseignée) ──
const DEMO_ENTRAINEMENT = [
  { date:"2026-05-10", joueur:"Ferreira Cruz Samuel", rpe:7, sommeil:3, fatigue:6, stress:4, douleurs:5, localisation:"Ischios", type:"entrainement" },
  { date:"2026-05-10", joueur:"Brahimi Sofiane",      rpe:5, sommeil:2, fatigue:4, stress:3, douleurs:2, localisation:"Aucune", type:"entrainement" },
  { date:"2026-05-10", joueur:"Castejon Hugo",        rpe:8, sommeil:5, fatigue:7, stress:6, douleurs:6, localisation:"Quadriceps", type:"entrainement" },
  { date:"2026-05-10", joueur:"Dutoit Tibo",          rpe:4, sommeil:2, fatigue:3, stress:2, douleurs:1, localisation:"Aucune", type:"entrainement" },
  { date:"2026-05-10", joueur:"Kissling Ewan",        rpe:6, sommeil:3, fatigue:5, stress:4, douleurs:3, localisation:"Mollets", type:"entrainement" },
  { date:"2026-05-13", joueur:"Ferreira Cruz Samuel", rpe:6, sommeil:4, fatigue:5, stress:3, douleurs:4, localisation:"Ischios", type:"entrainement" },
  { date:"2026-05-13", joueur:"Brahimi Sofiane",      rpe:4, sommeil:2, fatigue:3, stress:2, douleurs:1, localisation:"Aucune", type:"entrainement" },
  { date:"2026-05-13", joueur:"Castejon Hugo",        rpe:7, sommeil:4, fatigue:6, stress:5, douleurs:5, localisation:"Quadriceps", type:"entrainement" },
  { date:"2026-05-16", joueur:"Ferreira Cruz Samuel", rpe:8, sommeil:5, fatigue:7, stress:5, douleurs:6, localisation:"Ischios", type:"entrainement" },
  { date:"2026-05-16", joueur:"Kissling Ewan",        rpe:5, sommeil:2, fatigue:4, stress:3, douleurs:2, localisation:"Aucune", type:"entrainement" },
];
const DEMO_MATCH = [
  { date:"2026-05-04", joueur:"Ferreira Cruz Samuel", sommeil:3, fatigue:4, stress:3, humeur:3, douleurs:4, localisation:"Ischios", heuresSommeil:"7h", parlerStaff:"Non", type:"match" },
  { date:"2026-05-04", joueur:"Brahimi Sofiane",      sommeil:2, fatigue:2, stress:2, humeur:4, douleurs:1, localisation:"Aucune", heuresSommeil:"8h et +", parlerStaff:"Non", type:"match" },
  { date:"2026-05-04", joueur:"Castejon Hugo",        sommeil:4, fatigue:5, stress:4, humeur:2, douleurs:5, localisation:"Quadriceps", heuresSommeil:"6h", parlerStaff:"Oui", type:"match" },
  { date:"2026-05-04", joueur:"Dutoit Tibo",          sommeil:2, fatigue:3, stress:2, humeur:4, douleurs:2, localisation:"Aucune", heuresSommeil:"7h", parlerStaff:"Non", type:"match" },
];
const DEMO_TEMPS_JEU = [
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Ferreira Cruz Samuel", minutes:90, titulaire:true, buts:1, passes:0 },
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Brahimi Sofiane", minutes:90, titulaire:true, buts:0, passes:1 },
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Castejon Hugo", minutes:60, titulaire:true, buts:0, passes:0 },
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Dutoit Tibo", minutes:90, titulaire:true, buts:1, passes:0 },
  { date:"2026-04-26", adversaire:"FC Lausanne B", score:"2-1", type:"Championnat", joueur:"Kissling Ewan", minutes:30, titulaire:false, buts:0, passes:1 },
  { date:"2026-05-04", adversaire:"Yverdon Sport B", score:"1-2", type:"Championnat", joueur:"Ferreira Cruz Samuel", minutes:90, titulaire:true, buts:0, passes:0 },
  { date:"2026-05-04", adversaire:"Yverdon Sport B", score:"1-2", type:"Championnat", joueur:"Brahimi Sofiane", minutes:75, titulaire:true, buts:1, passes:0 },
  { date:"2026-05-04", adversaire:"Yverdon Sport B", score:"1-2", type:"Championnat", joueur:"Castejon Hugo", minutes:90, titulaire:true, buts:0, passes:0 },
  { date:"2026-05-04", adversaire:"Yverdon Sport B", score:"1-2", type:"Championnat", joueur:"Dutoit Tibo", minutes:45, titulaire:false, buts:0, passes:0 },
];

// ─── HELPERS ──────────────────────────────────────────────
const norm10 = (v, max) => Math.round((v / max) * 10);

function computeRisk(entries) {
  if (!entries.length) return null;
  const last = entries[entries.length - 1];
  const isMatch = last.type === "match";
  const max = isMatch ? 5 : 10;
  const fatigue  = norm10(last.fatigue,  max);
  const stress   = norm10(last.stress,   max);
  const douleurs = norm10(last.douleurs, max);
  const sommeil  = norm10(last.sommeil,  max);
  return ((fatigue + stress + douleurs + (10 - sommeil)) / 4).toFixed(1);
}

const riskLevel = s => !s ? "none" : s >= 6 ? "high" : s >= 4 ? "medium" : "low";
const RISK_COLOR = { high:"#ef4444", medium:"#f59e0b", low:"#22c55e", none:"#475569" };
const RISK_LABEL = { high:"⚠ Risque élevé", medium:"~ Surveiller", low:"✓ Forme OK", none:"— Aucune donnée" };

const ZONE_COLORS = {
  "Ischios":"#f97316","Mollets":"#06b6d4","Quadriceps":"#8b5cf6",
  "Fessiers":"#ec4899","Adducteurs":"#84cc16","Abducteurs":"#f59e0b",
  "Tronc":"#64748b","Aucune":"#1e293b"
};

// ─── COMPOSANTS ───────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span style={{ background: color+"22", color, border:`1px solid ${color}44`, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:.5 }}>
    {label}
  </span>
);

const KPI = ({ label, value, sub, color="#38bdf8", icon }) => (
  <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, padding:"18px 20px", flex:1, minWidth:120 }}>
    <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
    <div style={{ color:"#4a6480", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
    <div style={{ color, fontSize:30, fontWeight:900, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{value}</div>
    {sub && <div style={{ color:"#2d4a63", fontSize:11, marginTop:4 }}>{sub}</div>}
  </div>
);

const Bar2 = ({ value, max, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <div style={{ flex:1, height:5, background:"#0d1b2a", borderRadius:99, overflow:"hidden" }}>
      <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:99 }} />
    </div>
    <span style={{ color:"#4a6480", fontSize:11, width:20, textAlign:"right" }}>{value}</span>
  </div>
);

const RiskDot = ({ level }) => (
  <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:RISK_COLOR[level], marginRight:6, boxShadow:`0 0 5px ${RISK_COLOR[level]}99` }} />
);

// ─── FICHE JOUEUR ─────────────────────────────────────────
function PlayerSheet({ player, allEntries, allTempsJeu, onBack }) {
  const entries = allEntries.filter(e => e.joueur === player.name).sort((a,b) => a.date.localeCompare(b.date));
  const ptList  = allTempsJeu.filter(t => t.joueur === player.name);
  const lastE   = entries[entries.length-1];
  const score   = computeRisk(entries);
  const level   = riskLevel(score);

  const totalMin = ptList.reduce((s,t) => s+t.minutes, 0);
  const totalButs = ptList.reduce((s,t) => s+t.buts, 0);
  const totalPasses = ptList.reduce((s,t) => s+t.passes, 0);

  const isMatch = lastE?.type === "match";
  const max = isMatch ? 5 : 10;

  const radar = lastE ? [
    { m:"Énergie",   v: max - lastE.fatigue },
    { m:"Sommeil",   v: lastE.sommeil },
    { m:"Sérénité",  v: max - lastE.stress },
    { m:"Santé",     v: max - lastE.douleurs },
    { m:"Humeur",    v: isMatch ? lastE.humeur : Math.round(max/2) },
  ] : [];

  const trend = entries.slice(-8).map(e => {
    const mx = e.type==="match" ? 5 : 10;
    return {
      date: e.date.slice(5),
      fatigue: norm10(e.fatigue, mx),
      sommeil: norm10(e.sommeil, mx),
      stress:  norm10(e.stress,  mx),
      douleurs:norm10(e.douleurs,mx),
      type: e.type,
    };
  });

  const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:5) && e.localisation && e.localisation !== "Aucune" && e.localisation !== "Aucunes Blessures");
  const parlerStaff = entries.filter(e => e.parlerStaff === "Oui");

  const matches = [...new Map(ptList.map(t => [t.date+t.adversaire, t])).values()].sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div>
      <button onClick={onBack} style={{ background:"none", border:"1px solid #1a2f45", borderRadius:8, color:"#4a6480", padding:"6px 14px", cursor:"pointer", marginBottom:20, fontSize:12 }}>
        ← Retour au tableau de bord
      </button>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0d1b2a 0%,#0a2540 100%)", border:"1px solid #1a2f45", borderRadius:18, padding:24, marginBottom:18, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:`${RISK_COLOR[level]}15`, border:`3px solid ${RISK_COLOR[level]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:RISK_COLOR[level], fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2 }}>
          {player.num}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#e2f4ff", letterSpacing:-0.5, marginBottom:6 }}>{player.name}</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ color:RISK_COLOR[level], fontWeight:700, fontSize:13 }}><RiskDot level={level} />{RISK_LABEL[level]}</span>
            {score && <Pill label={`Score ${score}/10`} color={RISK_COLOR[level]} />}
            {lastE && <Pill label={lastE.type === "match" ? "Dernier: J+1 Match" : "Dernier: Entraînement"} color="#38bdf8" />}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <KPI label="Minutes" value={totalMin} sub={`${ptList.length} matchs`} color="#38bdf8" icon="⏱" />
          <KPI label="Buts" value={totalButs} color="#f97316" icon="⚽" />
          <KPI label="Passes D." value={totalPasses} color="#a78bfa" icon="🅰" />
        </div>
      </div>

      {parlerStaff.length > 0 && (
        <div style={{ background:"#1a0e00", border:"1px solid #92400e", borderRadius:12, padding:"12px 18px", marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>💬</span>
          <div>
            <div style={{ color:"#fbbf24", fontWeight:700, fontSize:13 }}>Ce joueur souhaite parler au staff</div>
            <div style={{ color:"#78350f", fontSize:12 }}>Demande faite le {parlerStaff[parlerStaff.length-1].date}</div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Radar */}
        <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, padding:20 }}>
          <div style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}>Bilan dernier état {isMatch?"(J+1 match)":"(entraînement)"}</div>
          {radar.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radar}>
                <PolarGrid stroke="#1a2f45" />
                <PolarAngleAxis dataKey="m" tick={{ fill:"#4a6480", fontSize:11 }} />
                <Radar dataKey="v" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div style={{ color:"#2d4a63", fontSize:13, padding:20 }}>Aucune donnée saisie</div>}
        </div>

        {/* Douleurs */}
        <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, padding:20 }}>
          <div style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}>Historique douleurs</div>
          {blessures.length === 0 ? (
            <div style={{ color:"#22c55e", fontSize:13, marginTop:16 }}>✓ Aucun signal significatif</div>
          ) : blessures.slice(-6).reverse().map((b, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #0d1b2a" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: ZONE_COLORS[b.localisation] || "#64748b" }} />
                <span style={{ color:"#94b8d0", fontSize:13 }}>{b.localisation}</span>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <Pill label={`${b.douleurs}/${b.type==="match"?5:10}`} color={b.douleurs >= (b.type==="match"?4:7) ? "#ef4444" : "#f59e0b"} />
                <span style={{ color:"#2d4a63", fontSize:11 }}>{b.date.slice(5)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Courbe évolution */}
      {trend.length > 1 && (
        <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, marginBottom:16, textTransform:"uppercase" }}>Évolution wellness (normalisé /10)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <XAxis dataKey="date" tick={{ fill:"#2d4a63", fontSize:10 }} />
              <YAxis domain={[0,10]} tick={{ fill:"#2d4a63", fontSize:10 }} />
              <Tooltip contentStyle={{ background:"#0a1520", border:"1px solid #1a2f45", borderRadius:8, color:"#e2f4ff", fontSize:12 }} />
              <ReferenceLine y={7} stroke="#ef444422" strokeDasharray="4 4" label={{ value:"Seuil alerte", fill:"#ef4444", fontSize:10 }} />
              <Line dataKey="fatigue"  stroke="#ef4444" name="Fatigue"  dot={false} strokeWidth={2} />
              <Line dataKey="sommeil"  stroke="#38bdf8" name="Sommeil"  dot={false} strokeWidth={2} />
              <Line dataKey="stress"   stroke="#f59e0b" name="Stress"   dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
              <Line dataKey="douleurs" stroke="#a78bfa" name="Douleurs" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:16, marginTop:8, flexWrap:"wrap" }}>
            {[["Fatigue","#ef4444"],["Sommeil","#38bdf8"],["Stress","#f59e0b"],["Douleurs","#a78bfa"]].map(([l,c]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:16, height:2, background:c, borderRadius:1 }} />
                <span style={{ color:"#2d4a63", fontSize:11 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temps de jeu */}
      {matches.length > 0 && (
        <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, padding:20 }}>
          <div style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, marginBottom:16, textTransform:"uppercase" }}>Temps de jeu par match</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={matches}>
              <XAxis dataKey="adversaire" tick={{ fill:"#2d4a63", fontSize:10 }} />
              <YAxis domain={[0,120]} tick={{ fill:"#2d4a63", fontSize:10 }} />
              <Tooltip contentStyle={{ background:"#0a1520", border:"1px solid #1a2f45", borderRadius:8, color:"#e2f4ff", fontSize:12 }}
                formatter={(v) => [`${v} min`,"Temps de jeu"]} />
              <ReferenceLine y={90} stroke="#1a2f45" strokeDasharray="4 4" />
              <Bar dataKey="minutes" radius={[4,4,0,0]}>
                {matches.map((m,i) => <Cell key={i} fill={m.titulaire?"#38bdf8":"#6366f1"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:16, marginTop:8 }}>
            {[["Titulaire","#38bdf8"],["Remplaçant","#6366f1"]].map(([l,c]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:10, height:10, background:c, borderRadius:2 }} />
                <span style={{ color:"#2d4a63", fontSize:11 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [isDemo, setIsDemo]     = useState(true);
  const [entrainement, setEntrainement] = useState(DEMO_ENTRAINEMENT);
  const [matchData, setMatchData]       = useState(DEMO_MATCH);
  const [tempsJeu, setTempsJeu]         = useState(DEMO_TEMPS_JEU);
  const [selected, setSelected] = useState(null);
  const [tab, setTab]           = useState("dashboard");
  const [search, setSearch]     = useState("");

  const allEntries = useMemo(() => [...entrainement, ...matchData].sort((a,b) => a.date.localeCompare(b.date)), [entrainement, matchData]);

  const loadData = async () => {
    if (APPS_SCRIPT_URL === "COLLER_ICI_VOTRE_URL_APPS_SCRIPT") return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      if (data.entrainement) { setEntrainement(data.entrainement); setIsDemo(false); }
      if (data.match)        { setMatchData(data.match); }
      if (data.tempsJeu)     { setTempsJeu(data.tempsJeu); }
    } catch(e) {
      setError("Impossible de charger les données. Vérifiez l'URL Apps Script.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const playerStats = useMemo(() => PLAYERS.map(p => {
    const entries = allEntries.filter(e => e.joueur === p.name).sort((a,b) => a.date.localeCompare(b.date));
    const pt      = tempsJeu.filter(t => t.joueur === p.name);
    const score   = computeRisk(entries);
    const level   = riskLevel(score);
    const lastE   = entries[entries.length-1];
    const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:5) && e.localisation && e.localisation !== "Aucune" && e.localisation !== "Aucunes Blessures");
    const parlerStaff = entries.filter(e => e.parlerStaff === "Oui").length;
    return { ...p, entries, score, level, lastE, blessures, parlerStaff,
      totalMin:    pt.reduce((s,t)=>s+t.minutes,0),
      matchesJoues:pt.length,
      totalButs:   pt.reduce((s,t)=>s+t.buts,0),
    };
  }), [allEntries, tempsJeu]);

  const alerts     = playerStats.filter(p => p.level === "high");
  const staffCalls = playerStats.filter(p => p.parlerStaff > 0);
  const avgFatigue = allEntries.length ? (allEntries.reduce((s,e)=>s+norm10(e.fatigue,e.type==="match"?5:10),0)/allEntries.length).toFixed(1) : "—";
  const filtered   = playerStats.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const tabStyle = active => ({
    background:"none", border:"none",
    borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
    color: active ? "#38bdf8" : "#2d4a63",
    padding:"12px 16px", cursor:"pointer", fontWeight:700, fontSize:13,
    transition:"all .2s", fontFamily:"inherit"
  });

  return (
    <div style={{ minHeight:"100vh", background:"#060e18", color:"#c8dff0", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ background:"#080f1a", borderBottom:"1px solid #0d1b2a", padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, background:"linear-gradient(135deg,#0ea5e9,#1d4ed8)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚽</div>
            <div>
              <div style={{ fontWeight:900, fontSize:15, color:"#e2f4ff", letterSpacing:-0.5 }}>Wellness Dashboard</div>
              <div style={{ fontSize:10, color:"#2d5070", letterSpacing:1.5, textTransform:"uppercase" }}>Suivi individuel · Saison 2026</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {isDemo && <Pill label="MODE DÉMO" color="#f59e0b" />}
            {error && <span style={{ color:"#ef4444", fontSize:12 }}>⚠ {error}</span>}
            <button onClick={loadData} disabled={loading}
              style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:8, color:"#38bdf8", padding:"6px 14px", cursor:"pointer", fontWeight:600, fontSize:12 }}>
              {loading ? "⟳ Chargement..." : "↻ Actualiser"}
            </button>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{ background:"#080f1a", borderBottom:"1px solid #060e18", padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex" }}>
          {[["dashboard","📊 Tableau de bord"],["players","👥 Effectif"],["matches","🏆 Temps de jeu"]].map(([id,label]) => (
            <button key={id} style={tabStyle(tab===id)} onClick={() => { setTab(id); setSelected(null); }}>{label}</button>
          ))}
        </div>
      </div>

      {/* CONTENU */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:24 }}>

        {/* Fiche joueur */}
        {selected && (
  <PlayerReport player={selected} allEntries={allEntries} allTempsJeu={tempsJeu} onBack={() => setSelected(null)} />
)}

        {/* Dashboard */}
        {!selected && tab === "dashboard" && (
          <div>
            <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
              <KPI label="Effectif" value={PLAYERS.length} sub="joueurs" color="#38bdf8" icon="👥" />
              <KPI label="Alertes" value={alerts.length} sub="risque élevé" color={alerts.length>0?"#ef4444":"#22c55e"} icon="⚠" />
              <KPI label="Fatigue moy." value={avgFatigue} sub="/10 ce cycle" color="#f59e0b" icon="📈" />
              <KPI label="Saisies" value={allEntries.length} sub="cette saison" color="#a78bfa" icon="📋" />
              {staffCalls.length > 0 && <KPI label="Contact staff" value={staffCalls.length} sub="demandes en attente" color="#f97316" icon="💬" />}
            </div>

            {/* Alertes contact staff */}
            {staffCalls.length > 0 && (
              <div style={{ background:"#140c00", border:"1px solid #92400e", borderRadius:12, padding:16, marginBottom:16 }}>
                <div style={{ color:"#fbbf24", fontWeight:700, fontSize:13, marginBottom:10 }}>💬 JOUEURS SOUHAITANT PARLER AU STAFF</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {staffCalls.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)} style={{ background:"#1a0e00", border:"1px solid #78350f", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:"#fbbf24", fontWeight:600, fontSize:13 }}>
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertes risque */}
            {alerts.length > 0 && (
              <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:12, padding:16, marginBottom:16 }}>
                <div style={{ color:"#ef4444", fontWeight:700, fontSize:13, marginBottom:10 }}>⚠ JOUEURS À RISQUE ÉLEVÉ</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {alerts.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#1a0000", border:"1px solid #7f1d1d", borderRadius:8, padding:"8px 14px", cursor:"pointer", display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ color:"#ef4444", fontWeight:800 }}>{p.name}</span>
                      <Pill label={`${p.score}/10`} color="#ef4444" />
                      {p.blessures[p.blessures.length-1] && (
                        <span style={{ color:"#f59e0b", fontSize:11 }}>{p.blessures[p.blessures.length-1].localisation}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau effectif */}
            <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #0d1b2a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>État de l'effectif</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un joueur..."
                  style={{ background:"#060e18", border:"1px solid #1a2f45", borderRadius:8, color:"#c8dff0", padding:"5px 12px", fontSize:12, outline:"none", width:200 }} />
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#080f1a" }}>
                      {["Joueur","Fatigue","Sommeil","Stress","Douleurs","Zone","Score","Minutes"].map(h => (
                        <th key={h} style={{ padding:"10px 14px", color:"#1e3a52", fontSize:10, fontWeight:700, textAlign:"left", whiteSpace:"nowrap", letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const isM = p.lastE?.type === "match";
                      const mx = isM ? 5 : 10;
                      return (
                        <tr key={p.id} onClick={() => setSelected(p)} style={{ borderTop:"1px solid #0d1b2a", cursor:"pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background="#0a1520"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"11px 14px", whiteSpace:"nowrap" }}>
                            <RiskDot level={p.level} />
                            <span style={{ color:"#c8dff0", fontWeight:600, fontSize:13 }}>{p.name}</span>
                            {p.parlerStaff > 0 && <span style={{ marginLeft:6, fontSize:14 }}>💬</span>}
                          </td>
                          {p.lastE ? (
                            <>
                              <td style={{ padding:"11px 14px", minWidth:90 }}><Bar2 value={norm10(p.lastE.fatigue,mx)} max={10} color="#ef4444" /></td>
                              <td style={{ padding:"11px 14px", minWidth:90 }}><Bar2 value={norm10(p.lastE.sommeil,mx)} max={10} color="#38bdf8" /></td>
                              <td style={{ padding:"11px 14px", minWidth:90 }}><Bar2 value={norm10(p.lastE.stress,mx)} max={10} color="#f59e0b" /></td>
                              <td style={{ padding:"11px 14px", minWidth:90 }}><Bar2 value={norm10(p.lastE.douleurs,mx)} max={10} color="#a78bfa" /></td>
                              <td style={{ padding:"11px 14px" }}>
                                {p.lastE.localisation && p.lastE.localisation !== "Aucune" && p.lastE.localisation !== "Aucunes Blessures" ? (
                                  <Pill label={p.lastE.localisation} color={ZONE_COLORS[p.lastE.localisation]||"#64748b"} />
                                ) : <span style={{ color:"#1e3a52" }}>—</span>}
                              </td>
                              <td style={{ padding:"11px 14px", color:RISK_COLOR[p.level], fontWeight:800 }}>{p.score}</td>
                            </>
                          ) : (
                            <td colSpan={6} style={{ padding:"11px 14px", color:"#1e3a52", fontSize:12 }}>Aucune saisie</td>
                          )}
                          <td style={{ padding:"11px 14px", color:"#38bdf8", fontWeight:700 }}>{p.totalMin}'</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Effectif cards */}
        {!selected && tab === "players" && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un joueur..."
              style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:10, color:"#c8dff0", padding:"10px 16px", fontSize:13, outline:"none", width:"100%", marginBottom:18, boxSizing:"border-box" }} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
              {filtered.map(p => {
                const isM = p.lastE?.type === "match";
                const mx  = isM ? 5 : 10;
                return (
                  <div key={p.id} onClick={() => setSelected(p)}
                    style={{ background:"#0d1b2a", border:`1px solid ${p.level==="high"?"#7f1d1d":p.level==="medium"?"#451a03":"#1a2f45"}`, borderRadius:14, padding:18, cursor:"pointer", transition:"transform .15s" }}
                    onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="none"}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                      <div>
                        <div style={{ fontWeight:700, color:"#e2f4ff", fontSize:14, marginBottom:4 }}>{p.name}</div>
                        <div style={{ display:"flex", gap:6 }}>
                          <span style={{ color:RISK_COLOR[p.level], fontSize:11, fontWeight:700 }}><RiskDot level={p.level} />{p.score||"—"}</span>
                          {p.parlerStaff > 0 && <span style={{ fontSize:13 }}>💬</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:"#38bdf8", fontWeight:700, fontSize:14 }}>{p.totalMin}'</div>
                        <div style={{ color:"#1e3a52", fontSize:10 }}>{p.matchesJoues} matchs</div>
                      </div>
                    </div>
                    {p.lastE && (
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <Bar2 value={norm10(p.lastE.fatigue,mx)} max={10} color="#ef4444" />
                        <Bar2 value={norm10(p.lastE.sommeil,mx)} max={10} color="#38bdf8" />
                        <Bar2 value={norm10(p.lastE.douleurs,mx)} max={10} color="#a78bfa" />
                      </div>
                    )}
                    {!p.lastE && <div style={{ color:"#1e3a52", fontSize:12, marginTop:8 }}>Aucune donnée</div>}
                    {p.blessures.length > 0 && (
                      <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #0d1b2a" }}>
                        <Pill label={p.blessures[p.blessures.length-1].localisation} color={ZONE_COLORS[p.blessures[p.blessures.length-1].localisation]||"#f59e0b"} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Temps de jeu */}
        {!selected && tab === "matches" && (
          <div>
            {[...new Map(tempsJeu.map(t=>[t.date+t.adversaire,t])).values()].sort((a,b)=>b.date.localeCompare(a.date)).map((m,mi) => {
              const mEntries = tempsJeu.filter(t=>t.date===m.date && t.adversaire===m.adversaire).sort((a,b)=>b.minutes-a.minutes);
              const totalMin = mEntries.reduce((s,t)=>s+t.minutes,0);
              return (
                <div key={mi} style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:14, marginBottom:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 20px", borderBottom:"1px solid #0d1b2a", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <span style={{ color:"#38bdf8", fontWeight:800, fontSize:16 }}>vs {m.adversaire}</span>
                      <span style={{ color:"#2d5070", fontSize:12, marginLeft:12 }}>{m.date} · {m.type}</span>
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <span style={{ color:"#e2f4ff", fontWeight:900, fontSize:20 }}>{m.score}</span>
                      <Pill label={`${totalMin} min`} color="#4a6480" />
                    </div>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#080f1a" }}>
                        {["Joueur","Statut","Temps","Buts","Passes D."].map(h => (
                          <th key={h} style={{ padding:"8px 16px", color:"#1e3a52", fontSize:10, fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mEntries.map((t,i) => (
                        <tr key={i} onClick={() => setSelected(playerStats.find(p=>p.name===t.joueur))}
                          style={{ borderTop:"1px solid #0d1b2a", cursor:"pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background="#0a1520"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"10px 16px", color:"#c8dff0", fontWeight:600, fontSize:13 }}>{t.joueur}</td>
                          <td style={{ padding:"10px 16px" }}><Pill label={t.titulaire?"Titulaire":"Remplaçant"} color={t.titulaire?"#22c55e":"#6366f1"} /></td>
                          <td style={{ padding:"10px 16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:70, height:5, background:"#0d1b2a", borderRadius:99, overflow:"hidden" }}>
                                <div style={{ width:`${Math.min((t.minutes/90)*100,100)}%`, height:"100%", background:t.titulaire?"#38bdf8":"#6366f1", borderRadius:99 }} />
                              </div>
                              <span style={{ color:"#4a6480", fontSize:12 }}>{t.minutes}'</span>
                            </div>
                          </td>
                          <td style={{ padding:"10px 16px", color:t.buts>0?"#f97316":"#1e3a52", fontWeight:t.buts>0?700:400 }}>{t.buts>0?`⚽ ${t.buts}`:"—"}</td>
                          <td style={{ padding:"10px 16px", color:t.passes>0?"#a78bfa":"#1e3a52", fontWeight:t.passes>0?700:400 }}>{t.passes>0?`🅰 ${t.passes}`:"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {tempsJeu.length === 0 && (
              <div style={{ color:"#2d5070", textAlign:"center", padding:60, fontSize:14 }}>
                Aucune donnée de temps de jeu.<br/>Remplissez l'onglet "Temps de jeu" dans votre Google Sheet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
