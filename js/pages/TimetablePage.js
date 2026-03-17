// TIMETABLE PAGE
// ─────────────────────────────────────────────────────────────────

const LS_TIMETABLE = "diemdanh_timetable_v1";
function loadTimetable() { try { return JSON.parse(localStorage.getItem(LS_TIMETABLE)) || []; } catch { return []; } }

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const DAY_KEYS = ["thu2", "thu3", "thu4", "thu5", "thu6", "thu7"];

// Màu xanh lá đậm nhạt cho bảng (giống ảnh)
const TBL_COLORS = [
  "#2e7d50", "#388e5e", "#43a36c", "#4db87a",
  "#56cc88", "#60e096", "#6af4a4", "#74ffb2",
];

function TimetablePage({ classes, user }) {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ classId: "", day: "thu2", startTime: "07:30", endTime: "09:00" });

  // Tự phân loại Sáng/Chiều/Tối dựa trên giờ bắt đầu
  const getSession = (startTime) => {
    if (!startTime) return "sang";
    const h = parseInt(startTime.split(":")[0]);
    if (h < 12) return "sang";
    if (h < 18) return "chieu";
    return "toi";
  };
  const [editId, setEditId] = useState(null);

  // Load từ Firestore khi user login
  useEffect(() => {
    if (!user) { setEntries([]); return; }
    loadTimetableFromDB(user.uid).then(data => setEntries(data || []));
  }, [user]);

  // Helper lưu entries lên Firestore
  const saveEntries = (data) => {
    setEntries(data);
    if (user) saveTimetableToDB(user.uid, data);
  };

  // Tạo map màu theo classId
  const classColorMap = useMemo(() => {
    const map = {};
    (classes || []).forEach((c, i) => { map[c.id] = TBL_COLORS[i % TBL_COLORS.length]; });
    return map;
  }, [classes]);

  const handleSave = () => {
    if (!form.classId) { alert("Vui lòng chọn lớp!"); return; }
    if (!form.startTime || !form.endTime) { alert("Vui lòng chọn giờ bắt đầu và kết thúc!"); return; }
    if (form.startTime >= form.endTime) { alert("Giờ bắt đầu phải nhỏ hơn giờ kết thúc!"); return; }

    // Tự tính buổi từ giờ bắt đầu
    const session = getSession(form.startTime);
    const entry = { ...form, session, id: editId || Date.now().toString() };

    let updated;
    if (editId) {
      updated = entries.map(e => e.id === editId ? entry : e);
    } else {
      updated = [...entries, entry];
    }
    saveEntries(updated);
    setShowForm(false);
    setEditId(null);
    setForm({ classId: "", day: "thu2", startTime: "07:30", endTime: "09:00" });
  };

  const handleDelete = (id) => {
    if (!confirm("Xoá lịch học này?")) return;
    const updated = entries.filter(e => e.id !== id);
    saveEntries(updated);
  };

  const openEdit = (entry) => {
    setForm({ classId: entry.classId, day: entry.day, startTime: entry.startTime, endTime: entry.endTime });
    setEditId(entry.id);
    setShowForm(true);
  };

  // Build grid: session (sang/chieu/toi) x day
  const grid = useMemo(() => {
    const g = { sang: {}, chieu: {}, toi: {} };
    DAY_KEYS.forEach(d => { g.sang[d] = []; g.chieu[d] = []; g.toi[d] = []; });
    entries.forEach(e => {
      // Ưu tiên tính lại từ startTime (bỏ qua session cũ nếu có)
      const ses = getSession(e.startTime);
      const d = e.day || "thu2";
      if (g[ses] && g[ses][d] !== undefined) g[ses][d].push(e);
    });
    return g;
  }, [entries]);

  const getClassName = (classId) => (classes || []).find(c => c.id === classId)?.name || classId;

  // Tính số hàng tối đa trong mỗi session để render đúng chiều cao
  const maxSang = useMemo(() => Math.max(1, ...DAY_KEYS.map(d => grid.sang[d].length)), [grid]);
  const maxChieu = useMemo(() => Math.max(1, ...DAY_KEYS.map(d => grid.chieu[d].length)), [grid]);
  const maxToi = useMemo(() => Math.max(0, ...DAY_KEYS.map(d => grid.toi[d].length)), [grid]);
  const hasToi = maxToi > 0;

  return (
    <div className="page-content">
      {/* Topbar */}
      <div className="page-topbar">
        <div className="page-topbar-title">Thời Khóa Biểu</div>
        <button className="btn-add-primary" onClick={() => { setEditId(null); setForm({ classId: "", day: "thu2", startTime: "07:30", endTime: "09:00" }); setShowForm(true); }}>
          + Thêm lịch
        </button>
      </div>

      {/* Timetable Grid */}
      <div style={{margin:'0 32px', overflowX:'auto'}}>
        <table className="tkb-table">
          <thead>
            <tr>
              <th className="tkb-th-session"></th>
              {DAYS.map((d, i) => (
                <th key={i} className="tkb-th-day">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* SÁNG */}
            {Array.from({length: maxSang}).map((_, rowIdx) => (
              <tr key={`sang-${rowIdx}`}>
                {rowIdx === 0 && (
                  <td className="tkb-session-label" rowSpan={maxSang}>Sáng</td>
                )}
                {DAY_KEYS.map(dk => {
                  const cellEntries = grid.sang[dk];
                  const e = cellEntries[rowIdx];
                  return (
                    <td key={dk} className="tkb-cell" style={{background: e ? classColorMap[e.classId] + "22" : "#e8f5ee"}}>
                      {e ? (
                        <div className="tkb-entry" style={{borderLeft: `3px solid ${classColorMap[e.classId] || '#2e7d50'}`}}>
                          <div className="tkb-entry-name" style={{color: classColorMap[e.classId] || '#2e7d50'}}>{getClassName(e.classId)}</div>
                          <div className="tkb-entry-time">{e.startTime} – {e.endTime}</div>
                          <div className="tkb-entry-actions">
                            <button onClick={() => openEdit(e)} title="Sửa" className="tkb-btn-edit"><Icon name="edit" size={12}/></button>
                            <button onClick={() => handleDelete(e.id)} title="Xoá" className="tkb-btn-del"><Icon name="trash" size={12}/></button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* CHIỀU */}
            {Array.from({length: maxChieu}).map((_, rowIdx) => (
              <tr key={`chieu-${rowIdx}`}>
                {rowIdx === 0 && (
                  <td className="tkb-session-label" rowSpan={maxChieu}>Chiều</td>
                )}
                {DAY_KEYS.map(dk => {
                  const cellEntries = grid.chieu[dk];
                  const e = cellEntries[rowIdx];
                  return (
                    <td key={dk} className="tkb-cell" style={{background: e ? classColorMap[e.classId] + "22" : "#e8f5ee"}}>
                      {e ? (
                        <div className="tkb-entry" style={{borderLeft: `3px solid ${classColorMap[e.classId] || '#2e7d50'}`}}>
                          <div className="tkb-entry-name" style={{color: classColorMap[e.classId] || '#2e7d50'}}>{getClassName(e.classId)}</div>
                          <div className="tkb-entry-time">{e.startTime} – {e.endTime}</div>
                          <div className="tkb-entry-actions">
                            <button onClick={() => openEdit(e)} title="Sửa" className="tkb-btn-edit"><Icon name="edit" size={12}/></button>
                            <button onClick={() => handleDelete(e.id)} title="Xoá" className="tkb-btn-del"><Icon name="trash" size={12}/></button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* TỐI — chỉ render nếu có dữ liệu */}
            {hasToi && Array.from({length: maxToi}).map((_, rowIdx) => (
              <tr key={`toi-${rowIdx}`}>
                {rowIdx === 0 && (
                  <td className="tkb-session-label tkb-session-toi" rowSpan={maxToi}>Tối</td>
                )}
                {DAY_KEYS.map(dk => {
                  const cellEntries = grid.toi[dk];
                  const e = cellEntries[rowIdx];
                  return (
                    <td key={dk} className="tkb-cell tkb-cell-toi" style={{background: e ? classColorMap[e.classId] + "22" : "#e8eaf6"}}>
                      {e ? (
                        <div className="tkb-entry" style={{borderLeft: `3px solid ${classColorMap[e.classId] || '#3949ab'}`}}>
                          <div className="tkb-entry-name" style={{color: classColorMap[e.classId] || '#3949ab'}}>{getClassName(e.classId)}</div>
                          <div className="tkb-entry-time">{e.startTime} – {e.endTime}</div>
                          <div className="tkb-entry-actions">
                            <button onClick={() => openEdit(e)} title="Sửa" className="tkb-btn-edit"><Icon name="edit" size={12}/></button>
                            <button onClick={() => handleDelete(e.id)} title="Xoá" className="tkb-btn-del"><Icon name="trash" size={12}/></button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="empty-state" style={{marginTop:20}}>
          <div className="empty-state-icon">📅</div>
          <div>Chưa có lịch học nào. Nhấn <b>+ Thêm lịch</b> để bắt đầu!</div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-dialog" style={{width: 460}} onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">{editId ? "Sửa lịch học" : "Thêm lịch học mới"}</div>
            <div className="modal-dialog-body" style={{display:'flex', flexDirection:'column', gap:14}}>

              <div>
                <label className="form-label">Lớp học</label>
                <select className="form-input" value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value}))}>
                  <option value="">-- Chọn lớp --</option>
                  {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Thứ trong tuần</label>
                <select className="form-input" value={form.day} onChange={e => setForm(f => ({...f, day: e.target.value}))}>
                  {DAYS.map((d, i) => <option key={i} value={DAY_KEYS[i]}>{d}</option>)}
                </select>
              </div>

              <div className="form-grid-2">
                <TimePicker
                  label="Giờ bắt đầu"
                  value={form.startTime}
                  onChange={v => setForm(f => ({...f, startTime: v}))}
                />
                <TimePicker
                  label="Giờ kết thúc"
                  value={form.endTime}
                  onChange={v => setForm(f => ({...f, endTime: v}))}
                />
              </div>

              {/* Auto-detect session preview */}
              {form.startTime && (
                <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8,
                  background: getSession(form.startTime) === 'sang' ? '#f0fdf4' : getSession(form.startTime) === 'chieu' ? '#fffbeb' : '#eef2ff',
                  border: `1px solid ${getSession(form.startTime) === 'sang' ? '#bbf7d0' : getSession(form.startTime) === 'chieu' ? '#fde68a' : '#c7d2fe'}`
                }}>
                  <span style={{fontSize:16}}>
                    {getSession(form.startTime) === 'sang' ? '🌅' : getSession(form.startTime) === 'chieu' ? '🌤️' : '🌙'}
                  </span>
                  <span style={{fontSize:13, fontWeight:600,
                    color: getSession(form.startTime) === 'sang' ? '#16a34a' : getSession(form.startTime) === 'chieu' ? '#d97706' : '#4338ca'
                  }}>
                    Tự động xếp vào buổi: <b>{getSession(form.startTime) === 'sang' ? 'Sáng' : getSession(form.startTime) === 'chieu' ? 'Chiều' : 'Tối'}</b>
                  </span>
                  <span style={{fontSize:12, color:'#9ca3af', marginLeft:'auto'}}>
                    {getSession(form.startTime) === 'sang' ? '00:00–11:59' : getSession(form.startTime) === 'chieu' ? '12:00–17:59' : '18:00–23:59'}
                  </span>
                </div>
              )}

            </div>
            <div className="modal-dialog-footer">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Huỷ</button>
              <button className="btn-save" onClick={handleSave}>{editId ? "Lưu" : "Thêm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────