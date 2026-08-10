import { useState, useEffect, useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import PlayerReport from './PlayerReport';
import Login from "./Login";
import Matches from "./Matches";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrZx9S7XA7_qiGKs1Wd8rK1vExSaVXOrO6ojohJlsTMl1CCWdeaZ2Y1S6EIUeM5SGEeQ/exec";

const PLAYERS = [
  "Afonso Kiara","Agushi Liza","Barbosa da Silva Neto Giovanna Maria",
  "Berisha Anea","Chassagnot Kyméa","De Moraes Salles Meirelles Da Cunha Ariel",
  "De Sousa Lea","Dénéreaz Gabriella","Fontannaz Tessa","Gavazaj Melina",
  "Grognuz Sophia","Jesus Noia Ana Catarina","Jollant Ema","Kasdi Tessa Thanina",
  "Kastrati Lorena","Lourenço Chiara","Maire Alicia","Mavraj Melissa",
  "Moretti Laura","Papaux Maëlle","Pasche Jade","Perez Mélina",
  "Persano Gioia","Shala Lediana","Spahija Alea","Turkovic Nadina",
  "Wagnières Roxane"
].map((name, i) => ({ id: i + 1, name, num: i + 1 }));

const DEMO_E = [
  { date:"2026-08-08", joueur:"Afonso Kiara", rpe:7, sommeil:3, fatigue:6, stress:4, douleurs:5, localisation:"Genoux", enPeriode:"Non", douleursMenstruelles:0, type:"entrainement" },
  { date:"2026-08-08", joueur:"Agushi Liza", rpe:5, sommeil:2, fatigue:3, stress:2, douleurs:1, localisation:"Aucune", enPeriode:"Oui", douleursMenstruelles:3, type:"entrainement" },
  { date:"2026-08-08", joueur:"Moretti Laura", rpe:8, sommeil:5, fatigue:7, stress:6, douleurs:6, localisation:"Ischios", enPeriode:"Non", douleursMenstruelles:0, type:"entrainement" },
  { date:"2026-08-08", joueur:"Chassagnot Kyméa", rpe:6, sommeil:4, fatigue:5, stress:3, douleurs:2, localisation:"Aucune", enPeriode:"Non", douleursMenstruelles:0, type:"entrainement" },
  { date:"2026-08-08", joueur:"Kasdi Tessa Thanina", rpe:9, sommeil:6, fatigue:8, stress:7, douleurs:7, localisation:"Mollets", enPeriode:"Oui", douleursMenstruelles:4, type:"entrainement" },
  { date:"2026-08-08", joueur:"Dénéreaz Gabriella", rpe:5, sommeil:3, fatigue:4, stress:3, douleurs:2, localisation:"Aucune", enPeriode:"Oui", douleursMenstruelles:2, type:"entrainement" },
];
const DEMO_M = [
  { date:"2026-08-05", joueur:"Afonso Kiara", sommeil:3, fatigue:4, stress:3, humeur:3, douleurs:4, localisation:"Genoux", heuresSommeil:"6-7h", parlerStaff:"Non", type:"match" },
  { date:"2026-08-05", joueur:"Agushi Liza", sommeil:2, fatigue:2, stress:2, humeur:4, douleurs:1, localisation:"Aucune", heuresSommeil:"8h et +", parlerStaff:"Non", type:"match" },
  { date:"2026-08-05", joueur:"Moretti Laura", sommeil:4, fatigue:5, stress:4, humeur:2, douleurs:5, localisation:"Ischios", heuresSommeil:"5-6h", parlerStaff:"Oui", type:"match" },
];

const norm10 = (v, max) => v ? Math.max(0, Math.min(10, Math.round((v / max) * 10))) : 0;

function computeRisk(entries) {
  if (!entries.length) return null;
  const last = entries[entries.length - 1];
  const max = last.type === "match" ? 5 : 10;
  return ((norm10(last.fatigue,max) + norm10(last.stress,max) + norm10(last.douleurs,max) + (10 - norm10(last.sommeil,max))) / 4).toFixed(1);
}
const riskLevel = s => !s ? "none" : s >= 6 ? "high" : s >= 4 ? "medium" : "low";
const RC = { high:"#ef4444", medium:"#f59e0b", low:"#22c55e", none:"#475569" };
const ZC = { "Ischios":"#f97316","Mollets":"#06b6d4","Quadriceps":"#8b5cf6","Genoux":"#ec4899","Chevilles":"#84cc16","Dos":"#64748b","Épaules":"#f59e0b" };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

const Pill = ({ label, color }) => (
  <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
    {label}
  </span>
);

const RiskDot = ({ level }) => (
  <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:RC[level], marginRight:5, flexShrink:0 }} />
);

const Bar2 = ({ value, max, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
    <div style={{ flex:1, height:5, background:"#0d1b2a", borderRadius:99, overflow:"hidden" }}>
      <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:99 }} />
    </div>
    <span style={{ color:"#4a6480", fontSize:10, width:18, textAlign:"right" }}>{value}</span>
  </div>
);

const KPI = ({ label, value, color="#38bdf8", icon, mobile }) => (
  <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:12, padding: mobile ? "12px 10px" : "16px 20px", flex:1, textAlign: mobile ? "center" : "left" }}>
    <div style={{ fontSize: mobile ? 18 : 22, marginBottom:4 }}>{icon}</div>
    <div style={{ color:"#4a6480", fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
    <div style={{ color, fontSize: mobile ? 22 : 28, fontWeight:900, lineHeight:1 }}>{value}</div>
  </div>
);

function PlayerCardMobile({ p, onClick }) {
  const isM = p.lastE?.type === "match";
  const mx = isM ? 5 : 10;
  return (
    <div onClick={() => onClick(p)}
      style={{ background:"#0d1b2a", border:`1px solid ${p.level==="high"?"#7f1d1d":p.level==="medium"?"#451a03":"#1a2f45"}`, borderRadius:12, padding:"14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:42, height:42, borderRadius:"50%", background:`${RC[p.level]}15`, border:`2px solid ${RC[p.level]}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:RC[p.level], flexShrink:0 }}>
        {p.num}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:"#e2f4ff", fontWeight:700, fontSize:13, marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {p.name} {p.parlerStaff > 0 ? "💬" : ""} {p.enPeriode ? "🌸" : ""}
        </div>
        {p.lastE ? (
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <Bar2 value={norm10(p.lastE.fatigue,mx)} max={10} color="#ef4444" />
            <Bar2 value={norm10(p.lastE.sommeil,mx)} max={10} color="#38bdf8" />
          </div>
        ) : <div style={{ color:"#1e3a52", fontSize:11 }}>Aucune saisie</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ color:RC[p.level], fontWeight:800, fontSize:18 }}>{p.score||"—"}</div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "wellnessfc_user";

function getSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(getSavedUser);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [entrainement, setEntrainement] = useState(DEMO_E);
  const [matchData, setMatchData] = useState(DEMO_M);
  const [tempsJeu, setTempsJeu] = useState([]);
  const [savingMatch, setSavingMatch] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");

  // IMPORTANT : tous les hooks (useMemo, useEffect, useState) doivent être
  // appelés AVANT tout "return" conditionnel, sinon React perd le fil
  // (règle des Hooks) et plante avec l'erreur #310 / page blanche.
  const allEntries = useMemo(
    () => [...entrainement, ...matchData].sort((a, b) => a.date.localeCompare(b.date)),
    [entrainement, matchData]
  );

  const playerStats = useMemo(() => PLAYERS.map(p => {
    const entries = allEntries.filter(e => e.joueur === p.name).sort((a,b) => a.date.localeCompare(b.date));
    const score = computeRisk(entries);
    const level = riskLevel(score);
    const lastE = entries[entries.length-1];
    const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:6) && e.localisation && !["Aucune"].includes(e.localisation));
    const enPeriode = entries.filter(e => e.enPeriode === "Oui").length > 0 && lastE?.enPeriode === "Oui";
    return { ...p, entries, score, level, lastE, blessures, enPeriode,
      parlerStaff: entries.filter(e => e.parlerStaff === "Oui").length,
    };
  }), [allEntries]);

  // Si pas connecté → page login (placé APRÈS tous les hooks)
  if (!user) return <Login onLogin={setUser} />;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      // On applique toujours ce que renvoie le Sheet, même si c'est vide
      // (sinon les lignes supprimées dans le Sheet restent affichées dans l'app)
      setEntrainement(data.entrainement || []);
      setMatchData(data.match || []);
      setTempsJeu(data.tempsJeu || []);
      setIsDemo(false);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Enregistre le temps de jeu + commentaires d'un match (staff) dans le Sheet,
  // puis recharge les données pour refléter le changement.
  const handleSaveMatch = async (entries) => {
    setSavingMatch(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        // Content-Type text/plain évite le préflight CORS que Apps Script ne gère pas bien
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ entries }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      await loadData();
    } finally {
      setSavingMatch(false);
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setUser(null);
  };

  const alerts = playerStats.filter(p => p.level === "high");
  const staffCalls = playerStats.filter(p => p.parlerStaff > 0);
  const enPeriodeCount = playerStats.filter(p => p.enPeriode).length;
  const avgFatigue = allEntries.length ? (allEntries.reduce((s,e) => {
    const mx = e.type==="match" ? 5 : 10;
    return s + norm10(e.fatigue, mx);
  }, 0) / allEntries.length).toFixed(1) : "—";

  const filtered = playerStats.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const CARD = "#0d1b2a";
  const BORDER = "#1a2f45";
  const MP = isMobile ? 12 : 24;
  const PINK = "#ec4899";

  const TABS = [
    { id:"dashboard", icon:"📊", label:"Bord" },
    { id:"players",   icon:"👥", label:"Effectif" },
    { id:"matches",   icon:"🏆", label:"Matchs" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#060e18", color:"#c8dff0", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:"#080f1a", borderBottom:`1px solid ${BORDER}`, padding:`0 ${MP}px`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height: isMobile ? 52 : 58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, background:`linear-gradient(135deg,${PINK},#8b5cf6)`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>⚽</div>
            <div>
              <div style={{ fontWeight:900, fontSize: isMobile ? 14 : 15, color:"#e2f4ff" }}>Wellness FC — Féminin</div>
              {!isMobile && <div style={{ fontSize:10, color:"#2d5070", letterSpacing:1.5, textTransform:"uppercase" }}>Saison 2026/27</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {isDemo && <span style={{ background:"#f59e0b22", color:"#f59e0b", border:"1px solid #f59e0b44", borderRadius:99, padding:"2px 7px", fontSize:10, fontWeight:700 }}>DÉMO</span>}
            {!isMobile && <span style={{ color:"#2d5070", fontSize:11 }}>{user.email}</span>}
            <button onClick={loadData} disabled={loading}
              style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, color:"#38bdf8", padding: isMobile ? "6px 10px" : "6px 14px", cursor:"pointer", fontWeight:600, fontSize: isMobile ? 13 : 12 }}>
              {loading ? "⟳" : "↻"}{!isMobile && " Actualiser"}
            </button>
            <button onClick={handleLogout}
              style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:8, color:"#4a6480", padding: isMobile ? "6px 10px" : "6px 14px", cursor:"pointer", fontSize: isMobile ? 13 : 12 }}>
              {isMobile ? "⏻" : "Déconnexion"}
            </button>
          </div>
        </div>
      </div>

      {!isMobile && (
        <div style={{ background:"#080f1a", borderBottom:"1px solid #060e18", padding:`0 ${MP}px` }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
                style={{ background:"none", border:"none", borderBottom: tab===t.id ? `2px solid ${PINK}` : "2px solid transparent", color: tab===t.id ? PINK : "#2d4a63", padding:"12px 18px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding: isMobile ? "14px 12px" : "24px", paddingBottom: isMobile ? 80 : 24 }}>
        {selected && (
          <PlayerReport player={selected} allEntries={allEntries} allTempsJeu={tempsJeu} onBack={() => setSelected(null)} isMobile={isMobile} />
        )}

        {!selected && tab === "dashboard" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 8 : 12, marginBottom: isMobile ? 12 : 20 }}>
              <KPI label="Effectif" value={PLAYERS.length} color={PINK} icon="👥" mobile={isMobile} />
              <KPI label="Alertes" value={alerts.length} color={alerts.length>0?"#ef4444":"#22c55e"} icon="⚠" mobile={isMobile} />
              <KPI label="Fatigue moy." value={avgFatigue} color="#f59e0b" icon="📈" mobile={isMobile} />
              <KPI label="En période 🌸" value={enPeriodeCount} color={PINK} icon="🌸" mobile={isMobile} />
            </div>

            {enPeriodeCount > 0 && (
              <div style={{ background:"#1a0010", border:`1px solid #9d174d`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ color:PINK, fontWeight:700, fontSize:12, marginBottom:6 }}>🌸 JOUEUSES EN PÉRIODE</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {playerStats.filter(p => p.enPeriode).map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#2d0018", border:`1px solid #9d174d`, borderRadius:8, padding:"5px 12px", cursor:"pointer", color:PINK, fontWeight:600, fontSize:12 }}>
                      {isMobile ? p.name.split(" ")[0] : p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {staffCalls.length > 0 && (
              <div style={{ background:"#140c00", border:"1px solid #92400e", borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ color:"#fbbf24", fontWeight:700, fontSize:12, marginBottom:8 }}>💬 SOUHAITE PARLER AU STAFF</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {staffCalls.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#1a0e00", border:"1px solid #78350f", borderRadius:8, padding:"6px 12px", cursor:"pointer", color:"#fbbf24", fontWeight:600, fontSize:12 }}>
                      {isMobile ? p.name.split(" ")[0] : p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.length > 0 && (
              <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ color:"#ef4444", fontWeight:700, fontSize:12, marginBottom:8 }}>⚠ JOUEUSES À RISQUE ÉLEVÉ</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {alerts.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#1a0000", border:"1px solid #7f1d1d", borderRadius:8, padding:"8px 12px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
                        <RiskDot level="high"/>
                        <span style={{ color:"#ef4444", fontWeight:700, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                        {p.enPeriode && <span>🌸</span>}
                      </div>
                      <Pill label={`${p.score}/10`} color="#ef4444" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", borderBottom:"1px solid #0d1b2a", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                <span style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", whiteSpace:"nowrap" }}>Effectif</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                  style={{ background:"#060e18", border:`1px solid ${BORDER}`, borderRadius:8, color:"#c8dff0", padding:"6px 10px", fontSize:12, outline:"none", width: isMobile ? "55%" : 200 }} />
              </div>
              {isMobile ? (
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {filtered.map((p,i) => (
                    <div key={p.id} style={{ borderTop: i>0 ? "1px solid #0a1520" : "none" }}>
                      <PlayerCardMobile p={p} onClick={setSelected} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#080f1a" }}>
                        {["Joueuse","Fatigue","Sommeil","Stress","Douleurs","Zone","Période","Score"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", color:"#1e3a52", fontSize:10, fontWeight:700, textAlign:"left", whiteSpace:"nowrap", letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => {
                        const mx = p.lastE?.type==="match" ? 5 : 10;
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
                                  {p.lastE.localisation && p.lastE.localisation !== "Aucune"
                                    ? <Pill label={p.lastE.localisation} color={ZC[p.lastE.localisation]||"#64748b"} />
                                    : <span style={{ color:"#1e3a52" }}>—</span>}
                                </td>
                                <td style={{ padding:"11px 14px", textAlign:"center" }}>
                                  {p.enPeriode ? <span>🌸</span> : <span style={{ color:"#1e3a52" }}>—</span>}
                                </td>
                                <td style={{ padding:"11px 14px", color:RC[p.level], fontWeight:800 }}>{p.score}</td>
                              </>
                            ) : <td colSpan={7} style={{ padding:"11px 14px", color:"#1e3a52", fontSize:12 }}>Aucune saisie</td>}
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

        {!selected && tab === "players" && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une joueuse..."
              style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, color:"#c8dff0", padding:"10px 14px", fontSize:13, outline:"none", width:"100%", marginBottom:12, boxSizing:"border-box" }} />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.map(p => <PlayerCardMobile key={p.id} p={p} onClick={setSelected} />)}
            </div>
          </div>
        )}

        {!selected && tab === "matches" && (
          <Matches
            players={PLAYERS}
            matchWellness={matchData}
            tempsJeu={tempsJeu}
            onSave={handleSaveMatch}
            saving={savingMatch}
            isMobile={isMobile}
          />
        )}
      </div>

      {isMobile && !selected && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#080f1a", borderTop:`1px solid ${BORDER}`, display:"flex", zIndex:100 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, background:"none", border:"none", padding:"10px 0 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, fontFamily:"inherit",
                color: tab===t.id ? PINK : "#2d4a63",
                borderTop: tab===t.id ? `2px solid ${PINK}` : "2px solid transparent" }}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <span style={{ fontSize:11, fontWeight:700 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
