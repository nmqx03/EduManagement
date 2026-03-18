// ─── VERIFY PASSWORD MODAL — Tái sử dụng cho nhiều tình huống ───
function VerifyPwdModal({ email, title, description, headerColor, btnColor, onVerified, onCancel }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (!pwd) { setErr("Vui lòng nhập mật khẩu"); return; }
    setLoading(true); setErr("");
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(email, pwd);
      await window.auth.currentUser.reauthenticateWithCredential(credential);
      onVerified();
    } catch {
      setErr("Mật khẩu không đúng");
    }
    setLoading(false);
  };
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-dialog-header" style={{background: headerColor || 'linear-gradient(135deg,#4f7fff,#2563eb)'}}>
          {title || "🔑 Xác minh danh tính"}
        </div>
        <div className="modal-dialog-body">
          <div style={{textAlign:'center', marginBottom:16}}>
            <div style={{fontSize:32, marginBottom:8}}>🔐</div>
            <div style={{fontSize:14, color:'#374151'}}>{description || "Nhập mật khẩu tài khoản để tiếp tục"}</div>
            <div style={{fontSize:13, color:'#9ca3af', marginTop:4}}>{email}</div>
          </div>
          <label className="form-label">Mật khẩu</label>
          <input className="form-input" type="password" autoFocus
            placeholder="Nhập mật khẩu đăng nhập"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === 'Enter' && handle()}
            style={{borderColor: err ? '#ef4444' : undefined}} />
          {err && <div style={{color:'#ef4444', fontSize:13, marginTop:6, fontWeight:600}}>❌ {err}</div>}
        </div>
        <div className="modal-dialog-footer">
          <button className="btn-cancel" onClick={onCancel}>Huỷ</button>
          <button className="btn-save" style={btnColor ? {background: btnColor} : {}} onClick={handle} disabled={loading}>
            {loading ? "Đang kiểm tra..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SAVE PASSCODE MODAL ───
function SavePasscodeModal({ onConfirm, onCancel }) {
  const [inp, setInp] = useState("");
  const [err, setErr] = useState("");
  const handleSubmit = async () => {
    const ok = await onConfirm(inp);
    if (!ok) { setErr("Passcode không đúng"); setInp(""); }
  };
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-dialog-header" style={{background:'linear-gradient(135deg,#4f7fff,#2563eb)'}}>
          🔒 Xác nhận lưu hồ sơ
        </div>
        <div className="modal-dialog-body">
          <div style={{textAlign:'center', marginBottom:16}}>
            <div style={{fontSize:32, marginBottom:8}}>💾</div>
            <div style={{fontSize:14, color:'#374151'}}>Nhập passcode để xác nhận lưu thay đổi</div>
          </div>
          <label className="form-label" style={{textAlign:'center', display:'block'}}>Passcode</label>
          <input className="form-input" type="password" inputMode="numeric" maxLength={8} autoFocus
            placeholder="● ● ● ●"
            value={inp}
            style={{textAlign:'center', fontSize:22, letterSpacing:8, fontWeight:700,
              borderColor: err ? '#ef4444' : undefined}}
            onChange={e => { setInp(e.target.value.replace(/\D/g,'')); setErr(""); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          {err && <div style={{color:'#ef4444', fontSize:13, textAlign:'center', marginTop:8, fontWeight:600}}>❌ {err}</div>}
        </div>
        <div className="modal-dialog-footer">
          <button className="btn-cancel" onClick={onCancel}>Huỷ</button>
          <button className="btn-save" onClick={handleSubmit}>Lưu hồ sơ</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROFILE PAGE

function ProfilePage({ user, passcodeUnlocked, setPasscodeUnlocked }) {
  const [profile, setProfile] = useState(() => loadProfile());
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showPasscode, setShowPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);
  // Passcode gate trước khi lưu — dùng global passcodeUnlocked từ App
  const [showSavePasscodeModal, setShowSavePasscodeModal] = useState(false);
  const [pwdVerified, setPwdVerified] = useState(false); // đã xác minh password (xem passcode) trong session
  const [passcodeEditUnlocked, setPasscodeEditUnlocked] = useState(false); // mở khóa sửa/xóa passcode
  const [showPasscodeEditConfirm, setShowPasscodeEditConfirm] = useState(false); // modal xác minh để sửa passcode

  const handleRevealPasscode = async () => {
    if (pwdVerified) {
      setShowPasscode(v => !v);
      return;
    }
    setShowConfirmPasscode(true);
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

  const handleSave = async () => {
    // Nếu đã có passcode và chưa unlock trong session → hiện modal
    if (profile.passcode && !passcodeUnlocked) {
      setShowSavePasscodeModal(true);
      return;
    }
    await doSave();
  };

  const handleSaveWithPasscode = async (inputVal) => {
    if (inputVal !== profile.passcode) return false;
    if (setPasscodeUnlocked) setPasscodeUnlocked(true);
    setShowSavePasscodeModal(false);
    await doSave();
    return true;
  };

  const doSave = async () => {
    try {
      const compressBase64 = (dataUrl, maxW = 400, quality = 0.7) => {
        if (!dataUrl || !dataUrl.startsWith('data:image')) return Promise.resolve(dataUrl);
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, maxW / Math.max(img.width, img.height, 1));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
      };

      const [logoCompressed, qrCompressed] = await Promise.all([
        compressBase64(profile.logoDataUrl, 400, 0.75),
        compressBase64(profile.qrDataUrl, 300, 0.8),
      ]);
      const profileToSave = { ...profile, logoDataUrl: logoCompressed, qrDataUrl: qrCompressed };
      setProfile(profileToSave);

      if (user) {
        await saveProfileToDB(user.uid, profileToSave);
      } else {
        saveProfile(profileToSave);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) {
      alert('Lưu thất bại: ' + (e.message || e));
    }
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
              readOnly={!!profile.passcode && !passcodeEditUnlocked}
              onChange={e => handleChange("passcode", e.target.value.replace(/\D/g,""))}
              onClick={() => {
                if (profile.passcode && !passcodeEditUnlocked) {
                  setShowPasscodeEditConfirm(true);
                }
              }}
              style={{paddingRight:80, cursor: (profile.passcode && !passcodeEditUnlocked) ? 'pointer' : 'text',
                background: (profile.passcode && !passcodeEditUnlocked) ? '#f8fafc' : '#fff'}} />
            {/* Nút mở khóa sửa passcode */}
            {profile.passcode && !passcodeEditUnlocked && (
              <button type="button" onClick={() => setShowPasscodeEditConfirm(true)} style={{
                position:'absolute', right:44, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', fontSize:16, padding:0, color:'#f59e0b'
              }} title="Xác minh để sửa passcode">🔓</button>
            )}
            <button type="button" onClick={handleRevealPasscode} style={{
              position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, padding:0
            }}>{showPasscode ? "🙈" : "👁️"}</button>
          </div>
          {profile.passcode && !passcodeEditUnlocked && (
            <div style={{marginTop:8, fontSize:12, color:'#f59e0b'}}>
              🔓 Nhấn vào ô passcode hoặc biểu tượng khóa để sửa — cần xác minh mật khẩu
            </div>
          )}
          {passcodeEditUnlocked && (
            <div style={{marginTop:8, fontSize:12, color:'#16a34a'}}>
              ✅ Đã mở khóa — bạn có thể sửa hoặc xóa passcode
            </div>
          )}
          {!profile.passcode && (
            <div style={{marginTop:8, fontSize:12, color:'#f59e0b'}}>
              ⚠️ Chưa đặt passcode — không thể xóa dữ liệu
            </div>
          )}
        </div>

        {/* Modal nhập passcode để lưu hồ sơ */}
        {showSavePasscodeModal && (
          <SavePasscodeModal
            onConfirm={handleSaveWithPasscode}
            onCancel={() => setShowSavePasscodeModal(false)}
          />
        )}

        {/* Modal xác minh mật khẩu mail để sửa/xóa passcode */}
        {showPasscodeEditConfirm && (
          <VerifyPwdModal
            email={user?.email}
            title="🔓 Xác minh để sửa Passcode"
            headerColor="linear-gradient(135deg,#f59e0b,#d97706)"
            btnColor="linear-gradient(135deg,#f59e0b,#d97706)"
            description="Nhập mật khẩu tài khoản để được phép sửa hoặc xóa passcode"
            onVerified={() => { setPasscodeEditUnlocked(true); setShowPasscodeEditConfirm(false); }}
            onCancel={() => setShowPasscodeEditConfirm(false)}
          />
        )}

        {/* Modal xác nhận password trước khi xem passcode */}
        {showConfirmPasscode && (
          <VerifyPwdModal
            email={user?.email}
            title="🔑 Xác minh danh tính"
            description="Nhập mật khẩu tài khoản để xem passcode"
            onVerified={() => { setPwdVerified(true); setShowPasscode(true); setShowConfirmPasscode(false); }}
            onCancel={() => setShowConfirmPasscode(false)}
          />
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