// PROFILE PAGE
// ─────────────────────────────────────────────────────────────────

function ProfilePage({ user }) {
  const [profile, setProfile] = useState(() => loadProfile());
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showPasscode, setShowPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);
  const [pwdVerifyInput, setPwdVerifyInput] = useState("");
  const [pwdVerifyError, setPwdVerifyError] = useState("");
  const [pwdVerifying, setPwdVerifying] = useState(false);
  const [pwdVerified, setPwdVerified] = useState(false); // đã xác minh password trong session này

  const handleRevealPasscode = async () => {
    if (pwdVerified) {
      // Đã xác minh rồi → toggle hiện/ẩn
      setShowPasscode(v => !v);
      return;
    }
    setShowConfirmPasscode(true);
  };

  const handleVerifyPassword = async () => {
    if (!pwdVerifyInput) { setPwdVerifyError("Vui lòng nhập mật khẩu"); return; }
    setPwdVerifying(true); setPwdVerifyError("");
    try {
      // Re-authenticate bằng email + password
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwdVerifyInput);
      await window.auth.currentUser.reauthenticateWithCredential(credential);
      setPwdVerified(true);
      setShowPasscode(true);
      setShowConfirmPasscode(false);
      setPwdVerifyInput("");
    } catch(e) {
      setPwdVerifyError("Mật khẩu không đúng");
    }
    setPwdVerifying(false);
  };
  const fileRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const loader = user ? loadProfileFromDB(user.uid) : Promise.resolve(loadProfile());
    loader.then(p => { setProfile(p); setLoadingProfile(false); }).catch(() => setLoadingProfile(false));
  }, [user]);

  const handleChange = (field, value) => setProfile(p => ({...p, [field]: value}));

  const handleQrUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(p => ({...p, qrDataUrl: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(p => ({...p, logoDataUrl: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const savePromise = user ? saveProfileToDB(user.uid, profile) : Promise.resolve(saveProfile(profile));
    Promise.resolve(savePromise).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const field = (label, key, placeholder, type="text") => (
    <div style={{marginBottom:14}}>
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={profile[key] || ""} placeholder={placeholder}
        onChange={e => handleChange(key, e.target.value)} />
    </div>
  );

  if (loadingProfile) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:60, flexDirection:'column', gap:12}}>
      <div className="spin"><Icon name="database" size={28} /></div>
      <div style={{color:'#4f7fff', fontWeight:600}}>Đang tải hồ sơ...</div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-topbar">
        <div className="page-topbar-title">👤 Hồ Sơ Giáo Viên</div>
      </div>

      <div style={{maxWidth:560, margin:'0 auto', padding:'0 32px'}}>

        {/* Thông tin liên hệ */}
        <div className="form-card">
          <h3>Thông tin liên hệ</h3>
          {field("Tên giáo viên", "teacherName", "Nhập tên giáo viên")}
          {field("Số điện thoại", "phone", "Nhập số điện thoại", "tel")}

          <label className="form-label" style={{marginTop:6}}>Ảnh logo (hiển thị trên phiếu)</label>
          <div style={{display:'flex', alignItems:'flex-start', gap:16, marginTop:6}}>
            <div>
              {profile.logoDataUrl ? (
                <img src={profile.logoDataUrl} alt="Logo" style={{width:130, height:80, objectFit:'contain', border:'2px solid #bfdbfe', borderRadius:10, padding:6, background:'#fff'}} />
              ) : (
                <div style={{width:130, height:80, border:'2px dashed #bfdbfe', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:13}}>
                  Logo mặc định
                </div>
              )}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <button className="btn-save" style={{padding:'8px 16px', fontSize:13}} onClick={() => logoRef.current.click()}>
                🖼️ Chọn logo
              </button>
              {profile.logoDataUrl && (
                <button className="btn-cancel" style={{fontSize:13}} onClick={() => setProfile(p => ({...p, logoDataUrl:""}))}>
                  Dùng logo mặc định
                </button>
              )}
              <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoUpload} />
              <div style={{fontSize:12, color:'#9ca3af', lineHeight:1.4}}>Logo hiển thị<br/>đầu phiếu học phí</div>
            </div>
          </div>
        </div>

        {/* Thông tin thanh toán */}
        <div className="form-card">
          <h3>Thông tin thanh toán</h3>
          {field("Ngân hàng", "bank", "Nhập tên ngân hàng")}
          {field("Số tài khoản", "account", "Nhập số tài khoản")}
          {field("Chủ tài khoản", "owner", "Nhập tên chủ tài khoản")}

          <label className="form-label" style={{marginTop:6}}>Ảnh mã QR thanh toán</label>
          <div style={{display:'flex', alignItems:'flex-start', gap:16, marginTop:6}}>
            <div>
              {profile.qrDataUrl ? (
                <img src={profile.qrDataUrl} alt="QR" style={{width:130, height:130, objectFit:'contain', border:'2px solid #bfdbfe', borderRadius:10, padding:6, background:'#fff'}} />
              ) : (
                <div style={{width:130, height:130, border:'2px dashed #bfdbfe', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:13}}>
                  Chưa có ảnh
                </div>
              )}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <button className="btn-save" style={{padding:'8px 16px', fontSize:13}} onClick={() => fileRef.current.click()}>
                📷 Chọn ảnh QR
              </button>
              {profile.qrDataUrl && (
                <button className="btn-cancel" style={{fontSize:13}} onClick={() => setProfile(p => ({...p, qrDataUrl:""}))}>
                  Xóa ảnh
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleQrUpload} />
              <div style={{fontSize:12, color:'#9ca3af', lineHeight:1.4}}>Ảnh sẽ hiển thị<br/>trên phiếu học phí</div>
            </div>
          </div>
        </div>

        {/* Passcode bảo vệ xóa */}
        <div className="form-card">
          <h3>🔒 Passcode bảo vệ</h3>
          <p style={{color:'#6b7280', fontSize:13, marginBottom:16}}>
            Khi đặt passcode, mọi thao tác xóa (lớp, học sinh...) đều yêu cầu nhập passcode này để xác nhận.
          </p>
          <label className="form-label">Passcode (4-8 ký tự số)</label>
          <div style={{position:'relative'}}>
            <input className="form-input"
              type={showPasscode ? "text" : "password"}
              inputMode="numeric"
              maxLength={8}
              placeholder={profile.passcode ? "••••" : "Chưa đặt passcode"}
              value={profile.passcode || ""}
              onChange={e => handleChange("passcode", e.target.value.replace(/\D/g,""))}
              style={{paddingRight:44}} />
            <button type="button" onClick={handleRevealPasscode} style={{
              position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:0
            }}>{showPasscode ? "🙈" : "👁️"}</button>
          </div>
          {profile.passcode ? (
            <div style={{marginTop:8, fontSize:12, color:'#16a34a'}}>
              ✅ Passcode đã được đặt — bắt buộc nhập khi xóa dữ liệu
            </div>
          ) : (
            <div style={{marginTop:8, fontSize:12, color:'#f59e0b'}}>
              ⚠️ Chưa đặt passcode — không thể xóa dữ liệu
            </div>
          )}
        </div>

        {/* Modal xác nhận password trước khi xem passcode */}
        {showConfirmPasscode && (
          <div className="modal-overlay" onClick={() => { setShowConfirmPasscode(false); setPwdVerifyInput(""); setPwdVerifyError(""); }}>
            <div className="modal-dialog" onClick={e => e.stopPropagation()}>
              <div className="modal-dialog-header" style={{background:'linear-gradient(135deg,#4f7fff,#2563eb)'}}>
                🔑 Xác minh danh tính
              </div>
              <div className="modal-dialog-body">
                <div style={{textAlign:'center', marginBottom:16}}>
                  <div style={{fontSize:32, marginBottom:8}}>🔐</div>
                  <div style={{fontSize:14, color:'#374151'}}>Nhập mật khẩu tài khoản để xem passcode</div>
                  <div style={{fontSize:13, color:'#9ca3af', marginTop:4}}>{user?.email}</div>
                </div>
                <label className="form-label">Mật khẩu</label>
                <input className="form-input" type="password" autoFocus
                  placeholder="Nhập mật khẩu đăng nhập"
                  value={pwdVerifyInput}
                  onChange={e => { setPwdVerifyInput(e.target.value); setPwdVerifyError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleVerifyPassword()}
                  style={{borderColor: pwdVerifyError ? '#ef4444' : undefined}} />
                {pwdVerifyError && (
                  <div style={{color:'#ef4444', fontSize:13, marginTop:6, fontWeight:600}}>❌ {pwdVerifyError}</div>
                )}
              </div>
              <div className="modal-dialog-footer">
                <button className="btn-cancel" onClick={() => { setShowConfirmPasscode(false); setPwdVerifyInput(""); setPwdVerifyError(""); }}>Huỷ</button>
                <button className="btn-save" onClick={handleVerifyPassword} disabled={pwdVerifying}>
                  {pwdVerifying ? "Đang kiểm tra..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSave} style={{
          width:'100%', height:48, fontSize:15, fontWeight:700, border:'none', borderRadius:10, cursor:'pointer',
          background: saved ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#4f7fff,#2563eb)',
          color:'#fff', transition:'background 0.3s', marginBottom:32
        }}>
          {saved ? '✅ Đã lưu!' : '💾 Lưu hồ sơ'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────