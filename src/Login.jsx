import { useState } from "react";
import { supabase } from "./supabase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Email ou mot de passe incorrect.");
    } else {
      onLogin(data.user);
    }
    setLoading(false);
  };

  const PINK = "#ec4899";

  return (
    <div style={{ minHeight:"100vh", background:"#060e18", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, background:`linear-gradient(135deg,${PINK},#8b5cf6)`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>⚽</div>
          <div style={{ color:"#e2f4ff", fontSize:22, fontWeight:900 }}>Wellness FC</div>
          <div style={{ color:"#4a6480", fontSize:13, marginTop:4 }}>Équipe Féminine — Saison 2026/27</div>
        </div>
        <div style={{ background:"#0d1b2a", border:"1px solid #1a2f45", borderRadius:16, padding:32 }}>
          <div style={{ color:"#e2f4ff", fontSize:16, fontWeight:700, marginBottom:24, textAlign:"center" }}>Accès Staff</div>
          <div style={{ marginBottom:16 }}>
            <label style={{ color:"#4a6480", fontSize:12, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:8 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="votre@email.com"
              style={{ width:"100%", background:"#060e18", border:"1px solid #1a2f45", borderRadius:8, color:"#c8dff0", padding:"12px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ color:"#4a6480", fontSize:12, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:8 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••"
              style={{ width:"100%", background:"#060e18", border:"1px solid #1a2f45", borderRadius:8, color:"#c8dff0", padding:"12px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          {error && (
            <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"#fca5a5", fontSize:13 }}>
              ⚠ {error}
            </div>
          )}
          <button onClick={handleLogin} disabled={loading}
            style={{ width:"100%", background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:10, color:"#fff", padding:"14px", cursor:"pointer", fontWeight:700, fontSize:15, fontFamily:"inherit" }}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <div style={{ color:"#2d4a63", fontSize:11, textAlign:"center", marginTop:20 }}>
            Accès réservé au staff technique et médical
          </div>
        </div>
      </div>
    </div>
  );
}