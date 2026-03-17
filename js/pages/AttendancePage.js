// ATTENDANCE PAGE
// ─────────────────────────────────────────────────────────────────

function AttendancePage({ classes, setClasses }) {
  // Navigation State
  const [step, setStep] = useState(0); // 0: Class, 1: Year, 2: Month, 3: SessionList, 4: SessionDetail
  const [selClassId, setSelClassId] = useState(null);
  const [selYear, setSelYear] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selSessionId, setSelSessionId] = useState(null);

  // Modal States
  const [showAddSession, setShowAddSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null); // If set, we are editing
  const [newSessionDate, setNewSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  // Helpers
  const activeClass = useMemo(() => classes.find(c => c.id === selClassId), [classes, selClassId]);
  
  const availableYears = useMemo(() => {
    if (!activeClass || !activeClass.sessions) return [];
    const s = new Set();
    activeClass.sessions.forEach(ses => { if (ses.date) s.add(ses.date.slice(0, 4)); });
    if (s.size === 0) s.add(new Date().getFullYear().toString());
    return [...s].sort().reverse();
  }, [activeClass]);

  const availableMonths = useMemo(() => {
    if (!activeClass || !selYear || !activeClass.sessions) return [];
    const s = new Set();
    activeClass.sessions.forEach(ses => {
      if (ses.date && ses.date.startsWith(selYear)) s.add(parseInt(ses.date.slice(5, 7)));
    });
    // Sort descending (Newest first)
    return [...s].sort((a, b) => b - a);
  }, [activeClass, selYear]);

  // Sort Sessions: Newest first
  const filteredSessions = useMemo(() => {
    if (!activeClass || !selYear || !selMonth || !activeClass.sessions) return [];
    return activeClass.sessions.filter(ses => {
      if (!ses.date) return false;
      const [y, m] = ses.date.split("-");
      return y === selYear && parseInt(m) === selMonth;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [activeClass, selYear, selMonth]);

  const activeSession = useMemo(() => activeClass?.sessions?.find(s => s.id === selSessionId), [activeClass, selSessionId]);

  // Actions
  const openAddSession = () => {
    setEditingSessionId(null);
    setNewSessionDate(new Date().toISOString().slice(0, 10));
    setShowAddSession(true);
  };

  const openEditSession = (session) => {
    setEditingSessionId(session.id);
    setNewSessionDate(session.date);
    setShowAddSession(true);
  };

  const saveSession = () => {
    if (!newSessionDate) return;

    let updated;
    if (editingSessionId) {
        // Edit Mode
        updated = classes.map(c => {
            if (c.id !== selClassId) return c;
            return {
                ...c,
                sessions: c.sessions.map(s => s.id === editingSessionId ? { ...s, date: newSessionDate } : s)
            };
        });
    } else {
        // Add Mode
        const session = { id: Date.now().toString(), date: newSessionDate, attendance: [], attendanceKem: [] };
        updated = classes.map(c => c.id === selClassId ? { ...c, sessions: [...c.sessions, session] } : c);
    }
    
    setClasses(updated); setShowAddSession(false);
  };

  const toggleAttendance = (studentId, type) => {
    // type: 'main' or 'kem'
    const updated = classes.map(c => {
      if (c.id !== selClassId) return c;
      return {
        ...c,
        sessions: c.sessions.map(ses => {
          if (ses.id !== selSessionId) return ses;
          let att = ses.attendance || [];
          let attKem = ses.attendanceKem || [];
          
          if (type === 'main') {
            if (att.includes(studentId)) {
              att = att.filter(id => id !== studentId); // toggle off
            } else {
              att = [...att, studentId]; // toggle on
              attKem = attKem.filter(id => id !== studentId); // exclusive
            }
          } else if (type === 'kem') {
            if (attKem.includes(studentId)) {
              attKem = attKem.filter(id => id !== studentId); // toggle off
            } else {
              attKem = [...attKem, studentId]; // toggle on
              att = att.filter(id => id !== studentId); // exclusive
            }
          }
          return { ...ses, attendance: att, attendanceKem: attKem };
        })
      };
    });
    setClasses(updated);
  };

  const getMonthlyStats = (studentId) => {
    if (!activeClass || !selYear || !selMonth) return { main: 0, kem: 0, total: 0 };
    const monthSessions = (activeClass.sessions || []).filter(ses => {
        if (!ses.date) return false;
        const [y, m] = ses.date.split("-");
        return y === selYear && parseInt(m) === selMonth;
    });
    let main = 0, kem = 0;
    monthSessions.forEach(ses => {
        if ((ses.attendance || []).includes(studentId)) main++;
        if ((ses.attendanceKem || []).includes(studentId)) kem++;
    });
    return { main, kem, total: main + kem };
  };

  // Shared Session Modal (Add & Edit)
  const sessionModal = showAddSession && (
    <div className="modal-overlay" onClick={() => setShowAddSession(false)}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-dialog-header">{editingSessionId ? "Sửa buổi học" : "Thêm buổi học"}</div>
        <div className="modal-dialog-body">
          <label className="form-label">Ngày học</label>
          <input className="form-input" type="date" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} onKeyDown={e => e.key === "Enter" && saveSession()} />
        </div>
        <div className="modal-dialog-footer">
          <button className="btn-cancel" onClick={() => setShowAddSession(false)}>Huỷ</button>
          <button className="btn-save" onClick={saveSession}>{editingSessionId ? "Lưu" : "Thêm"}</button>
        </div>
      </div>
    </div>
  );

  // ── RENDER ──

  // VIEW 0: LIST CLASSES (No "Add Class" here anymore)
  if (step === 0) {
    return (
      <div className="page-content">
        <div className="page-topbar">
          <div className="page-topbar-title">Chọn Lớp Để Điểm Danh</div>
        </div>
        {classes.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏫</div><div>Chưa có lớp nào</div></div> : null}
        <DraggableNavGrid
          items={classes}
          onReorder={next => { setClasses(next); }}
          renderItem={(c) => (
            <NavCard label={c.name} sub={`${(c.students || []).length} học sinh`}
              icon={<Icon name="school" />} onClick={() => { setSelClassId(c.id); setStep(1); }} />
          )}
        />
      </div>
    );
  }

  // VIEW 1: SELECT YEAR
  if (step === 1) {
    return (
      <div className="page-content">
        <div className="page-topbar">
          <button className="btn-back" onClick={() => setStep(0)}>‹ Chọn lại lớp</button>
          <div className="page-topbar-title">{activeClass?.name} - Chọn Năm</div>
          <button className="btn-add-primary" onClick={openAddSession}>+ Thêm buổi</button>
        </div>
        <div className="nav-grid">
          {availableYears.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📅</div><div>Chưa có dữ liệu năm</div></div> : null}
          {availableYears.map(y => (
            <NavCard key={y} label={`Năm ${y}`} icon={<Icon name="calendar" />} onClick={() => { setSelYear(y); setStep(2); }} />
          ))}
        </div>
        {sessionModal}
      </div>
    );
  }

  // VIEW 2: SELECT MONTH (Added Add Session Button)
  if (step === 2) {
    return (
      <div className="page-content">
        <div className="page-topbar">
          <button className="btn-back" onClick={() => setStep(1)}>‹ Chọn lại năm</button>
          <div className="page-topbar-title">Năm {selYear} - Chọn Tháng</div>
          <button className="btn-add-primary" onClick={openAddSession}>+ Thêm buổi</button>
        </div>
        <div className="nav-grid">
          {availableMonths.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🗓️</div><div>Năm này chưa có buổi học nào</div></div> : null}
          {availableMonths.map(m => (
            <NavCard key={m} label={`Tháng ${m}`} icon={<Icon name="month" />} onClick={() => { setSelMonth(m); setStep(3); }} />
          ))}
        </div>
        {sessionModal}
      </div>
    );
  }

  // VIEW 3: SELECT SESSION (Added Add Session Button & Edit Feature)
  if (step === 3) {
    return (
      <div className="page-content">
        <div className="page-topbar">
          <button className="btn-back" onClick={() => setStep(2)}>‹ Chọn lại tháng</button>
          <div className="page-topbar-title">Tháng {selMonth}/{selYear} - Chọn Buổi</div>
          <button className="btn-add-primary" onClick={openAddSession}>+ Thêm buổi</button>
        </div>
        <div className="nav-grid">
          {filteredSessions.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📅</div><div>Chưa có buổi học nào</div></div> : null}
          {filteredSessions.map((ses, idx) => {
             const presentCount = (ses.attendance?.length || 0) + (ses.attendanceKem?.length || 0);
             return (
              <NavCard 
                key={ses.id} 
                label={fmtDate(ses.date)} 
                sub={`${presentCount}/${(activeClass.students || []).length} có mặt`}
                icon={<Icon name="att" />} 
                onClick={() => { setSelSessionId(ses.id); setStep(4); }}
                onEdit={() => openEditSession(ses)}
              />
             );
          })}
        </div>
        {sessionModal}
      </div>
    );
  }

  // VIEW 4: MARKING ATTENDANCE (TABLE)
  if (step === 4) {
    if (!activeSession) return <div className="page-content"><div className="empty-state">Không tìm thấy buổi học</div><button className="btn-back" onClick={() => setStep(3)}>Quay lại</button></div>;
    
    const totalStudents = (activeClass.students || []).length;
    const presentMain = activeSession.attendance?.length || 0;
    const presentKem = activeSession.attendanceKem?.length || 0;
    const totalPresent = presentMain + presentKem;
    const totalAbsent = totalStudents - totalPresent;

    return (
      <div className="page-content">
        <div className="page-topbar">
          <button className="btn-back" onClick={() => setStep(3)}>‹ Chọn lại buổi</button>
          <div className="page-topbar-title">Điểm Danh Ngày {fmtDate(activeSession.date)}</div>
        </div>

        {/* Start Cards */}
        <div className="stats-grid">
          <StatCard iconBg="rgba(139,92,246,0.1)" icon={<Icon name="users" size={20} />} label="Tổng sĩ số" value={totalStudents} sub="Học sinh" />
          <StatCard iconBg="rgba(22,163,74,0.1)" icon={<Icon name="check" size={20} />} label="Có mặt" value={totalPresent} sub="Học sinh" />
          <StatCard iconBg="rgba(239,68,68,0.1)" icon="❌" label="Vắng mặt" value={totalAbsent} sub="Học sinh" />
        </div>

        {/* Table */}
        <div className="table-section">
          <div className="table-header-row">
            <div className="table-title">Danh sách học sinh</div>
          </div>
          <div className="table-wrap">
            <table className="students-table">
              <thead>
                <tr>
                  <th className="center">STT</th>
                  <th>HỌ VÀ TÊN</th>
                  <th>TRẠNG THÁI</th>
                  <th className="center">CHÍNH / THÁNG</th>
                  <th className="center">KÈM / THÁNG</th>
                  <th className="center">TỔNG / THÁNG</th>
                </tr>
              </thead>
              <tbody>
                {activeClass.students.map((s, i) => {
                  const isMain = (activeSession.attendance || []).includes(s.id);
                  const isKem = (activeSession.attendanceKem || []).includes(s.id);
                  const stats = getMonthlyStats(s.id);
                  return (
                    <tr key={s.id} className="student-row" style={{cursor: 'default'}}>
                      <td className="center stt-cell">{i + 1}</td>
                      <td className="name-cell">{s.name}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="att-toggle-group">
                          <button className={`att-toggle-btn ${!isMain && !isKem ? "active absent" : ""}`}
                            onClick={() => {
                                // If currently Main or Kem, we toggle off.
                                if (isMain) toggleAttendance(s.id, 'main');
                                if (isKem) toggleAttendance(s.id, 'kem');
                            }}>Vắng</button>
                          <button className={`att-toggle-btn ${isMain ? "active present" : ""}`}
                            onClick={() => toggleAttendance(s.id, 'main')}>Có mặt</button>
                          {s.hasKem && (
                            <button className={`att-toggle-btn ${isKem ? "active kem" : ""}`}
                              onClick={() => toggleAttendance(s.id, 'kem')}>Kèm</button>
                          )}
                        </div>
                      </td>
                      <td className="center">{stats.main}</td>
                      <td className="center">{stats.kem}</td>
                      <td className="center bold">{stats.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────