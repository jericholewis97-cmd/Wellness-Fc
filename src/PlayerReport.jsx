import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
  BarChart, Bar, Cell
} from "recharts";

const norm = (v, max) => v ? Math.round((v / max) * 10) : 0;
const RC = { high:"#ef4444", medium:"#f59e0b", low:"#22c55e", none:"#475569" };
const ZC = { "Ischios":"#f97316","Mollets":"#06b6d4","Quadriceps":"#8b5cf6","Genoux":"#ec4899","Chevilles":"#84cc16","Dos":"#64748b","Épaules":"#f59e0b" };

function filterPeriod(entries, period) {
  const now = new Date();
  const cutoff = new Date();
  if (period === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (period === "quarter") cutoff.setMonth(now.getMonth() - 3);
  return entries.filter(e => new Date(e.date) >= cutoff);
}

function computeRisk(entries) {
  if (!entries.length) return null;
  const last = entries[entries.length - 1];
  const max = last.type === "match" ? 5 : 10;
  return ((norm(last.fatigue,max) + norm(last.stress,max) + norm(last.douleurs,max) + (10 - norm(last.sommeil,max))) / 4).toFixed(1);
}

const riskLevel = s => !s ? "none" : s >= 6 ? "high" : s >= 4 ? "medium" : "low";

function generatePDF(player, stats, period) {
  const periodLabel = period === "month" ? "Mensuel" : period === "quarter" ? "Trimestriel" : "Saison complète";
  const now = new Date().toLocaleDateString("fr-FR");
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Fiche ${player.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#1a1a2e;font-size:13px}
.page{width:210mm;min-height:297mm;padding:16mm 14mm}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #ec4899;padding-bottom:12px;margin-bottom:16px}
.name{font-size:24px;font-weight:900;color:#831843}
.sub{font-size:12px;color:#6b7280;margin-top:4px}
.badge{background:#fce7f3;color:#9d174d;border:1px solid #f9a8d4;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;display:inline-block;margin:2px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.kpi{background:#fdf2f8;border:1px solid #f9a8d4;border-radius:10px;padding:10px;text-align:center}
.kv{font-size:24px;font-weight:900;color:#9d174d}
.kl{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.section{margin-bottom:14px}
.section-title{font-size:11px;font-weight:800;color:#831843;text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid #fce7f3;padding-bottom:5px;margin-bottom:8px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.metric-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #fce7f3}
.metric-bar{flex:1;margin:0 8px;height:5px;background:#fce7f3;border-radius:99px;overflow:hidden}
.metric-fill{height:100%;border-radius:99px}
.period-box{background:#fdf2f8;border:1px solid #f9a8d4;border-left:3px solid #ec4899;border-radius:4px;padding:8px 10px;margin-bottom:6px}
.rec-item{display:flex;gap:8px;align-items:flex-start;padding:7px 10px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:4px;margin-bottom:5px}
.footer{margin-top:16px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:10px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="page">
<div class="header">
  <div>
    <div class="name">⚽ ${player.name}</div>
    <div class="sub">Rapport ${periodLabel} · Généré le ${now}</div>
    <div style="margin-top:6px">
      <span class="badge">${stats.entries.length} saisies</span>
      <span class="badge" style="background:${stats.level==="high"?"#fee2e2":stats.level==="medium"?"#fef3c7":"#dcfce7"};color:${RC[stats.level]};border-color:${RC[stats.level]}44">
        ${stats.level==="high"?"⚠ Risque élevé":stats.level==="medium"?"~ Surveiller":"✓ Forme OK"} · ${stats.score||"—"}/10
      </span>
      ${stats.enPeriodeCount > 0 ? `<span class="badge" style="background:#fce7f3;color:#9d174d;border-color:#f9a8d4">🌸 En période ${stats.enPeriodeCount}x</span>` : ""}
    </div>
  </div>
  <div style="text-align:right;font-size:11px;color:#9ca3af"><div>Wellness FC — Féminin</div><div>Saison 2026/27</div></div>
</div>

<div class="kpis">
  <div class="kpi"><div class="kv" style="color:#ef4444">${stats.avgFatigue}/10</div><div class="kl">Fatigue moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#38bdf8">${stats.avgSommeil}/10</div><div class="kl">Sommeil moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#f59e0b">${stats.avgStress}/10</div><div class="kl">Stress moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#ec4899">${stats.avgHumeur||"—"}/10</div><div class="kl">Humeur moy.</div></div>
</div>

${stats.enPeriodeCount > 0 ? `
<div class="section">
  <div class="section-title">🌸 Suivi cycle menstruel</div>
  <div class="period-box">
    <div><strong>Séances en période :</strong> ${stats.enPeriodeCount} sur ${stats.entries.length}</div>
    ${stats.avgDouleursMenst > 0 ? `<div style="margin-top:4px"><strong>Douleurs menstruelles moyennes :</strong> ${stats.avgDouleursMenst}/5</div>` : ""}
    ${stats.avgDouleursMenst >= 3 ? `<div style="margin-top:4px;color:#b91c1c">⚠ Douleurs significatives — adapter la charge d'entraînement</div>` : ""}
  </div>
</div>` : ""}

<div class="section">
  <div class="section-title">🏥 Blessures déclarées durant la période</div>
  ${stats.blessures.length === 0
    ? `<div style="color:#16a34a;font-size:12px">✓ Aucune blessure significative déclarée sur cette période</div>`
    : stats.blessures.map(b => `<div class="metric-row"><span>${b.date.split("-").reverse().join("/")} — ${b.localisation}</span><span style="color:#b91c1c;font-weight:700">${b.douleurs}/${b.type==="match"?5:10}</span></div>`).join("")}
</div>

<div class="section">
  <div class="section-title">🏆 Participation aux matchs</div>
  <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi"><div class="kv" style="color:#0369a1">${stats.matchsJoues.length}</div><div class="kl">Matchs joués</div></div>
    <div class="kpi"><div class="kv" style="color:#9d174d">${stats.totalMinutes}'</div><div class="kl">Minutes totales</div></div>
    <div class="kpi"><div class="kv" style="color:#b45309">${stats.moyenneMinutes || "—"}${stats.moyenneMinutes ? "'" : ""}</div><div class="kl">Moy. / match</div></div>
  </div>
  ${stats.matchsJoues.length === 0
    ? `<div style="color:#9ca3af;font-size:12px;margin-top:8px">Aucun temps de jeu enregistré sur cette période</div>`
    : stats.matchsJoues.map(m => `
      <div class="period-box" style="margin-top:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${m.adversaire ? `vs ${m.adversaire}` : "Match"} — ${m.date.split("-").reverse().join("/")}</strong>
          <span>${m.titulaire ? `<span class="badge" style="margin-right:6px">${m.titulaire}</span>` : ""}<span style="color:#9d174d;font-weight:800">${m.minutes}'</span></span>
        </div>
        ${m.commentaire ? `<div style="margin-top:4px;color:#6b7280;font-style:italic">« ${m.commentaire} »</div>` : ""}
      </div>`).join("")}
</div>

<div class="section">
  <div class="section-title">Recommandations personnalisées</div>
  ${stats.recommendations.map(r => `<div class="rec-item"><span>${r.icon}</span><div><strong>${r.title}</strong><br><span style="color:#6b7280">${r.text}</span></div></div>`).join("")}
</div>

<div class="footer">
  <span>Wellness FC — Suivi individuel féminin</span>
  <span>Document confidentiel — Usage interne staff</span>
  <span>${now}</span>
</div>
</div></body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export default function PlayerReport({ player, allEntries, allTempsJeu = [], onBack, isMobile }) {
  const [period, setPeriod] = useState("month");

  const entries = useMemo(() =>
    filterPeriod(allEntries.filter(e => e.joueur === player.name).sort((a,b) => a.date.localeCompare(b.date)), period),
    [allEntries, player, period]
  );

  const score = computeRisk(entries);
  const level = riskLevel(score);

  const avg = (arr, key, maxFn) => arr.length ? +(arr.reduce((s,e) => s + norm(e[key], maxFn(e)), 0) / arr.length).toFixed(1) : 0;
  const maxOf = e => e.type === "match" ? 5 : 10;

  const avgFatigue  = avg(entries, "fatigue", maxOf);
  const avgSommeil  = avg(entries, "sommeil", maxOf);
  const avgStress   = avg(entries, "stress",  maxOf);
  const avgDouleurs = avg(entries, "douleurs", maxOf);
  const avgHumeur   = avg(entries.filter(e=>e.humeur), "humeur", ()=>5) * 2;

  // Données menstruelles
  const enPeriodeEntries = entries.filter(e => e.enPeriode === "Oui");
  const enPeriodeCount = enPeriodeEntries.length;
  const avgDouleursMenst = enPeriodeEntries.filter(e=>e.douleursMenstruelles>0).length
    ? +(enPeriodeEntries.reduce((s,e)=>s+(e.douleursMenstruelles||0),0)/enPeriodeEntries.length).toFixed(1) : 0;

  // Blessures
  const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:6) && e.localisation && e.localisation !== "Aucune");
  const blessuresMap = {};
  blessures.forEach(b => { blessuresMap[b.localisation] = (blessuresMap[b.localisation]||0)+1; });
  const blessuresCount = Object.entries(blessuresMap).sort((a,b)=>b[1]-a[1]);

  // Alertes
  const alerts = [];
  if (avgFatigue >= 7) alerts.push("Fatigue chronique — repos recommandé");
  if (avgSommeil <= 4) alerts.push("Qualité du sommeil insuffisante");
  if (avgStress >= 7)  alerts.push("Niveau de stress élevé — entretien recommandé");
  if (avgDouleursMenst >= 3) alerts.push("Douleurs menstruelles significatives — adapter la charge");
  const parlerStaff = entries.filter(e => e.parlerStaff === "Oui");
  if (parlerStaff.length > 0) alerts.push(`A demandé à parler au staff (${parlerStaff.length}x)`);

  // Recommandations
  const recommendations = [];
  if (avgFatigue >= 6) recommendations.push({ icon:"😴", title:"Récupération", text:"Intégrer une séance de récupération active par semaine." });
  if (avgSommeil <= 5) recommendations.push({ icon:"🌙", title:"Sommeil", text:"Protocole de sommeil : coucher régulier, pas d'écran 1h avant." });
  if (avgStress >= 6)  recommendations.push({ icon:"🧘", title:"Gestion du stress", text:"Séances de cohérence cardiaque avant match." });
  if (avgDouleursMenst >= 3) recommendations.push({ icon:"🌸", title:"Cycle menstruel", text:"Adapter l'intensité des séances lors des règles douloureuses. Prévoir des alternatives." });
  if (blessuresCount.length > 0) recommendations.push({ icon:"🏥", title:"Prévention", text:`Renforcement spécifique zone : ${blessuresCount[0][0]}.` });
  if (recommendations.length === 0) recommendations.push({ icon:"✅", title:"Bonne forme", text:"Tous les indicateurs sont dans les normes !" });

  // Trend
  const trend = entries.slice(-8).map(e => {
    const mx = maxOf(e);
    return { date:e.date.slice(5), Fatigue:norm(e.fatigue,mx), Sommeil:norm(e.sommeil,mx), Stress:norm(e.stress,mx) };
  });

  // Radar
  const radarData = [
    { m:"Énergie",  v: 10 - avgFatigue },
    { m:"Sommeil",  v: avgSommeil },
    { m:"Sérénité", v: 10 - avgStress },
    { m:"Santé",    v: 10 - avgDouleurs },
    { m:"Humeur",   v: avgHumeur || 5 },
  ];

  // Participation matchs (temps de jeu + commentaires saisis par le staff), filtrée sur la période active
  const matchsJoues = useMemo(
    () => filterPeriod(
      allTempsJeu.filter(t => t.joueur === player.name && (t.minutes || 0) > 0),
      period
    ).sort((a, b) => b.date.localeCompare(a.date)),
    [allTempsJeu, player, period]
  );
  const totalMinutes = matchsJoues.reduce((s, t) => s + (t.minutes || 0), 0);
  const moyenneMinutes = matchsJoues.length ? Math.round(totalMinutes / matchsJoues.length) : 0;

  const stats = { entries, score, avgFatigue, avgSommeil, avgStress, avgDouleurs, avgHumeur,
    enPeriodeCount, avgDouleursMenst, blessures, blessuresCount, alerts, recommendations, level,
    matchsJoues, totalMinutes, moyenneMinutes };

  const periodLabel = { month:"Dernier mois", quarter:"3 derniers mois", season:"Toute la saison" };
  const PINK = "#ec4899";

  const card = (children, mb=12) => (
    <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:12, padding: isMobile ? "12px" : "18px", marginBottom:mb }}>
      {children}
    </div>
  );
  const cardTitle = t => <div style={{ color:"#2d5070", fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:10, textTransform:"uppercase" }}>{t}</div>;

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#c8dff0", paddingBottom: isMobile ? 80 : 0 }}>

      {/* Boutons période + PDF */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <button onClick={onBack} style={{ background:"none", border:"1px solid #1a2f45", borderRadius:8, color:"#4a6480", padding:"6px 14px", cursor:"pointer", fontSize:12 }}>
          ← Retour
        </button>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Object.entries(periodLabel).map(([k,v]) => (
            <button key={k} onClick={() => setPeriod(k)}
              style={{ background: period===k ? `linear-gradient(135deg,${PINK},#8b5cf6)` : "#0d1b2a", border:`1px solid ${period===k?"transparent":"#1a2f45"}`, borderRadius:8, color: period===k?"#fff":"#4a6480", padding:"6px 12px", cursor:"pointer", fontWeight:600, fontSize:11 }}>
              {v}
            </button>
          ))}
          <button onClick={() => generatePDF(player, stats, period)}
            style={{ background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:8, color:"#fff", padding:"6px 14px", cursor:"pointer", fontWeight:700, fontSize:11 }}>
            📄 PDF
          </button>
        </div>
      </div>

      {/* Header joueuse */}
      <div style={{ background:"linear-gradient(135deg,#0d1b2a,#1a0018)", border:`1px solid ${PINK}44`, borderRadius:14, padding: isMobile ? "14px" : "20px", marginBottom:12 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:`${PINK}15`, border:`2px solid ${PINK}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:PINK, flexShrink:0 }}>
            {player.num}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:800, color:"#e2f4ff", marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace: isMobile ? "nowrap" : "normal" }}>
              {player.name}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={{ background:`${RC[level]}22`, color:RC[level], border:`1px solid ${RC[level]}44`, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                {level==="high"?"⚠ Risque":level==="medium"?"~ Surveiller":"✓ OK"} · {score||"—"}/10
              </span>
              {enPeriodeCount > 0 && (
                <span style={{ background:"#fce7f322", color:PINK, border:`1px solid ${PINK}44`, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                  🌸 En période {enPeriodeCount}x
                </span>
              )}
              <span style={{ background:"#1a2f45", color:"#4a6480", borderRadius:99, padding:"2px 10px", fontSize:11 }}>
                {entries.length} saisies · {periodLabel[period]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ color:"#ef4444", fontWeight:700, fontSize:11, marginBottom:6 }}>⚠ ALERTES</div>
          {alerts.map((a,i) => (
            <div key={i} style={{ color:"#fca5a5", fontSize:12, padding:"3px 0", borderBottom: i<alerts.length-1?"1px solid #2d0a0a":"none" }}>→ {a}</div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,1fr)", gap:8, marginBottom:12 }}>
        {[
          ["Fatigue", avgFatigue, "#ef4444", "⚡"],
          ["Sommeil", avgSommeil, "#38bdf8", "😴"],
          ["Stress",  avgStress,  "#f59e0b", "🧠"],
          ["Douleurs",avgDouleurs,"#a78bfa", "🤕"],
          ["Humeur",  avgHumeur||0, PINK,    "😊"],
        ].map(([l,v,c,icon]) => (
          <div key={l} style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
            <div style={{ fontSize:16, marginBottom:3 }}>{icon}</div>
            <div style={{ color:"#2d5070", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
            <div style={{ color:c, fontSize:20, fontWeight:900 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Bloc période menstruelle */}
      {enPeriodeCount > 0 && card(<>
        {cardTitle("🌸 Cycle menstruel")}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ background:"#1a0018", border:`1px solid ${PINK}44`, borderRadius:10, padding:"12px" }}>
            <div style={{ color:"#4a6480", fontSize:10, marginBottom:4 }}>Séances en période</div>
            <div style={{ color:PINK, fontSize:24, fontWeight:900 }}>{enPeriodeCount}</div>
            <div style={{ color:"#2d4a63", fontSize:10 }}>sur {entries.length} saisies</div>
          </div>
          <div style={{ background:"#1a0018", border:`1px solid ${PINK}44`, borderRadius:10, padding:"12px" }}>
            <div style={{ color:"#4a6480", fontSize:10, marginBottom:4 }}>Douleurs moy.</div>
            <div style={{ color: avgDouleursMenst>=3?"#ef4444":PINK, fontSize:24, fontWeight:900 }}>
              {avgDouleursMenst > 0 ? `${avgDouleursMenst}/5` : "—"}
            </div>
            <div style={{ color:"#2d4a63", fontSize:10 }}>
              {avgDouleursMenst >= 4 ? "⚠ Sévères" : avgDouleursMenst >= 2 ? "Modérées" : "Légères"}
            </div>
          </div>
        </div>
        {avgDouleursMenst >= 3 && (
          <div style={{ background:"#1a0018", border:`1px solid #9d174d`, borderRadius:8, padding:"10px 12px", marginTop:8, fontSize:12, color:"#f9a8d4" }}>
            💡 Adapter l'intensité des séances lors des règles douloureuses
          </div>
        )}
      </>)}

      {/* Radar */}
      {card(<>
        {cardTitle("Profil wellness")}
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1a2f45" />
            <PolarAngleAxis dataKey="m" tick={{ fill:"#4a6480", fontSize: isMobile ? 9 : 11 }} />
            <Radar dataKey="v" stroke={PINK} fill={PINK} fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </>)}

      {/* Courbe évolution */}
      {trend.length > 1 && card(<>
        {cardTitle("Évolution wellness")}
        <ResponsiveContainer width="100%" height={isMobile ? 150 : 190}>
          <LineChart data={trend}>
            <XAxis dataKey="date" tick={{ fill:"#2d4a63", fontSize:9 }} />
            <YAxis domain={[0,10]} tick={{ fill:"#2d4a63", fontSize:9 }} width={20} />
            <Tooltip contentStyle={{ background:"#0a1520", border:"none", borderRadius:8, color:"#e2f4ff", fontSize:11 }} />
            <Line dataKey="Fatigue" stroke="#ef4444" dot={false} strokeWidth={2} />
            <Line dataKey="Sommeil" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line dataKey="Stress"  stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
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

      {/* Participation matchs */}
      {card(<>
        {cardTitle("🏆 Participation matchs")}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "repeat(3,1fr)", gap:10, marginBottom: matchsJoues.length ? 12 : 0 }}>
          <div style={{ background:"#0a1520", border:"1px solid #1a2f45", borderRadius:10, padding:"10px", textAlign:"center" }}>
            <div style={{ color:"#38bdf8", fontSize:20, fontWeight:900 }}>{matchsJoues.length}</div>
            <div style={{ color:"#2d5070", fontSize:9, textTransform:"uppercase", letterSpacing:1, marginTop:2 }}>Matchs joués</div>
          </div>
          <div style={{ background:"#0a1520", border:"1px solid #1a2f45", borderRadius:10, padding:"10px", textAlign:"center" }}>
            <div style={{ color:PINK, fontSize:20, fontWeight:900 }}>{totalMinutes}'</div>
            <div style={{ color:"#2d5070", fontSize:9, textTransform:"uppercase", letterSpacing:1, marginTop:2 }}>Minutes totales</div>
          </div>
          <div style={{ background:"#0a1520", border:"1px solid #1a2f45", borderRadius:10, padding:"10px", textAlign:"center" }}>
            <div style={{ color:"#f59e0b", fontSize:20, fontWeight:900 }}>{moyenneMinutes || "—"}{moyenneMinutes ? "'" : ""}</div>
            <div style={{ color:"#2d5070", fontSize:9, textTransform:"uppercase", letterSpacing:1, marginTop:2 }}>Moy. / match</div>
          </div>
        </div>
        {matchsJoues.length === 0 ? (
          <div style={{ color:"#2d5070", fontSize:12 }}>Aucun temps de jeu enregistré pour l'instant.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {matchsJoues.map((m, i) => (
              <div key={i} style={{ background:"#0a1520", borderRadius:8, padding:"8px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                  <span style={{ color:"#94b8d0", fontSize:12, fontWeight:600 }}>
                    {m.adversaire ? `vs ${m.adversaire}` : "Match"} — {m.date.split("-").reverse().join("/")}
                  </span>
                  <span style={{ color:"#38bdf8", fontWeight:700, fontSize:13 }}>{m.minutes}'</span>
                </div>
                {m.commentaire && (
                  <div style={{ color:"#4a6480", fontSize:11, marginTop:4, fontStyle:"italic" }}>« {m.commentaire} »</div>
                )}
              </div>
            ))}
          </div>
        )}
      </>)}

      {/* Zones douleurs */}
      {card(<>
        {cardTitle("Zones douloureuses")}
        {blessuresCount.length === 0 ? (
          <div style={{ color:"#22c55e", fontSize:13 }}>✓ Aucun signal significatif</div>
        ) : blessuresCount.map(([z,n]) => (
          <div key={z} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #0a1520" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:ZC[z]||"#64748b" }} />
              <span style={{ color:"#94b8d0", fontSize:12 }}>{z}</span>
            </div>
            <span style={{ color:ZC[z]||"#64748b", fontWeight:700, fontSize:12 }}>{n}x</span>
          </div>
        ))}
      </>)}

      {/* Recommandations */}
      {card(<>
        {cardTitle("Recommandations")}
        {recommendations.map((r,i) => (
          <div key={i} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom: i<recommendations.length-1?"1px solid #0a1520":"none" }}>
            <span style={{ fontSize:18 }}>{r.icon}</span>
            <div>
              <div style={{ color:"#e2f4ff", fontWeight:700, fontSize:12, marginBottom:2 }}>{r.title}</div>
              <div style={{ color:"#4a6480", fontSize:11 }}>{r.text}</div>
            </div>
          </div>
        ))}
      </>)}
    </div>
  );
}
