// ─────────────────────────────────────────────────────────────────
// LOGIN PAGE — Chỉ đăng nhập, không đăng ký
// ─────────────────────────────────────────────────────────────────
function LoginPage({ accessDenied }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Vui lòng nhập đầy đủ thông tin"); return; }
    setLoading(true); setError("");
    try {
      await window.auth.signInWithEmailAndPassword(email, password);
      // Auth state + whitelist check handled in App
    } catch(e) {
      const msgs = {
        "auth/user-not-found": "Tài khoản không tồn tại",
        "auth/wrong-password": "Mật khẩu không đúng",
        "auth/invalid-email": "Email không hợp lệ",
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng",
        "auth/too-many-requests": "Quá nhiều lần thử, vui lòng thử lại sau",
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:40,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(79,127,255,0.15)"}}>

        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="images/logo2.png" alt="Logo" style={{maxWidth:200,height:"auto",marginBottom:12}} onError={e=>e.target.style.display="none"} />
          <div style={{fontSize:22,fontWeight:800,color:"#1f2937"}}>EduManagement</div>
          <div style={{fontSize:14,color:"#9ca3af",marginTop:6}}>Đăng nhập để tiếp tục</div>
        </div>

        {accessDenied && (
          <div style={{color:"#ef4444",fontSize:13,marginBottom:16,padding:"10px 14px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",textAlign:"center"}}>
            🚫 Tài khoản này chưa được cấp quyền truy cập.<br/>Vui lòng liên hệ quản trị viên.
          </div>
        )}

        <div style={{marginBottom:14}}>
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="example@gmail.com"
            value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus />
        </div>

        <div style={{marginBottom:16}}>
          <label className="form-label">Mật khẩu</label>
          <div style={{position:"relative"}}>
            <input className="form-input" type={showPwd?"text":"password"} placeholder="••••••••"
              value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{paddingRight:44}} />
            <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{
              position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:18,padding:0
            }}>{showPwd ? "🙈" : "👁️"}</button>
          </div>
        </div>

        {error && (
          <div style={{color:"#ef4444",fontSize:13,marginBottom:14,padding:"8px 12px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca"}}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          width:"100%",height:48,border:"none",borderRadius:10,fontSize:15,fontWeight:700,
          cursor:loading?"wait":"pointer",background:"linear-gradient(135deg,#4f7fff,#2563eb)",
          color:"#fff",opacity:loading?0.7:1,transition:"opacity 0.2s"
        }}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#9ca3af"}}>
          Liên hệ quản trị viên để được cấp tài khoản
        </div>
      </div>
    </div>
  );
}