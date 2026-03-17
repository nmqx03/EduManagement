// ─────────────────────────────────────────────────────────────────
// ADMIN PAGE — Quản lý tài khoản
// ─────────────────────────────────────────────────────────────────

function AdminPage({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form thêm tài khoản
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Xác thực mật khẩu admin để xem password user
  const [revealId, setRevealId] = useState(null);
  const [adminPwdInput, setAdminPwdInput] = useState("");
  const [adminPwdError, setAdminPwdError] = useState("");
  const [adminPwdVerifying, setAdminPwdVerifying] = useState(false);
  const [revealedIds, setRevealedIds] = useState({}); // {email: true} đã unlock
  const [adminVerified, setAdminVerified] = useState(false); // đã xác minh trong session

  const isAdmin = user && user.email && user.email.toLowerCase() === SUPER_ADMIN;
  const ACCOUNTS_PER_PAGE = 20;
  const [accPage, setAccPage] = useState(1);

  useEffect(() => {
    if (!isAdmin) return;
    loadAllowedEmails().then(list => { setAccounts(list); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    const em = newEmail.trim().toLowerCase();
    const pw = newPassword.trim();
    if (!em || !pw) { setFormError("Vui lòng nhập đầy đủ email và mật khẩu"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setFormError("Email không hợp lệ"); return; }
    if (pw.length < 6) { setFormError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (accounts.find(a => a.email === em)) { setFormError("Email này đã tồn tại trong danh sách"); return; }

    setAdding(true); setFormError(""); setFormSuccess("");
    try {
      const result = await adminCreateUser(em, pw);
      const uid = result.localId;
      const idToken = result.idToken;
      await addUserAccount(em, pw, user.email, uid, idToken);
      const newAcc = { email: em, pwd: obfuscate(pw), uid, addedBy: user.email, addedAt: new Date().toISOString() };
      setAccounts(prev => [...prev, newAcc]);
      setNewEmail(""); setNewPassword("");
      setFormSuccess(`✅ Đã tạo tài khoản ${em}`);
      setTimeout(() => setFormSuccess(""), 4000);
    } catch(e) {
      const msgs = {
        "EMAIL_EXISTS": "Email này đã có tài khoản Firebase — hãy dùng email khác",
        "INVALID_EMAIL": "Email không hợp lệ",
      };
      setFormError(msgs[e.message] || "Lỗi: " + e.message);
    }
    setAdding(false);
  };

  const handleRemove = async (acc) => {
    if (acc.email === SUPER_ADMIN) { alert("Không thể xóa tài khoản admin chính!"); return; }
    if (!confirm(`Xóa hoàn toàn tài khoản ${acc.email}?\nTài khoản sẽ bị xóa khỏi Firebase.`)) return;

    try {
      // Xóa khỏi allowedEmails (Firestore)
      await removeAllowedEmail(acc.email);

      // Nếu có uid → dùng Firebase Admin REST để xóa Auth user
      // Cách: đăng nhập lại bằng email/pwd để lấy idToken mới rồi xóa
      if (acc.uid && acc.pwd) {
        try {
          const apiKey = "AIzaSyApsLv_N7Je30jz6CRxKX8PmsHyEY5Z4h0";
          // Sign in để lấy fresh idToken
          const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: acc.email, password: deobfuscate(acc.pwd), returnSecureToken: true })
          });
          const signInData = await signInRes.json();
          if (signInData.idToken) {
            // Xóa user bằng idToken của chính user đó
            await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: signInData.idToken })
            });
          }
        } catch(e2) {
          console.warn("Could not delete Firebase Auth user:", e2);
        }
      }

      setAccounts(prev => prev.filter(a => a.email !== acc.email));
      setRevealedIds(prev => { const n = {...prev}; delete n[acc.email]; return n; });
      setFormSuccess(`✅ Đã xóa tài khoản ${acc.email}`);
      setTimeout(() => setFormSuccess(""), 3000);
    } catch(e) {
      setFormError("Lỗi khi xóa: " + e.message);
    }
  };

  const handleRevealRequest = (email) => {
    if (adminVerified) {
      // Đã xác minh trong session này → unlock thẳng
      setRevealedIds(prev => ({...prev, [email]: true}));
      return;
    }
    setRevealId(email); setAdminPwdInput(""); setAdminPwdError("");
  };

  const handleAdminPwdSubmit = async () => {
    if (!adminPwdInput) { setAdminPwdError("Vui lòng nhập mật khẩu"); return; }
    setAdminPwdVerifying(true); setAdminPwdError("");
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, adminPwdInput);
      await window.auth.currentUser.reauthenticateWithCredential(credential);
      setAdminVerified(true);
      setRevealedIds(prev => ({...prev, [revealId]: true}));
      setRevealId(null); setAdminPwdInput("");
    } catch(e) {
      setAdminPwdError("Mật khẩu không đúng");
    }
    setAdminPwdVerifying(false);
  };

  if (!isAdmin) return (
    <div className="page-content">
      <div style={{textAlign:"center",padding:80}}>
        <div style={{fontSize:48,marginBottom:16}}>🚫</div>
        <div style={{fontSize:18,fontWeight:700,color:"#ef4444"}}>Không có quyền truy cập</div>
        <div style={{color:"#9ca3af",marginTop:8}}>Chỉ quản trị viên mới có thể xem trang này</div>
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-topbar">
        <div className="page-topbar-title">🔐 Quản Lý Tài Khoản</div>
      </div>

      <div style={{maxWidth:620,margin:"0 auto",padding:"0 32px"}}>

        {/* Form thêm tài khoản */}
        <div className="form-card">
          <h3>Thêm tài khoản mới</h3>
          <p style={{color:"#6b7280",fontSize:14,marginBottom:16}}>Tài khoản được tạo ở đây mới có thể đăng nhập vào hệ thống.</p>

          <div style={{marginBottom:12}}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="email@example.com"
              value={newEmail} onChange={e=>{setNewEmail(e.target.value);setFormError("");}} />
          </div>

          <div style={{marginBottom:16}}>
            <label className="form-label">Mật khẩu</label>
            <div style={{position:"relative"}}>
              <input className="form-input" type={showNewPwd?"text":"password"} placeholder="Tối thiểu 6 ký tự"
                value={newPassword} onChange={e=>{setNewPassword(e.target.value);setFormError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleAdd()}
                style={{paddingRight:44}} />
              <button type="button" onClick={()=>setShowNewPwd(v=>!v)} style={{
                position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:18,padding:0
              }}>{showNewPwd?"🙈":"👁️"}</button>
            </div>
          </div>

          {formError && <div style={{color:"#ef4444",fontSize:13,marginBottom:10,padding:"7px 12px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca"}}>⚠️ {formError}</div>}
          {formSuccess && <div style={{fontSize:13,marginBottom:10,padding:"7px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}>{formSuccess}</div>}

          <button className="btn-save" style={{width:"100%",height:44,fontSize:14}} onClick={handleAdd} disabled={adding}>
            {adding ? "⏳ Đang tạo tài khoản..." : "+ Thêm tài khoản"}
          </button>
        </div>

        {/* Danh sách tài khoản */}
        <div className="form-card">
          <h3>Danh sách tài khoản ({loading ? "..." : accounts.length + 1})</h3>
          <p style={{color:"#6b7280",fontSize:13,marginBottom:16}}>Nhấn 👁️ để xem mật khẩu — cần nhập mã xác nhận.</p>

          {/* Super admin */}
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #eff6ff"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1f2937"}}>{SUPER_ADMIN}</div>
              <div style={{fontSize:12,color:"#9ca3af"}}>Super Admin</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,fontFamily:"monospace",background:"#f3f4f6",padding:"3px 10px",borderRadius:6,color:"#6b7280",letterSpacing:2}}>••••••••</span>
              <span style={{fontSize:12,background:"#eff6ff",color:"#4f7fff",padding:"3px 10px",borderRadius:999,fontWeight:600}}>Admin</span>
            </div>
          </div>

          {loading ? (
            <div style={{textAlign:"center",padding:30,color:"#9ca3af"}}>Đang tải...</div>
          ) : accounts.length === 0 ? (
            <div style={{textAlign:"center",padding:30,color:"#9ca3af"}}>Chưa có tài khoản nào</div>
          ) : (() => {
            const totalPages = Math.ceil(accounts.length / ACCOUNTS_PER_PAGE);
            const pageAccounts = accounts.slice((accPage-1)*ACCOUNTS_PER_PAGE, accPage*ACCOUNTS_PER_PAGE);
            return (<>
              {pageAccounts.map(acc => {
                const isRevealed = revealedIds[acc.email];
                const decodedPwd = isRevealed ? deobfuscate(acc.pwd || "") : null;
                return (
                  <div key={acc.email} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #eff6ff",flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1f2937"}}>{acc.email}</div>
                      <div style={{fontSize:12,color:"#9ca3af"}}>
                        Thêm bởi {acc.addedBy} • {acc.addedAt ? new Date(acc.addedAt).toLocaleDateString("vi-VN") : ""}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8faff",border:"1px solid #e5e7eb",borderRadius:8,padding:"4px 10px"}}>
                        <span style={{fontSize:13,fontFamily:"monospace",color:"#374151",letterSpacing:isRevealed?1:2,minWidth:80}}>
                          {isRevealed ? decodedPwd : "••••••••"}
                        </span>
                        <button onClick={()=> isRevealed ? setRevealedIds(p=>({...p,[acc.email]:false})) : handleRevealRequest(acc.email)}
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:0,color:"#6b7280"}}>
                          {isRevealed ? "🙈" : "👁️"}
                        </button>
                      </div>
                      <button onClick={()=>handleRemove(acc)} style={{
                        padding:"5px 12px",border:"1px solid #fecaca",borderRadius:8,
                        background:"#fef2f2",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer"
                      }}>Xóa</button>
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,paddingTop:14,marginTop:4}}>
                  <button onClick={()=>setAccPage(p=>Math.max(1,p-1))} disabled={accPage===1}
                    style={{padding:"4px 12px",borderRadius:6,border:"1px solid #bfdbfe",background:accPage===1?"#f3f4f6":"#eff6ff",color:accPage===1?"#9ca3af":"#2563eb",fontWeight:600,cursor:accPage===1?"default":"pointer",fontSize:13}}>
                    ‹ Trước
                  </button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                    <button key={p} onClick={()=>setAccPage(p)}
                      style={{padding:"4px 10px",borderRadius:6,border:"1px solid",
                        borderColor:p===accPage?"#4f7fff":"#bfdbfe",
                        background:p===accPage?"#4f7fff":"#fff",
                        color:p===accPage?"#fff":"#2563eb",
                        fontWeight:600,cursor:"pointer",fontSize:13,minWidth:32}}>
                      {p}
                    </button>
                  ))}
                  <button onClick={()=>setAccPage(p=>Math.min(totalPages,p+1))} disabled={accPage===totalPages}
                    style={{padding:"4px 12px",borderRadius:6,border:"1px solid #bfdbfe",background:accPage===totalPages?"#f3f4f6":"#eff6ff",color:accPage===totalPages?"#9ca3af":"#2563eb",fontWeight:600,cursor:accPage===totalPages?"default":"pointer",fontSize:13}}>
                    Sau ›
                  </button>
                  <span style={{fontSize:12,color:"#9ca3af",marginLeft:4}}>{accPage}/{totalPages}</span>
                </div>
              )}
            </>);
          })()}
        </div>
      </div>

      {/* Modal nhập mật khẩu admin để xem password người dùng */}
      {revealId && (
        <div className="modal-overlay" onClick={()=>{ setRevealId(null); setAdminPwdInput(""); setAdminPwdError(""); }}>
          <div className="modal-dialog" onClick={e=>e.stopPropagation()}>
            <div className="modal-dialog-header" style={{background:"linear-gradient(135deg,#4f7fff,#2563eb)"}}>
              🔑 Xác minh danh tính Admin
            </div>
            <div className="modal-dialog-body">
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:32,marginBottom:8}}>🔐</div>
                <div style={{fontSize:14,color:"#374151"}}>Nhập mật khẩu tài khoản Admin để xem mật khẩu của</div>
                <div style={{fontSize:14,fontWeight:700,color:"#2563eb",marginTop:6,wordBreak:"break-all"}}>{revealId}</div>
                <div style={{fontSize:12,color:"#9ca3af",marginTop:4}}>{user?.email}</div>
              </div>
              <label className="form-label">Mật khẩu Admin</label>
              <input className="form-input" type="password" autoFocus
                placeholder="Nhập mật khẩu đăng nhập của bạn"
                value={adminPwdInput}
                onChange={e=>{ setAdminPwdInput(e.target.value); setAdminPwdError(""); }}
                onKeyDown={e=>e.key==="Enter"&&handleAdminPwdSubmit()}
                style={{borderColor:adminPwdError?"#ef4444":undefined}} />
              {adminPwdError && (
                <div style={{color:"#ef4444",fontSize:13,marginTop:6,fontWeight:600}}>❌ {adminPwdError}</div>
              )}
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-cancel" onClick={()=>{ setRevealId(null); setAdminPwdInput(""); setAdminPwdError(""); }}>Huỷ</button>
              <button className="btn-save" onClick={handleAdminPwdSubmit} disabled={adminPwdVerifying}>
                {adminPwdVerifying ? "Đang kiểm tra..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}