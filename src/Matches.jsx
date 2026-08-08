import { useState, useMemo } from "react";

const PINK = "#ec4899";
const CARD = "#0d1b2a";
const BORDER = "#1a2f45";

const todayISO = () => new Date().toISOString().slice(0, 10);

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// Clé unique d'un match = date + adversaire
const keyOf = (date, adversaire) => `${date}|${(adversaire || "").trim()}`;

export default function Matches({ players, matchWellness = [], tempsJeu = [], onSave, saving, isMobile }) {
  const [editing, setEditing] = useState(null); // { date, adversaire } ou null
  const [draft, setDraft] = useState({}); // { [playerName]: { minutes, commentaire } }
  const [newDate, setNewDate] = useState(todayISO());
  const [newAdversaire, setNewAdversaire] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Liste des matchs = union des dates issues du formulaire "Match J+1" (adversaire inconnu)
  // et des sessions déjà saisies dans TempsJeu (qui ont un adversaire)
  const sessions = useMemo(() => {
    const map = new Map();

    tempsJeu.forEach(t => {
      const k = keyOf(t.date, t.adversaire);
      if (!map.has(k)) map.set(k, { date: t.date, adversaire: t.adversaire || "", minutesTotal: 0, joueusesSaisies: 0 });
      const s = map.get(k);
      if ((t.minutes || 0) > 0) { s.minutesTotal += t.minutes; s.joueusesSaisies += 1; }
    });

    matchWellness.forEach(w => {
      // Rattache aux sessions déjà connues pour cette date si elles existent, sinon crée une session "adversaire inconnu"
      const existing = [...map.keys()].find(k => k.startsWith(w.date + "|"));
      if (!existing) {
        const k = keyOf(w.date, "");
        if (!map.has(k)) map.set(k, { date: w.date, adversaire: "", minutesTotal: 0, joueusesSaisies: 0 });
      }
    });

    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [matchWellness, tempsJeu]);

  // Stats de participation globales, pour le tableau récapitulatif
  const participation = useMemo(() => {
    return players.map(p => {
      const entries = tempsJeu.filter(t => t.joueur === p.name && (t.minutes || 0) > 0);
      const totalMinutes = entries.reduce((s, e) => s + (e.minutes || 0), 0);
      const matchsJoues = entries.length;
      return {
        ...p,
        matchsJoues,
        totalMinutes,
        moyenne: matchsJoues ? Math.round(totalMinutes / matchsJoues) : 0,
      };
    }).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [players, tempsJeu]);

  const openEdit = (date, adversaire) => {
    const d = {};
    players.forEach(p => {
      const existing = tempsJeu.find(t => t.date === date && (t.adversaire || "") === (adversaire || "") && t.joueur === p.name);
      d[p.name] = { minutes: existing?.minutes || 0, commentaire: existing?.commentaire || "" };
    });
    setDraft(d);
    setEditing({ date, adversaire: adversaire || "" });
    setSaveError("");
  };

  const startNewMatch = () => {
    if (!newDate) return;
    openEdit(newDate, newAdversaire);
    setShowNewForm(false);
  };

  const updateDraft = (name, field, value) => {
    setDraft(d => ({ ...d, [name]: { ...d[name], [field]: value } }));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaveError("");
    const entries = players.map(p => ({
      date: editing.date,
      adversaire: editing.adversaire,
      joueur: p.name,
      minutes: Number(draft[p.name]?.minutes) || 0,
      commentaire: draft[p.name]?.commentaire || "",
    }));
    try {
      await onSave(entries);
      setEditing(null);
    } catch (e) {
      setSaveError("Échec de l'enregistrement — vérifiez votre connexion et réessayez.");
    }
  };

  // ---------- Vue édition d'un match ----------
  if (editing) {
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <button onClick={() => setEditing(null)}
            style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:8, color:"#4a6480", padding:"6px 14px", cursor:"pointer", fontSize:12 }}>
            ← Retour aux matchs
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:8, color:"#fff", padding:"8px 18px", cursor:"pointer", fontWeight:700, fontSize:13, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>

        <div style={{ background:"linear-gradient(135deg,#0d1b2a,#1a0018)", border:`1px solid ${PINK}44`, borderRadius:14, padding:"16px 20px", marginBottom:14 }}>
          <div style={{ color:"#e2f4ff", fontWeight:800, fontSize:18 }}>
            {editing.adversaire ? `vs ${editing.adversaire}` : "Match"}
          </div>
          <div style={{ color:"#4a6480", fontSize:12, marginTop:2 }}>{fmtDate(editing.date)}</div>
        </div>

        {saveError && (
          <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 14px", marginBottom:14, color:"#fca5a5", fontSize:13 }}>
            ⚠ {saveError}
          </div>
        )}

        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #0a1520" }}>
            <span style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>
              Temps de jeu &amp; commentaires par joueuse
            </span>
          </div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {players.map((p, i) => (
              <div key={p.id} style={{ padding: isMobile ? "10px 14px" : "10px 16px", borderTop: i>0 ? "1px solid #0a1520" : "none", display:"flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 12, alignItems: isMobile ? "stretch" : "center" }}>
                <div style={{ flex: isMobile ? "none" : "0 0 220px", color:"#c8dff0", fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {p.name}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input
                    type="number" min="0" max="130"
                    value={draft[p.name]?.minutes ?? 0}
                    onChange={e => updateDraft(p.name, "minutes", e.target.value)}
                    style={{ width:64, background:"#060e18", border:`1px solid ${BORDER}`, borderRadius:8, color:"#c8dff0", padding:"7px 8px", fontSize:13, outline:"none" }}
                  />
                  <span style={{ color:"#2d5070", fontSize:11 }}>min</span>
                </div>
                <input
                  type="text"
                  placeholder="Commentaire staff (optionnel)"
                  value={draft[p.name]?.commentaire ?? ""}
                  onChange={e => updateDraft(p.name, "commentaire", e.target.value)}
                  style={{ flex:1, background:"#060e18", border:`1px solid ${BORDER}`, borderRadius:8, color:"#c8dff0", padding:"7px 10px", fontSize:12, outline:"none", minWidth:0 }}
                />
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width:"100%", marginTop:14, background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:10, color:"#fff", padding:"14px", cursor:"pointer", fontWeight:700, fontSize:14, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Enregistrement..." : "💾 Enregistrer ce match"}
        </button>
      </div>
    );
  }

  // ---------- Vue liste des matchs ----------
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <span style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Matchs</span>
        <button onClick={() => setShowNewForm(v => !v)}
          style={{ background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:8, color:"#fff", padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:12 }}>
          + Nouveau match
        </button>
      </div>

      {showNewForm && (
        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:16, marginBottom:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
          <div>
            <label style={{ color:"#4a6480", fontSize:11, fontWeight:600, display:"block", marginBottom:5 }}>Date</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              style={{ background:"#060e18", border:`1px solid ${BORDER}`, borderRadius:8, color:"#c8dff0", padding:"8px 10px", fontSize:13, outline:"none" }} />
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <label style={{ color:"#4a6480", fontSize:11, fontWeight:600, display:"block", marginBottom:5 }}>Adversaire</label>
            <input type="text" value={newAdversaire} onChange={e => setNewAdversaire(e.target.value)} placeholder="Ex: FC Renens"
              style={{ width:"100%", background:"#060e18", border:`1px solid ${BORDER}`, borderRadius:8, color:"#c8dff0", padding:"8px 10px", fontSize:13, outline:"none", boxSizing:"border-box" }} />
          </div>
          <button onClick={startNewMatch}
            style={{ background:PINK, border:"none", borderRadius:8, color:"#fff", padding:"9px 18px", cursor:"pointer", fontWeight:700, fontSize:13 }}>
            Créer
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div style={{ color:"#2d5070", textAlign:"center", padding:60, fontSize:14 }}>
          Aucun match enregistré pour le moment.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {sessions.map(s => (
            <div key={keyOf(s.date, s.adversaire)} onClick={() => openEdit(s.date, s.adversaire)}
              style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"14px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
              <div>
                <div style={{ color:"#e2f4ff", fontWeight:700, fontSize:14 }}>
                  {s.adversaire ? `vs ${s.adversaire}` : "Adversaire non renseigné"}
                </div>
                <div style={{ color:"#4a6480", fontSize:12, marginTop:2 }}>{fmtDate(s.date)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:PINK, fontWeight:800, fontSize:16 }}>{s.joueusesSaisies}/{players.length}</div>
                <div style={{ color:"#2d5070", fontSize:10 }}>joueuses saisies</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid #0a1520" }}>
          <span style={{ color:"#2d5070", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>
            📊 Statistiques de participation
          </span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#080f1a" }}>
                {["Joueuse","Matchs joués","Minutes totales","Moy. min/match"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", color:"#1e3a52", fontSize:10, fontWeight:700, textAlign:"left", whiteSpace:"nowrap", letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participation.map(p => (
                <tr key={p.id} style={{ borderTop:`1px solid ${BORDER}` }}>
                  <td style={{ padding:"10px 14px", color:"#c8dff0", fontWeight:600, fontSize:13, whiteSpace:"nowrap" }}>{p.name}</td>
                  <td style={{ padding:"10px 14px", color:"#94b8d0", fontSize:13 }}>{p.matchsJoues}</td>
                  <td style={{ padding:"10px 14px", color:"#38bdf8", fontWeight:700, fontSize:13 }}>{p.totalMinutes}'</td>
                  <td style={{ padding:"10px 14px", color:"#4a6480", fontSize:13 }}>{p.moyenne ? `${p.moyenne}'` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
