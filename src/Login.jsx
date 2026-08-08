import { useState } from "react";

const STAFF_ACCOUNTS = [
  { email: "playerformtrack@gmail.com", password: "WellnessFC2026!" },
  { email: "aminaberisa25@gmail.com", password: "WellnessFC2026!" },
  { email: "twertz1998@gmail.com", password: "WellnessFC2026!" },
  { email: "parriauxangel.pro@hotmail.com", password: "WellnessFC2026!" },
];

const STORAGE_KEY = "wellnessfc_user";

// Icônes oeil (SVG inline, pas de dépendance externe)
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 1 13s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handleLogin = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const account = STAFF_ACCOUNTS.find(
      a => a.email.toLowerCase() === cleanEmail && a.password === cleanPassword
    );
    if (account) {
      setError("");
      const userData = { email: account.email };

      if (rememberMe) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        } catch (e) {
          console.error("Impossible de sauvegarder la session:", e);
        }
      } else {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      }

      onLogin(userData);
    } else {
      setError("Email ou mot de passe incorrect.");
    }
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
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleLogin()}
              placeholder="votre@email.com"
              autoCapitalize="none"
              autoCorrect="off"
              style={{ width:"100%", background:"#060e18", border:"1px solid #1a2f45", borderRadius:8, color:"#c8dff0", padding:"12px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }}
            />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ color:"#4a6480", fontSize:12, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:8 }}>Mot de passe</label>
            <div style={{ position:"relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleLogin()}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect="off"
                style={{ width:"100%", background:"#060e18", border:"1px solid #1a2f45", borderRadius:8, color:"#c8dff0", padding:"12px 44px 12px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{
                  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", padding:4, cursor:"pointer",
                  color:"#4a6480", display:"flex", alignItems:"center"
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div
            onClick={() => setRememberMe(v => !v)}
            style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, cursor:"pointer", userSelect:"none" }}
          >
            <div style={{
              width:18, height:18, borderRadius:5, flexShrink:0,
              background: rememberMe ? PINK : "#060e18",
              border: `1px solid ${rememberMe ? PINK : "#1a2f45"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"background 0.15s, border-color 0.15s"
            }}>
              {rememberMe && <CheckIcon />}
            </div>
            <span style={{ color:"#8ba4bd", fontSize:13 }}>Se souvenir de moi sur cet appareil</span>
          </div>

          {error && <div style={{ background:"#110000", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"#fca5a5", fontSize:13 }}>⚠ {error}</div>}

          <button onClick={handleLogin}
            style={{ width:"100%", background:`linear-gradient(135deg,${PINK},#8b5cf6)`, border:"none", borderRadius:10, color:"#fff", padding:"14px", cursor:"pointer", fontWeight:700, fontSize:15, fontFamily:"inherit" }}>
            Se connecter
          </button>
          <div style={{ color:"#2d4a63", fontSize:11, textAlign:"center", marginTop:20 }}>Accès réservé au staff technique et médical</div>
        </div>
      </div>
    </div>
  );
}
