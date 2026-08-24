import { useState, useEffect, useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import PlayerReport from './PlayerReport';
import Login from "./Login";
import Matches from "./Matches";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrZx9S7XA7_qiGKs1Wd8rK1vExSaVXOrO6ojohJlsTMl1CCWdeaZ2Y1S6EIUeM5SGEeQ/exec";

const PLAYERS = [
  "Afonso Kiara","Agushi Liza","Barbosa da Silva Neto Giovanna Maria",
  "Beatriz Fidalgo","Berisha Anea","Chassagnot Kyméa","De Moraes Salles Meirelles Da Cunha Ariel",
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
// Score de risque d'une seule entrée (même formule que computeRisk, réutilisée
// pour calculer une tendance personnelle par joueuse, pas juste un score absolu).
const scoreOfEntry = (e) => {
  const max = e.type === "match" ? 5 : 10;
  return (norm10(e.fatigue,max) + norm10(e.stress,max) + norm10(e.douleurs,max) + (10 - norm10(e.sommeil,max))) / 4;
};
// Compare la dernière réponse d'une joueuse à SA PROPRE moyenne habituelle
// (plutôt qu'à un seuil fixe identique pour tout le monde) : "up" = se dégrade
// par rapport à d'habitude, "down" = s'améliore, "stable" = rien de notable.
function computeTrend(entries) {
  if (entries.length < 2) return "stable";
  const scores = entries.map(scoreOfEntry);
  const last = scores[scores.length - 1];
  const prior = scores.slice(0, -1);
  const priorAvg = prior.reduce((s,v) => s+v, 0) / prior.length;
  const delta = last - priorAvg;
  if (delta >= 1) return "up";
  if (delta <= -1) return "down";
  return "stable";
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

// Petite flèche indiquant si une joueuse se dégrade/s'améliore par rapport
// à SA PROPRE moyenne habituelle (pas un seuil identique pour tout le monde).
const TrendBadge = ({ trend }) => {
  if (trend === "up") return <span title="Se dégrade par rapport à sa moyenne habituelle" style={{ color:"#ef4444", fontSize:11, marginLeft:4 }}>▲</span>;
  if (trend === "down") return <span title="S'améliore par rapport à sa moyenne habituelle" style={{ color:"#22c55e", fontSize:11, marginLeft:4 }}>▼</span>;
  return null;
};

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

// ---------- Rapport d'équipe (PDF, agrégé sur toutes les joueuses) ----------

// Moyenne du groupe, jour par jour, pour tracer une courbe d'évolution collective.
function aggregateTeamByDay(entries) {
  const map = {};
  entries.forEach(e => {
    if (!map[e.date]) map[e.date] = { date: e.date, n: 0, fatigue: 0, sommeil: 0, stress: 0, douleurs: 0 };
    const mx = e.type === "match" ? 5 : 10;
    map[e.date].fatigue += norm10(e.fatigue, mx);
    map[e.date].sommeil += norm10(e.sommeil, mx);
    map[e.date].stress += norm10(e.stress, mx);
    map[e.date].douleurs += norm10(e.douleurs, mx);
    map[e.date].n += 1;
  });
  return Object.values(map)
    .map(d => ({
      date: d.date,
      fatigue: +(d.fatigue / d.n).toFixed(1),
      sommeil: +(d.sommeil / d.n).toFixed(1),
      stress: +(d.stress / d.n).toFixed(1),
      douleurs: +(d.douleurs / d.n).toFixed(1),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Courbe SVG intégrée dans le PDF, tracée sur la moyenne quotidienne du groupe.
function buildTeamTrendSvg(dailyAgg) {
  if (!dailyAgg.length) {
    return `<div class="section"><div class="section-title">Évolution du groupe</div><div style="color:#9ca3af;font-size:12px">Aucune donnée sur cette période</div></div>`;
  }
  const w = 700, h = 160, padL = 24, padR = 10, padT = 10, padB = 22;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const n = dailyAgg.length;
  const xFor = i => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = v => padT + innerH - (v / 10) * innerH;
  const metrics = [
    { key: "fatigue", color: "#ef4444", label: "Fatigue" },
    { key: "sommeil", color: "#38bdf8", label: "Sommeil" },
    { key: "stress", color: "#f59e0b", label: "Stress" },
    { key: "douleurs", color: "#7c3aed", label: "Douleurs" },
  ];
  const gridLines = [0, 5, 10].map(v =>
    `<line x1="${padL}" y1="${yFor(v)}" x2="${w - padR}" y2="${yFor(v)}" stroke="#f3d4e4" stroke-width="1"/>
     <text x="0" y="${yFor(v) + 3}" font-size="8" fill="#9ca3af">${v}</text>`
  ).join("");
  const polylines = metrics.map(m => {
    const coords = dailyAgg.map((d, i) => ({ x: xFor(i), y: yFor(d[m.key]) }));
    const pts = coords.map(c => `${c.x},${c.y}`).join(" ");
    const line = n > 1 ? `<polyline points="${pts}" fill="none" stroke="${m.color}" stroke-width="2"/>` : "";
    const dots = coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="2.5" fill="${m.color}"/>`).join("");
    return line + dots;
  }).join("");
  const xLabels = dailyAgg.map((d, i) =>
    `<text x="${xFor(i)}" y="${h - 4}" font-size="8" fill="#9ca3af" text-anchor="middle">${d.date.slice(5).split("-").reverse().join("/")}</text>`
  ).join("");
  const legend = metrics.map(m =>
    `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:9px;color:#6b7280">
       <span style="display:inline-block;width:10px;height:2px;background:${m.color}"></span>${m.label}
     </span>`
  ).join("");
  return `<div class="section" style="page-break-inside:avoid">
    <div class="section-title">Évolution du groupe (moyenne quotidienne, ${n} jour${n > 1 ? "s" : ""})</div>
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px">${gridLines}${polylines}${xLabels}</svg>
    <div style="margin-top:4px">${legend}</div>
  </div>`;
}

function generateTeamPDF({ label, dateRangeLabel, playerStats, entriesInRange, tempsJeuInRange, typeFilterLabel }) {
  const now = new Date().toLocaleDateString("fr-FR");
  const dailyAgg = aggregateTeamByDay(entriesInRange);

  const avg = (key, maxFn) => entriesInRange.length
    ? +(entriesInRange.reduce((s, e) => s + norm10(e[key], maxFn(e)), 0) / entriesInRange.length).toFixed(1)
    : "—";
  const maxOf = e => e.type === "match" ? 5 : 10;
  const teamFatigue = avg("fatigue", maxOf);
  const teamSommeil = avg("sommeil", maxOf);
  const teamStress = avg("stress", maxOf);
  const teamDouleurs = avg("douleurs", maxOf);

  const joueusesActives = [...new Set(entriesInRange.map(e => e.joueur))];
  const alertesHigh = playerStats.filter(p => p.level === "high" && p.entries.some(e => entriesInRange.includes(e)));

  const blessures = entriesInRange
    .filter(e => e.douleurs >= (e.type === "match" ? 3 : 6) && e.localisation && e.localisation !== "Aucune")
    .sort((a, b) => b.date.localeCompare(a.date));

  const participation = {};
  tempsJeuInRange.forEach(t => {
    if (!(t.minutes > 0)) return;
    if (!participation[t.joueur]) participation[t.joueur] = { minutes: 0, matchs: 0, titulaire: 0 };
    participation[t.joueur].minutes += t.minutes;
    participation[t.joueur].matchs += 1;
    if (t.titulaire === "Titulaire") participation[t.joueur].titulaire += 1;
  });
  const participationList = Object.entries(participation).sort((a, b) => b[1].minutes - a[1].minutes);

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Rapport d'équipe — ${label}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#1a1a2e;font-size:13px}
.page{width:210mm;min-height:297mm;padding:16mm 14mm}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #ec4899;padding-bottom:12px;margin-bottom:16px}
.name{font-size:22px;font-weight:900;color:#831843}
.sub{font-size:12px;color:#6b7280;margin-top:4px}
.badge{background:#fce7f3;color:#9d174d;border:1px solid #f9a8d4;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;display:inline-block;margin:2px}
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
.kpi{background:#fdf2f8;border:1px solid #f9a8d4;border-radius:10px;padding:10px;text-align:center}
.kv{font-size:22px;font-weight:900;color:#9d174d}
.kl{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.section{margin-bottom:14px}
.section-title{font-size:11px;font-weight:800;color:#831843;text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid #fce7f3;padding-bottom:5px;margin-bottom:8px}
.metric-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #fce7f3}
table{width:100%;border-collapse:collapse;font-size:10px}
th{padding:5px 6px;text-align:left;color:#9d174d;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f9a8d4}
td{padding:5px 6px;border-bottom:1px solid #fce7f3}
.footer{margin-top:16px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:10px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="page">

<div class="header">
  <div>
    <div class="name">⚽ Rapport d'équipe — ${label}</div>
    <div class="sub">${dateRangeLabel}${typeFilterLabel ? " · " + typeFilterLabel : ""} · Généré le ${now}</div>
    <div style="margin-top:6px">
      <span class="badge">${joueusesActives.length}/${playerStats.length} joueuses actives</span>
      <span class="badge" style="background:${alertesHigh.length > 0 ? "#fee2e2" : "#dcfce7"};color:${alertesHigh.length > 0 ? "#b91c1c" : "#16a34a"};border-color:${alertesHigh.length > 0 ? "#fecaca" : "#bbf7d0"}">
        ${alertesHigh.length > 0 ? `⚠ ${alertesHigh.length} à risque élevé` : "✓ Aucune alerte"}
      </span>
    </div>
  </div>
  <div style="text-align:right;font-size:11px;color:#9ca3af"><div>Wellness FC — Féminin</div><div>Saison 2026/27</div></div>
</div>

<div class="kpis">
  <div class="kpi"><div class="kv" style="color:#ef4444">${teamFatigue}/10</div><div class="kl">Fatigue moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#38bdf8">${teamSommeil}/10</div><div class="kl">Sommeil moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#f59e0b">${teamStress}/10</div><div class="kl">Stress moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#7c3aed">${teamDouleurs}/10</div><div class="kl">Douleurs moy.</div></div>
  <div class="kpi"><div class="kv" style="color:#9d174d">${entriesInRange.length}</div><div class="kl">Réponses reçues</div></div>
</div>

${buildTeamTrendSvg(dailyAgg)}

<div class="section">
  <div class="section-title">⚠ Joueuses à risque élevé</div>
  ${alertesHigh.length === 0
    ? `<div style="color:#16a34a;font-size:12px">✓ Aucune joueuse à risque élevé sur cette période</div>`
    : alertesHigh.map(p => `<div class="metric-row"><span>${p.name}</span><span style="color:#b91c1c;font-weight:700">${p.score}/10</span></div>`).join("")}
</div>

<div class="section">
  <div class="section-title">🏥 Blessures déclarées durant la période (${blessures.length})</div>
  ${blessures.length === 0
    ? `<div style="color:#16a34a;font-size:12px">✓ Aucune blessure significative déclarée</div>`
    : blessures.map(b => `<div class="metric-row"><span>${b.date.split("-").reverse().join("/")} — ${b.joueur} — ${b.localisation}</span><span style="color:#b91c1c;font-weight:700">${b.douleurs}/${b.type==="match"?5:10}</span></div>`).join("")}
</div>

${participationList.length > 0 ? `
<div class="section">
  <div class="section-title">🏆 Participation matchs sur la période</div>
  <table>
    <thead><tr><th>Joueuse</th><th>Matchs</th><th>Minutes</th><th>Titulaire</th></tr></thead>
    <tbody>
      ${participationList.map(([nom, d]) => `<tr><td>${nom}</td><td>${d.matchs}</td><td>${d.minutes}'</td><td>${d.titulaire}x</td></tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

<div class="section" style="page-break-inside:avoid">
  <div class="section-title">📋 Détail par joueuse (dernière réponse de la période)</div>
  <table>
    <thead><tr><th>Joueuse</th><th>Type</th><th>Fatigue</th><th>Sommeil</th><th>Stress</th><th>Douleurs</th><th>Zone</th><th>Score</th></tr></thead>
    <tbody>
      ${playerStats
        .map(p => ({ p, last: [...p.entries].reverse().find(e => entriesInRange.includes(e)) }))
        .filter(x => x.last)
        .map(({ p, last }) => {
          const mx = last.type === "match" ? 5 : 10;
          return `<tr>
            <td>${p.name}</td>
            <td>${last.type === "match" ? "🏆" : "🏃"}</td>
            <td>${norm10(last.fatigue,mx)}/10</td>
            <td>${norm10(last.sommeil,mx)}/10</td>
            <td>${norm10(last.stress,mx)}/10</td>
            <td style="color:${last.douleurs >= (last.type==="match"?3:6) ? "#b91c1c" : "#1a1a2e"}">${norm10(last.douleurs,mx)}/10</td>
            <td>${last.localisation && last.localisation !== "Aucune" ? last.localisation : "—"}</td>
            <td style="font-weight:800;color:${RC[p.level]}">${p.score || "—"}</td>
          </tr>`;
        }).join("")}
    </tbody>
  </table>
</div>

<div class="footer">
  <span>Wellness FC — Rapport d'équipe</span>
  <span>Document confidentiel — Usage interne staff</span>
  <span>${now}</span>
</div>
</div></body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ---------- Alertes train (export calendrier .ics) ----------

const JOURS_TRAIN = [
  { key: "heureTrainLundi",    label: "Lundi",    iso: 1, rrule: "MO" },
  { key: "heureTrainMardi",    label: "Mardi",    iso: 2, rrule: "TU" },
  { key: "heureTrainMercredi", label: "Mercredi", iso: 3, rrule: "WE" },
  { key: "heureTrainJeudi",    label: "Jeudi",    iso: 4, rrule: "TH" },
];

// Extrait une heure du type "20h33" ou "18h33 - 19h06" (prend la première trouvée)
// depuis un texte libre ; renvoie null si aucune heure claire n'est repérable
// (ex: "x" ou vide).
function parseHeureTrain(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(\d{1,2})[h:](\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

// Prochaine date (à partir d'aujourd'hui) correspondant à un jour ISO donné (1=Lundi..4=Jeudi)
function prochaineOccurrence(isoDay) {
  const d = new Date();
  const diff = (isoDay - (d.getDay() === 0 ? 7 : d.getDay()) + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

const pad2 = n => String(n).padStart(2, "0");

// Échappe les caractères spéciaux requis par la norme iCalendar (RFC 5545)
// dans les champs texte (virgules, points-virgules, retours à la ligne).
const escapeICS = s => String(s).replace(/\\/g,"\\\\").replace(/,/g,"\\,").replace(/;/g,"\\;").replace(/\n/g,"\\n");

// Génère un fichier .ics avec un événement hebdomadaire récurrent par joueuse/jour
// de train, avec une alerte native 15 min avant — à importer une fois dans le
// calendrier du téléphone (Google Calendar, Apple Calendar...) pour des rappels
// fiables même app fermée.
function genererICSTrain(profils, minutesAvant) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wellness FC//Alertes Train//FR", "CALSCALE:GREGORIAN"];
  let count = 0;
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth()+1)}${pad2(now.getUTCDate())}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  profils.forEach(p => {
    JOURS_TRAIN.forEach(j => {
      const heure = parseHeureTrain(p[j.key]);
      if (!heure) return;
      const date = prochaineOccurrence(j.iso);
      date.setHours(heure.h, heure.m, 0, 0);
      const dtStart = `${date.getFullYear()}${pad2(date.getMonth()+1)}${pad2(date.getDate())}T${pad2(heure.h)}${pad2(heure.m)}00`;
      const dtEnd = `${date.getFullYear()}${pad2(date.getMonth()+1)}${pad2(date.getDate())}T${pad2(heure.h)}${pad2(Math.min(heure.m+5,59))}00`;
      count++;
      lines.push(
        "BEGIN:VEVENT",
        `UID:train-${p.joueur.replace(/\s+/g,"")}-${j.label}@wellnessfc`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${j.rrule}`,
        `SUMMARY:🚆 Départ train — ${escapeICS(p.joueur)}`,
        `DESCRIPTION:${escapeICS(p.joueur + " doit partir vers " + p[j.key] + " (" + j.label + ")")}`,
        "BEGIN:VALARM",
        `TRIGGER:-PT${minutesAvant}M`,
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeICS("🚆 " + p.joueur + " — train dans " + minutesAvant + " min")}`,
        "END:VALARM",
        "END:VEVENT"
      );
    });
  });

  lines.push("END:VCALENDAR");
  return { ics: lines.join("\r\n"), count };
}

function telechargerICS(profils, minutesAvant) {
  const { ics, count } = genererICSTrain(profils, minutesAvant);
  if (count === 0) {
    alert("Aucun horaire de train reconnu dans les profils (colonnes Lundi à Jeudi vides ou illisibles).");
    return;
  }
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wellness-fc-alertes-train.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function PlayerCardMobile({ p, onClick, typeFilter }) {
  const isM = p.lastE?.type === "match";
  const mx = isM ? 5 : 10;
  const showBoth = typeFilter === "all";
  const hasAny = showBoth ? (p.lastEntrainement || p.lastMatch) : p.lastE;
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
        {hasAny ? (
          showBoth ? (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {p.lastEntrainement && (
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontSize:9, opacity:0.6, width:12 }}>🏃</span>
                  <div style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
                    <Bar2 value={norm10(p.lastEntrainement.fatigue,10)} max={10} color="#ef4444" />
                    <Bar2 value={norm10(p.lastEntrainement.sommeil,10)} max={10} color="#38bdf8" />
                  </div>
                </div>
              )}
              {p.lastMatch && (
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontSize:9, opacity:0.6, width:12 }}>🏆</span>
                  <div style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
                    <Bar2 value={norm10(p.lastMatch.fatigue,5)} max={10} color="#ef4444" />
                    <Bar2 value={norm10(p.lastMatch.sommeil,5)} max={10} color="#38bdf8" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <Bar2 value={norm10(p.lastE.fatigue,mx)} max={10} color="#ef4444" />
              <Bar2 value={norm10(p.lastE.sommeil,mx)} max={10} color="#38bdf8" />
            </div>
          )
        ) : <div style={{ color:"#1e3a52", fontSize:11 }}>Aucune saisie</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ color:RC[p.level], fontWeight:800, fontSize:18 }}>{p.score||"—"}<TrendBadge trend={p.trend} /></div>
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  const [entrainement, setEntrainement] = useState(DEMO_E);
  const [matchData, setMatchData] = useState(DEMO_M);
  const [tempsJeu, setTempsJeu] = useState([]);
  const [profils, setProfils] = useState([]);
  const [savingMatch, setSavingMatch] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "entrainement" | "match"
  const [reportPeriod, setReportPeriod] = useState("week"); // "day" | "week"

  // IMPORTANT : tous les hooks (useMemo, useEffect, useState) doivent être
  // appelés AVANT tout "return" conditionnel, sinon React perd le fil
  // (règle des Hooks) et plante avec l'erreur #310 / page blanche.
  const allEntries = useMemo(
    () => [...entrainement, ...matchData].sort((a, b) => a.date.localeCompare(b.date)),
    [entrainement, matchData]
  );

  // Entrées filtrées selon l'onglet Tout/Entraînement/Match sélectionné : sert de
  // base à toutes les moyennes et scores du tableau de bord, pour ne jamais
  // mélanger les barèmes entraînement (/10) et match (/5) dans un même calcul.
  const scopedEntries = useMemo(
    () => typeFilter === "all" ? allEntries : allEntries.filter(e => e.type === typeFilter),
    [allEntries, typeFilter]
  );

  const playerStats = useMemo(() => PLAYERS.map(p => {
    const entries = scopedEntries.filter(e => e.joueur === p.name).sort((a,b) => a.date.localeCompare(b.date));
    const score = computeRisk(entries);
    const level = riskLevel(score);
    const trend = computeTrend(entries);
    const lastE = entries[entries.length-1];
    // Toujours calculés à partir de TOUTES les entrées (indépendamment du filtre Tout/
    // Entraînement/Match), pour pouvoir afficher les deux barres séparément dans le
    // listing quand "Tout" est sélectionné, plutôt qu'une seule ligne ambiguë.
    const allPlayerEntries = allEntries.filter(e => e.joueur === p.name).sort((a,b) => a.date.localeCompare(b.date));
    const lastEntrainement = [...allPlayerEntries].reverse().find(e => e.type === "entrainement");
    const lastMatch = [...allPlayerEntries].reverse().find(e => e.type === "match");
    const blessures = entries.filter(e => e.douleurs >= (e.type==="match"?3:6) && e.localisation && !["Aucune"].includes(e.localisation));
    const enPeriode = entries.filter(e => e.enPeriode === "Oui").length > 0 && lastE?.enPeriode === "Oui";
    return { ...p, entries, score, level, trend, lastE, lastEntrainement, lastMatch, blessures, enPeriode,
      parlerStaff: entries.filter(e => e.parlerStaff === "Oui").length,
    };
  }), [scopedEntries, allEntries]);

  const loadData = async () => {
    setLoading(true);
    try {
      // On ajoute un paramètre unique (timestamp) et cache:"no-store" pour empêcher
      // le navigateur ou un cache intermédiaire de servir une ancienne réponse figée
      // au lieu des données réellement à jour du Google Sheet.
      const res = await fetch(`${APPS_SCRIPT_URL}?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      // On applique toujours ce que renvoie le Sheet, même si c'est vide
      // (sinon les lignes supprimées dans le Sheet restent affichées dans l'app)
      setEntrainement(data.entrainement || []);
      setMatchData(data.match || []);
      setTempsJeu(data.tempsJeu || []);
      setProfils(data.profils || []);
      setIsDemo(false);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Charge automatiquement les vraies données dès la connexion (ou la reconnexion
  // automatique via "se souvenir de moi"), sans attendre un clic manuel sur Actualiser.
  useEffect(() => {
    if (user) {
      loadData().finally(() => setInitialLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Si pas connecté → page login (placé APRÈS tous les hooks)
  if (!user) return <Login onLogin={setUser} />;

  // Tant que le tout premier chargement n'est pas terminé, on affiche un écran
  // de chargement plutôt que le dashboard avec les données de démo (évite le
  // "flash" de la démo avant que les vraies données arrivent).
  if (initialLoading) {
    return (
      <div style={{ minHeight:"100vh", background:"#060e18", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚽</div>
          <div style={{ color:"#4a6480", fontSize:13 }}>Chargement des données...</div>
        </div>
      </div>
    );
  }

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
    setInitialLoading(true);
  };

  const alerts = playerStats.filter(p => p.level === "high");
  const staffCalls = playerStats.filter(p => p.parlerStaff > 0);
  const enPeriodeCount = playerStats.filter(p => p.enPeriode).length;

  // Joueuses n'ayant rien répondu depuis 7 jours : le taux de réponse conditionne
  // la fiabilité de tous les autres indicateurs, donc on le met en évidence.
  const NON_REPONSE_JOURS = 7;
  const nonRepondantesCutoff = new Date();
  nonRepondantesCutoff.setDate(nonRepondantesCutoff.getDate() - NON_REPONSE_JOURS);
  const nonRepondantesCutoffISO = nonRepondantesCutoff.toISOString().slice(0, 10);
  const nonRepondantes = playerStats.filter(p => !p.entries.some(e => e.date >= nonRepondantesCutoffISO));

  // Départs train du jour (si on est Lundi-Jeudi), triés par heure croissante —
  // utile à consulter directement sur le téléphone pendant la séance.
  const jourActuelISO = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const jourTrainAujourdhui = JOURS_TRAIN.find(j => j.iso === jourActuelISO);
  const departsTrainAujourdhui = jourTrainAujourdhui
    ? profils
        .map(p => ({ nom: p.joueur, heureTxt: p[jourTrainAujourdhui.key], heure: parseHeureTrain(p[jourTrainAujourdhui.key]) }))
        .filter(d => d.heure)
        .sort((a, b) => (a.heure.h*60+a.heure.m) - (b.heure.h*60+b.heure.m))
    : [];

  const avgFatigue = scopedEntries.length ? (scopedEntries.reduce((s,e) => {
    const mx = e.type==="match" ? 5 : 10;
    return s + norm10(e.fatigue, mx);
  }, 0) / scopedEntries.length).toFixed(1) : "—";

  const filtered = playerStats.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Affiche une seule barre (filtre Entraînement/Match actif) ou deux barres
  // superposées 🏃/🏆 (filtre "Tout") pour ne jamais mélanger les deux barèmes.
  const renderMetric = (p, key, color) => {
    if (typeFilter === "all") {
      if (!p.lastEntrainement && !p.lastMatch) return <span style={{ color:"#1e3a52" }}>—</span>;
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {p.lastEntrainement && (
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:9, opacity:0.6 }}>🏃</span>
              <Bar2 value={norm10(p.lastEntrainement[key],10)} max={10} color={color} />
            </div>
          )}
          {p.lastMatch && (
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:9, opacity:0.6 }}>🏆</span>
              <Bar2 value={norm10(p.lastMatch[key],5)} max={10} color={color} />
            </div>
          )}
        </div>
      );
    }
    if (!p.lastE) return <span style={{ color:"#1e3a52" }}>—</span>;
    const mx = p.lastE.type === "match" ? 5 : 10;
    return <Bar2 value={norm10(p.lastE[key], mx)} max={10} color={color} />;
  };

  // Plage de dates du rapport d'équipe (Aujourd'hui / Cette semaine)
  const handleGenerateTeamReport = () => {
    const today = new Date();
    const start = new Date(today);
    if (reportPeriod === "week") start.setDate(today.getDate() - 6);
    const startISO = start.toISOString().slice(0, 10);
    const endISO = today.toISOString().slice(0, 10);

    const entriesInRange = scopedEntries.filter(e => e.date >= startISO && e.date <= endISO);
    const tempsJeuInRange = tempsJeu.filter(t => t.date >= startISO && t.date <= endISO);

    const fmt = d => d.split("-").reverse().join("/");
    const dateRangeLabel = reportPeriod === "day" ? `Journée du ${fmt(endISO)}` : `Semaine du ${fmt(startISO)} au ${fmt(endISO)}`;
    const typeFilterLabel = typeFilter === "entrainement" ? "Entraînements uniquement" : typeFilter === "match" ? "Matchs uniquement" : "";

    generateTeamPDF({
      label: reportPeriod === "day" ? "Rapport journalier" : "Rapport hebdomadaire",
      dateRangeLabel,
      playerStats,
      entriesInRange,
      tempsJeuInRange,
      typeFilterLabel,
    });
  };

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
          <PlayerReport player={selected} allEntries={allEntries} allTempsJeu={tempsJeu} profil={profils.find(p => p.joueur === selected.name)} onBack={() => setSelected(null)} isMobile={isMobile} />
        )}

        {!selected && (tab === "dashboard" || tab === "players") && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: isMobile ? 12 : 16, flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[["all","Tout"],["entrainement","🏃 Entraînement"],["match","🏆 Match"]].map(([k,v]) => (
                <button key={k} onClick={() => setTypeFilter(k)}
                  style={{ background: typeFilter===k ? "#0d1b2a" : "transparent", border:`1px solid ${typeFilter===k?PINK:BORDER}`, borderRadius:8, color: typeFilter===k?PINK:"#4a6480", padding:"7px 14px", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                  {v}
                </button>
              ))}
            </div>
            {tab === "dashboard" && (
              <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                {[["day","Jour"],["week","Semaine"]].map(([k,v]) => (
                  <button key={k} onClick={() => setReportPeriod(k)}
                    style={{ background: reportPeriod===k ? "#0d1b2a" : "transparent", border:`1px solid ${reportPeriod===k?"#38bdf8":BORDER}`, borderRadius:8, color: reportPeriod===k?"#38bdf8":"#4a6480", padding:"7px 12px", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                    {v}
                  </button>
                ))}
                <button onClick={handleGenerateTeamReport}
                  style={{ background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:8, color:"#fff", padding:"7px 14px", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                  📄 Rapport d'équipe
                </button>
              </div>
            )}
          </div>
        )}

        {!selected && tab === "dashboard" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 8 : 12, marginBottom: isMobile ? 12 : 20 }}>
              <KPI label="Effectif" value={PLAYERS.length} color={PINK} icon="👥" mobile={isMobile} />
              <KPI label="Alertes" value={alerts.length} color={alerts.length>0?"#ef4444":"#22c55e"} icon="⚠" mobile={isMobile} />
              <KPI label="Fatigue moy." value={avgFatigue} color="#f59e0b" icon="📈" mobile={isMobile} />
              <KPI label="En période 🌸" value={enPeriodeCount} color={PINK} icon="🌸" mobile={isMobile} />
            </div>

            <div style={{ background:"#0d1420", border:"1px solid #2d4a63", borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom: departsTrainAujourdhui.length ? 8 : 0 }}>
                <div style={{ color:"#38bdf8", fontWeight:700, fontSize:12 }}>
                  🚆 DÉPARTS TRAIN {jourTrainAujourdhui ? `— AUJOURD'HUI (${jourTrainAujourdhui.label})` : ""}
                </div>
                <button
                  onClick={() => telechargerICS(profils, 15)}
                  style={{ background:"#38bdf8", border:"none", borderRadius:8, color:"#06212f", padding:"6px 12px", cursor:"pointer", fontWeight:700, fontSize:11 }}>
                  📅 Exporter alertes calendrier
                </button>
              </div>
              {jourTrainAujourdhui ? (
                departsTrainAujourdhui.length > 0 ? (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {departsTrainAujourdhui.map((d,i) => (
                      <div key={i} style={{ background:"#0a1520", border:"1px solid #2d4a63", borderRadius:8, padding:"5px 12px", color:"#94d2f0", fontWeight:600, fontSize:12 }}>
                        {isMobile ? d.nom.split(" ")[0] : d.nom} · {d.heureTxt}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color:"#2d5070", fontSize:11 }}>Aucun horaire de train renseigné pour aujourd'hui.</div>
                )
              ) : (
                <div style={{ color:"#2d5070", fontSize:11 }}>Pas de trains renseignés le week-end.</div>
              )}
            </div>

            {nonRepondantes.length > 0 && (
              <div style={{ background:"#0d1420", border:`1px solid #2d4a63`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:6 }}>
                  <div style={{ color:"#7fa8c9", fontWeight:700, fontSize:12 }}>
                    🔇 AUCUNE RÉPONSE DEPUIS {NON_REPONSE_JOURS}+ JOURS ({nonRepondantes.length})
                  </div>
                  <button
                    onClick={() => {
                      const noms = nonRepondantes.map(p => `• ${p.name}`).join("\n");
                      const message = `⚠️ Rappel Wellness FC 🌸\n\nMerci de remplir votre questionnaire si ce n'est pas déjà fait, c'est important pour votre suivi !\n\nEn attente de réponse :\n${noms}\n\nMerci 🙏`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                    }}
                    style={{ background:"#25D366", border:"none", borderRadius:8, color:"#0a1a0f", padding:"6px 12px", cursor:"pointer", fontWeight:700, fontSize:11, display:"flex", alignItems:"center", gap:5 }}>
                    📲 Rappel WhatsApp
                  </button>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {nonRepondantes.map(p => (
                    <div key={p.id} onClick={() => setSelected(p)}
                      style={{ background:"#0a1520", border:"1px solid #2d4a63", borderRadius:8, padding:"5px 12px", cursor:"pointer", color:"#7fa8c9", fontWeight:600, fontSize:12 }}>
                      {isMobile ? p.name.split(" ")[0] : p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <PlayerCardMobile p={p} onClick={setSelected} typeFilter={typeFilter} />
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
                        const hasAny = typeFilter === "all" ? (p.lastEntrainement || p.lastMatch) : p.lastE;
                        return (
                          <tr key={p.id} onClick={() => setSelected(p)} style={{ borderTop:`1px solid ${BORDER}`, cursor:"pointer" }}
                            onMouseEnter={e => e.currentTarget.style.background="#0a1520"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"11px 14px", whiteSpace:"nowrap" }}>
                              <RiskDot level={p.level} />
                              <span style={{ color:"#c8dff0", fontWeight:600, fontSize:13 }}>{p.name}</span>
                              {p.parlerStaff > 0 && <span style={{ marginLeft:5 }}>💬</span>}
                            </td>
                            {hasAny ? (
                              <>
                                <td style={{ padding:"11px 14px", minWidth:80 }}>{renderMetric(p, "fatigue", "#ef4444")}</td>
                                <td style={{ padding:"11px 14px", minWidth:80 }}>{renderMetric(p, "sommeil", "#38bdf8")}</td>
                                <td style={{ padding:"11px 14px", minWidth:80 }}>{renderMetric(p, "stress", "#f59e0b")}</td>
                                <td style={{ padding:"11px 14px", minWidth:80 }}>{renderMetric(p, "douleurs", "#a78bfa")}</td>
                                <td style={{ padding:"11px 14px" }}>
                                  {p.lastE?.localisation && p.lastE.localisation !== "Aucune"
                                    ? <Pill label={p.lastE.localisation} color={ZC[p.lastE.localisation]||"#64748b"} />
                                    : <span style={{ color:"#1e3a52" }}>—</span>}
                                </td>
                                <td style={{ padding:"11px 14px", textAlign:"center" }}>
                                  {p.enPeriode ? <span>🌸</span> : <span style={{ color:"#1e3a52" }}>—</span>}
                                </td>
                                <td style={{ padding:"11px 14px", color:RC[p.level], fontWeight:800 }}>{p.score}<TrendBadge trend={p.trend} /></td>
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
              {filtered.map(p => <PlayerCardMobile key={p.id} p={p} onClick={setSelected} typeFilter={typeFilter} />)}
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
