// COMPONENTS — Các component dùng chung
// ─────────────────────────────────────────────────────────────────

// Sử dụng <use href="#icon-id" /> để tham chiếu SVG từ index.html
function Icon({ name, size = 24 }) {
    return (
        <svg width={size} height={size}>
            <use href={`#icon-${name}`} />
        </svg>
    );
}

function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function NavCard({ label, sub, icon, onClick, onEdit, onDelete }) {
  return (
    <div className="nav-card" onClick={onClick}>
      <div className="nav-card-icon">{icon}</div>
      <div className="nav-card-info">
        <div className="nav-card-label">{label}</div>
        {sub && <div className="nav-card-sub">{sub}</div>}
      </div>
      {onEdit && (
        <button className="nav-card-action" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
           <Icon name="edit" size={18} />
        </button>
      )}
      <div className="nav-card-arrow">→</div>
    </div>
  );
}

// ─── DRAGGABLE NAV GRID ───
function DraggableNavGrid({ items, onReorder, renderItem }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    // Ghost image trong suốt
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-999px;opacity:0;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== overIdx) setOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { reset(); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onReorder(next);
    reset();
  };

  const reset = () => { setDragIdx(null); setOverIdx(null); setIsDragging(false); };

  return (
    <div className="nav-grid" style={{userSelect:'none'}}>
      {items.map((item, idx) => {
        const isDragged = dragIdx === idx;
        const isOver = overIdx === idx && dragIdx !== idx;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={reset}
            style={{
              opacity: isDragged ? 0.35 : 1,
              transform: isOver ? 'scale(1.03)' : 'none',
              transition: 'transform 0.15s, opacity 0.15s, box-shadow 0.15s',
              boxShadow: isOver ? '0 8px 30px rgba(79,127,255,0.25)' : 'none',
              borderRadius: 16,
              outline: isOver ? '2px dashed #4f7fff' : 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {renderItem(item, idx)}
          </div>
        );
      })}
    </div>
  );
}

function CopyIcon({ state }) {
  if (state === "copied") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <use href="#icon-check" />
    </svg>
  );
  if (state === "loading") return (
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a0b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
     </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f7fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <use href="#icon-copy" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────

// ─── PASSCODE GATE — Modal xác nhận passcode trước khi xóa ───
function PasscodeGate({ title, message, onConfirm, onCancel, userUid }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const [noPasscode, setNoPasscode] = useState(false);

  const handleConfirm = async () => {
    setChecking(true);
    const profile = userUid ? await loadProfileFromDB(userUid) : loadProfile();
    const passcode = profile.passcode || "";
    setChecking(false);

    if (!passcode) {
      // Chưa đặt passcode → KHÔNG cho phép xóa
      setNoPasscode(true);
      return;
    }
    if (input === passcode) {
      onConfirm();
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-dialog-header" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>
          🗑️ {title || "Xác nhận xóa"}
        </div>
        <div className="modal-dialog-body">
          {noPasscode ? (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:36, marginBottom:12}}>🔒</div>
              <div style={{fontSize:15, fontWeight:700, color:'#1f2937', marginBottom:8}}>Chưa đặt passcode</div>
              <div style={{fontSize:13, color:'#6b7280', lineHeight:1.6}}>
                Bạn cần đặt passcode trong trang <b>Hồ Sơ</b> trước khi có thể xóa dữ liệu.
              </div>
            </div>
          ) : (
            <>
              <div style={{textAlign:'center', marginBottom:16}}>
                <div style={{fontSize:32, marginBottom:8}}>⚠️</div>
                <div style={{fontSize:14, color:'#374151'}}>{message}</div>
              </div>
              <label className="form-label" style={{textAlign:'center', display:'block'}}>Nhập passcode xác nhận</label>
              <input className="form-input"
                type="password" inputMode="numeric" maxLength={8} autoFocus
                placeholder="● ● ● ●"
                value={input}
                style={{textAlign:'center', fontSize:22, letterSpacing:8, fontWeight:700,
                  borderColor: error ? '#ef4444' : undefined,
                  boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined}}
                onChange={e => { setInput(e.target.value.replace(/\D/g,"")); setError(false); }}
                onKeyDown={e => e.key === "Enter" && handleConfirm()} />
              {error && <div style={{color:'#ef4444', fontSize:13, textAlign:'center', marginTop:8, fontWeight:600}}>❌ Passcode không đúng</div>}
            </>
          )}
        </div>
        <div className="modal-dialog-footer">
          <button className="btn-cancel" onClick={onCancel}>
            {noPasscode ? "Đóng" : "Huỷ"}
          </button>
          {!noPasscode && (
            <button onClick={handleConfirm} disabled={checking}
              style={{padding:'8px 18px', borderRadius:8, border:'none',
                background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff',
                fontSize:13, fontWeight:600, cursor:'pointer'}}>
              {checking ? "Đang kiểm tra..." : "Xác nhận xóa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}