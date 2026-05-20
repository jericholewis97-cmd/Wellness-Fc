import { useState, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell, ReferenceLine, Legend
} from "recharts";

// ─── CONSTANTES ───────────────────────────────────────────
const RISK_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e", none: "#475569" };
const ZONE_COLORS = {
  "Ischios": "#f97316", "Mollets": "#06b6d4", "Quadriceps": "#8b5cf6",
  "Fessiers": "#ec4899", "Adducteurs": "#84cc16", "Abducteurs": "#f59e0b",
  "Tronc": "#64748b", "Aucune": "#1e293b", "Aucunes Blessures": "#1e293b",
};

const norm10 = (v, max) => v ? Math.round((v / max) * 10) : 0;

function computeRisk(entries) {
  if (!entries.length) return null;
  const last = entries[entries.length - 1];
  const mx = last.type === "match" ? 5 : 7;
  return ((norm10(last.fatigue, mx) + norm10(last.stress, mx) + norm10(last.douleurs, mx) + (10 - norm10(last.sommeil, mx))) / 4).toFixed(1);
}

const riskLevel = s => !s ? "none" : s >= 6 ? "high" : s >= 4 ? "medium" : "low";

function filterByPeriod(entries, period) {
  const now = new Date();
  const cutoff = new Date();
  if (period === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (period === "quarter") cutoff.setMonth(now.getMonth() - 3);
  return entries.filter(e => new Date(e.date) >= cutoff);
}

// ─── PDF GENERATOR ────────────────────────────────────────
function generatePDF(player, stats, period, avgTeam) {
  const periodLabel = period === "month" ? "Mensuel" : period === "quarter" ? "Trimestriel" : "Saison complète";
  const now = new Date().toLocaleDateString("fr-FR");
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Fiche ${player.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; }
  .page { width: 210mm; min-height: 297mm; padding: 16mm 14mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1F4E79; padding-bottom: 12px; margin-bottom: 16px; }
  .player-name { font-size: 26px; font-weight: 900; color: #1F4E79; letter-spacing: -0.5px; }
  .player-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
  .badge { background: #EBF3FA; color: #1F4E79; border: 1px solid #BDD7EE; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 700; display: inline-block; margin: 2px; }
  .badge-risk-high { background: #FEF2F2; color: #ef4444; border-color: #FECACA; }
  .badge-risk-medium { background: #FFFBEB; color: #f59e0b; border-color: #FDE68A; }
  .badge-risk-low { background: #F0FDF4; color: #22c55e; border-color: #BBF7D0; }
  .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .kpi { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; text-align: center; }
  .kpi-val { font-size: 28px; font-weight: 900; color: #1F4E79; }
  .kpi-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 12px; font-weight: 800; color: #1F4E79; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #EBF3FA; padding-bottom: 6px; margin-bottom: 10px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .metric-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F1F5F9; }
  .metric-label { color: #475569; font-size: 12px; }
  .metric-bar { flex: 1; margin: 0 10px; height: 6px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
  .metric-fill { height: 100%; border-radius: 99px; }
  .metric-val { font-weight: 700; font-size: 12px; color: #1a1a2e; width: 30px; text-align: right; }
  .injury-item { display: flex; justify-content: space-between; padding: 6px 10px; background: #FFF7ED; border-left: 3px solid #f59e0b; border-radius: 4px; margin-bottom: 6px; }
  .alert-item { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; background: #FEF2F2; border-left: 3px solid #ef4444; border-radius: 4px; margin-bottom: 6px; }
  .rec-item { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; background: #F0FDF4; border-left: 3px solid #22c55e; border-radius: 4px; margin-bottom: 6px; }
  .rec-icon { font-size: 16px; }
  .compare-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
  .compare-you { color: #1F4E79; font-weight: 700; }
  .compare-team { color: #94a3b8; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div>
    <div class="player-name">⚽ ${player.name}</div>
    <div class="player-sub">Rapport ${periodLabel} · Généré le ${now}</div>
    <div style="margin-top:8px">
      <span class="badge badge-risk-${riskLevel(stats.score)}">${riskLevel(stats.score) === "high" ? "⚠ Risque élevé" : riskLevel(stats.score) === "medium" ? "~ Surveiller" : "✓ Forme OK"} · Score ${stats.score || "—"}/10</span>
      <span class="badge">${stats.entries.length} saisies sur la période</span>
    </div>
  </div>
  <div style="text-align:right">
    <div style="font-size:11px;color:#94a3b8">Wellness FC</div>
    <div style="font-size:11px;color:#94a3b8">Suivi individuel saison 2025-26</div>
  </div>
</div>

<div class="kpi-row">
  <div class="kpi"><div class="kpi-val" style="color:#38bdf8">${stats.totalMin}'</div><div class="kpi-label">Minutes jouées</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#f97316">${stats.totalButs}</div><div class="kpi-label">Buts</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#a78bfa">${stats.totalPasses}</div><div class="kpi-label">Passes déc.</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#22c55e">${stats.matchesJoues}</div><div class="kpi-label">Matchs joués</div></div>
</div>

<div class="grid-2">
  <div>
    <div class="section">
      <div class="section-title">Moyennes wellness (période)</div>
      ${[
        ["Fatigue", stats.avgFatigue, "#ef4444"],
        ["Sommeil", stats.avgSommeil, "#38bdf8"],
        ["Stress", stats.avgStress, "#f59e0b"],
        ["Douleurs", stats.avgDouleurs, "#a78bfa"],
      ].map(([label, val, color]) => `
        <div class="metric-row">
          <span class="metric-label">${label}</span>
          <div class="metric-bar"><div class="metric-fill" style="width:${val * 10}%;background:${color}"></div></div>
          <span class="metric-val">${val}/10</span>
        </div>`).join("")}
    </div>

    <div class="section">
      <div class="section-title">Comparaison équipe</div>
      ${[
        ["Fatigue", stats.avgFatigue, avgTeam.fatigue],
        ["Sommeil", stats.avgSommeil, avgTeam.sommeil],
        ["Stress", stats.avgStress, avgTeam.stress],
        ["Douleurs", stats.avgDouleurs, avgTeam.douleurs],
      ].map(([label, you, team]) => `
        <div class="compare-row">
          <span class="metric-label">${label}</span>
          <span class="compare-you">${you}/10</span>
          <span style="color:#e2e8f0;margin:0 6px">vs</span>
          <span class="compare-team">Équipe: ${team}/10</span>
          <span style="margin-left:6px;font-size:11px">${you > team ? "↑" : you < team ? "↓" : "="}</span>
        </div>`).join("")}
    </div>
  </div>

  <div>
    <div class="section">
      <div class="section-title">Zones douloureuses récurrentes</div>
      ${stats.blessures.length === 0
        ? `<div style="color:#22c55e;padding:8px">✓ Aucun signal significatif sur la période</div>`
        : stats.blessuresCount.map(([zone, count]) => `
          <div class="injury-item">
            <span style="color:#92400e;font-weight:600">${zone}</span>
            <span style="color:#b45309">${count}x signalée</span>
          </div>`).join("")}
    </div>

    <div class="section">
      <div class="section-title">Alertes & signaux</div>
      ${stats.alerts.length === 0
        ? `<div style="color:#22c55e;padding:8px">✓ Aucune alerte sur la période</div>`
        : stats.alerts.map(a => `
          <div class="alert-item">
            <span>⚠</span>
            <span>${a}</span>
          </div>`).join("")}
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Recommandations personnalisées</div>
  <div class="grid-2">
    ${stats.recommendations.map(r => `
      <div class="rec-item">
        <span class="rec-icon">${r.icon}</span>
        <div><strong>${r.title}</strong><br><span style="color:#475569">${r.text}</span></div>
      </div>`).join("")}
  </div>
</div>

<div class="footer">
  <span>Wellness FC · Suivi individuel joueurs</span>
  <span>Document confidentiel · Usage interne staff</span>
  <span>${now}</span>
</div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────
export default function PlayerReport({ player, allEntries, allTempsJeu, onBack }) {
  const [period, setPeriod] = useState("month");

  const entries = useMemo(() =>
    filterByPeriod(allEntries.filter(e => e.joueur === player.name).sort((a, b) => a.date.localeCompare(b.date)), period),
    [allEntries, player, period]
  );

  const allPlayerEntries = allEntries.filter(e => e.joueur === player.name).sort((a, b) => a.date.localeCompare(b.date));
  const ptList = useMemo(() => filterByPeriod(allTempsJeu.filter(t => t.joueur === player.name), period), [allTempsJeu, player, period]);

  const score = computeRisk(entries);
  const level = riskLevel(score);

  const avg = (arr, key, maxFn) => arr.length ? +(arr.reduce((s, e) => s + norm10(e[key], maxFn(e)), 0) / arr.length).toFixed(1) : 0;
  const maxOf = (e) => e.type === "match" ? 5 : 7;

  const avgFatigue  = avg(entries, "fatigue", maxOf);
  const avgSommeil  = avg(entries, "sommeil", maxOf);
  const avgStress   = avg(entries, "stress",  maxOf);
  const avgDouleurs = avg(entries, "douleurs", maxOf);
  const avgRpe      = entries.filter(e => e.rpe).length ? +(entries.filter(e=>e.rpe).reduce((s,e)=>s+e.rpe,0)/entries.filter(e=>e.rpe).length).toFixed(1) : null;

  const totalMin    = ptList.reduce((s, t) => s + t.minutes, 0);
  const totalButs   = ptList.reduce((s, t) => s + t.buts, 0);
  const totalPasses = ptList.reduce((s, t) => s + t.passes, 0);
  const matchesJoues = ptList.length;

  // Blessures récurrentes
  const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:4) && e.localisation && !["Aucune","Aucunes Blessures"].includes(e.localisation));
  const blessuresMap = {};
  blessures.forEach(b => { blessuresMap[b.localisation] = (blessuresMap[b.localisation] || 0) + 1; });
  const blessuresCount = Object.entries(blessuresMap).sort((a, b) => b[1] - a[1]);

  // Alertes
  const alerts = [];
  if (avgFatigue >= 7) alerts.push("Fatigue chronique détectée — repos recommandé");
  if (avgSommeil <= 4) alerts.push("Qualité du sommeil insuffisante sur la période");
  if (avgStress >= 7)  alerts.push("Niveau de stress élevé — entretien recommandé");
  if (blessuresCount.length >= 2) alerts.push(`Douleurs récurrentes : ${blessuresCount.map(b=>b[0]).join(", ")}`);
  const parlerStaff = entries.filter(e => e.parlerStaff === "Oui");
  if (parlerStaff.length > 0) alerts.push(`A demandé à parler au staff (${parlerStaff.length}x)`);

  // Recommandations automatiques
  const recommendations = [];
  if (avgFatigue >= 6) recommendations.push({ icon: "😴", title: "Récupération", text: "Intégrer une séance de récupération active par semaine." });
  if (avgSommeil <= 5) recommendations.push({ icon: "🌙", title: "Sommeil", text: "Protocole de sommeil : coucher régulier, pas d'écran 1h avant." });
  if (avgStress >= 6)  recommendations.push({ icon: "🧘", title: "Gestion du stress", text: "Séances de cohérence cardiaque ou relaxation avant match." });
  if (blessuresCount.length > 0) recommendations.push({ icon: "🏥", title: "Prévention blessures", text: `Renforcement spécifique zone : ${blessuresCount[0][0]}.` });
  if (totalMin < 180 && matchesJoues > 0) recommendations.push({ icon: "⚽", title: "Temps de jeu", text: "Charge de match faible — surveiller la motivation et l'implication." });
  if (recommendations.length === 0) recommendations.push({ icon: "✅", title: "Bonne forme", text: "Tous les indicateurs sont dans les normes. Continuer ainsi !" });

  // Moyennes équipe
  const teamEntries = filterByPeriod(allEntries, period);
  const avgTeam = {
    fatigue:  avg(teamEntries, "fatigue", maxOf),
    sommeil:  avg(teamEntries, "sommeil", maxOf),
    stress:   avg(teamEntries, "stress",  maxOf),
    douleurs: avg(teamEntries, "douleurs", maxOf),
  };

  // Trend data
  const trend = entries.slice(-10).map(e => {
    const mx = maxOf(e);
    return {
      date: e.date.slice(5),
      Fatigue: norm10(e.fatigue, mx),
      Sommeil: norm10(e.sommeil, mx),
      Stress:  norm10(e.stress,  mx),
      Douleurs:norm10(e.douleurs,mx),
      type: e.type,
    };
  });

  // Radar
  const radarData = [
    { m: "Énergie",   vous: 10 - avgFatigue,  équipe: 10 - avgTeam.fatigue },
    { m: "Sommeil",   vous: avgSommeil,        équipe: avgTeam.sommeil },
    { m: "Sérénité",  vous: 10 - avgStress,    équipe: 10 - avgTeam.stress },
    { m: "Santé",     vous: 10 - avgDouleurs,  équipe: 10 - avgTeam.douleurs },
  ];

  const stats = { entries, score, avgFatigue, avgSommeil, avgStress, avgDouleurs, totalMin, totalButs, totalPasses, matchesJoues, blessures, blessuresCount, alerts, recommendations };

  const periodLabel = { month: "Dernier mois", quarter: "3 derniers mois", season: "Toute la saison" };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#c8dff0" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #1a2f45", borderRadius: 8, color: "#4a6480", padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
          ← Retour
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(periodLabel).map(([k, v]) => (
            <button key={k} onClick={() => setPeriod(k)}
              style={{ background: period === k ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "#0d1b2a", border: `1px solid ${period===k?"transparent":"#1a2f45"}`, borderRadius: 8, color: period===k?"#fff":"#4a6480", padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              {v}
            </button>
          ))}
          <button onClick={() => generatePDF(player, stats, period, avgTeam)}
            style={{ background: "linear-gradient(135deg,#10b981,#0ea5e9)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            📄 Exporter PDF
          </button>
        </div>
      </div>

      {/* CARTE JOUEUR */}
      <div style={{ background: "linear-gradient(135deg,#0d1b2a,#0a2540)", border: `1px solid ${RISK_COLOR[level]}44`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${RISK_COLOR[level]}15`, border: `3px solid ${RISK_COLOR[level]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: RISK_COLOR[level] }}>
            {player.num}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#e2f4ff", marginBottom: 6 }}>{player.name}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ background: `${RISK_COLOR[level]}22`, color: RISK_COLOR[level], border: `1px solid ${RISK_COLOR[level]}44`, borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                {level === "high" ? "⚠ Risque élevé" : level === "medium" ? "~ Surveiller" : "✓ Forme OK"} · {score || "—"}/10
              </span>
              <span style={{ background: "#1a2f45", color: "#4a6480", borderRadius: 99, padding: "2px 10px", fontSize: 12 }}>
                {entries.length} saisies · {periodLabel[period]}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[["⏱", totalMin+"'", "Minutes"], ["⚽", totalButs, "Buts"], ["🅰", totalPasses, "Passes D."], ["🏟", matchesJoues, "Matchs"]].map(([icon, val, label]) => (
              <div key={label} style={{ background: "#0d1b2a", border: "1px solid #1a2f45", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#38bdf8" }}>{val}</div>
                <div style={{ fontSize: 10, color: "#2d5070", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ background: "#110000", border: "1px solid #7f1d1d", borderRadius: 12, padding: "12px 18px", marginBottom: 16 }}>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>⚠ ALERTES & SIGNAUX</div>
          {alerts.map((a, i) => (
            <div key={i} style={{ color: "#fca5a5", fontSize: 13, padding: "4px 0", borderBottom: i < alerts.length-1 ? "1px solid #2d0a0a" : "none" }}>
              → {a}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Radar comparaison */}
        <div style={{ background: "#0d1b2a", border: "1px solid #1a2f45", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#2d5070", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Radar vs Équipe</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a2f45" />
                <PolarAngleAxis dataKey="m" tick={{ fill: "#4a6480", fontSize: 11 }} />
                <Radar dataKey="vous" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} strokeWidth={2} name="Vous" />
                <Radar dataKey="équipe" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 2" name="Équipe" />
                <Legend wrapperStyle={{ fontSize: 11, color: "#4a6480" }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: "#2d4a63", fontSize: 13, padding: 20 }}>Pas assez de données</div>}
        </div>

        {/* Moyennes + comparaison */}
        <div style={{ background: "#0d1b2a", border: "1px solid #1a2f45", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#2d5070", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Moyennes vs Équipe</div>
          {[
            ["Fatigue", avgFatigue, avgTeam.fatigue, "#ef4444"],
            ["Sommeil", avgSommeil, avgTeam.sommeil, "#38bdf8"],
            ["Stress",  avgStress,  avgTeam.stress,  "#f59e0b"],
            ["Douleurs",avgDouleurs,avgTeam.douleurs,"#a78bfa"],
          ].map(([label, you, team, color]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#4a6480", fontSize: 12 }}>{label}</span>
                <span style={{ fontSize: 12 }}>
                  <span style={{ color, fontWeight: 700 }}>{you}</span>
                  <span style={{ color: "#1e3a52" }}> / éq.{team}</span>
                  <span style={{ marginLeft: 4 }}>{you > team ? "↑" : you < team ? "↓" : "="}</span>
                </span>
              </div>
              <div style={{ position: "relative", height: 6, background: "#0a1520", borderRadius: 99, overflow: "visible" }}>
                <div style={{ width: `${you * 10}%`, height: "100%", background: color, borderRadius: 99, opacity: 0.9 }} />
                <div style={{ position: "absolute", top: 0, left: `${team * 10}%`, width: 2, height: "100%", background: "#f59e0b", borderRadius: 1 }} />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 2, background: "#38bdf8" }} />
              <span style={{ color: "#2d5070", fontSize: 10 }}>Joueur</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 2, height: 10, background: "#f59e0b" }} />
              <span style={{ color: "#2d5070", fontSize: 10 }}>Équipe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Courbe évolution */}
      {trend.length > 1 && (
        <div style={{ background: "#0d1b2a", border: "1px solid #1a2f45", borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ color: "#2d5070", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
            Évolution wellness — {periodLabel[period]}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <XAxis dataKey="date" tick={{ fill: "#2d4a63", fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#2d4a63", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0a1520", border: "1px solid #1a2f45", borderRadius: 8, color: "#e2f4ff", fontSize: 11 }} />
              <ReferenceLine y={7} stroke="#ef444422" strokeDasharray="4 4" />
              <Line dataKey="Fatigue"  stroke="#ef4444" dot={false} strokeWidth={2} />
              <Line dataKey="Sommeil"  stroke="#38bdf8" dot={false} strokeWidth={2} />
              <Line dataKey="Stress"   stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
              <Line dataKey="Douleurs" stroke="#a78bfa" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            {[["Fatigue","#ef4444"],["Sommeil","#38bdf8"],["Stress","#f59e0b"],["Douleurs","#a78bfa"]].map(([l,c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 16, height: 2, background: c }} />
                <span style={{ color: "#2d4a63", fontSize: 11 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Zones douleurs */}
        <div style={{ background: "#0d1b2a", border: "1px solid #1a2f45", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#2d5070", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Zones douloureuses récurrentes</div>
          {blessuresCount.length === 0 ? (
            <div style={{ color: "#22c55e", fontSize: 13 }}>✓ Aucun signal significatif</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={blessuresCount.map(([z, n]) => ({ zone: z, count: n }))}>
                  <XAxis dataKey="zone" tick={{ fill: "#4a6480", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#4a6480", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0a1520", border: "none", borderRadius: 8, color: "#e2f4ff", fontSize: 11 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {blessuresCount.map(([z], i) => <Cell key={i} fill={ZONE_COLORS[z] || "#64748b"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {blessuresCount.map(([z, n]) => (
                <div key={z} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0a1520" }}>
                  <span style={{ color: "#94b8d0", fontSize: 12 }}>{z}</span>
                  <span style={{ color: ZONE_COLORS[z] || "#64748b", fontWeight: 700, fontSize: 12 }}>{n}x signalée</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Recommandations */}
        <div style={{ background: "#0d1b2a", border: "1px solid #1a2f45", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#2d5070", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Recommandations personnalisées</div>
          {recommendations.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < recommendations.length-1 ? "1px solid #0a1520" : "none" }}>
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <div>
                <div style={{ color: "#e2f4ff", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{r.title}</div>
                <div style={{ color: "#4a6480", fontSize: 12 }}>{r.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
