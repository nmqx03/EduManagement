// HOMEPAGE
// ─────────────────────────────────────────────────────────────────

function HomePage({ onNavigate }) {
  const profile = loadProfile();
  const logoSrc = profile.logoDataUrl || "images/logo2.png";
  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-icon">
          <img src={logoSrc} alt="Logo" style={{ maxWidth: 400, height: "auto" }} onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        
      </div>
      <div className="home-cards">
        <button className="home-card" onClick={() => onNavigate("attendance")}>
          <div className="home-card-icon hc-blue"><Icon name="notebook" size={32} /></div>
          <div className="home-card-body">
            <div className="home-card-title">Điểm Danh</div>
            <div className="home-card-desc">Quản lý lớp, điểm danh theo buổi</div>
          </div>
          <div className="home-card-arrow">→</div>
        </button>
        <button className="home-card" onClick={() => onNavigate("tuition")}>
          <div className="home-card-icon hc-pink"><Icon name="money" size={32} /></div>
          <div className="home-card-body">
            <div className="home-card-title">Học Phí</div>
            <div className="home-card-desc">Tính học phí theo tháng, năm</div>
          </div>
          <div className="home-card-arrow">→</div>
        </button>
        <button className="home-card" onClick={() => onNavigate("students")}>
          <div className="home-card-icon hc-purple"><Icon name="users" size={32} /></div>
          <div className="home-card-body">
            <div className="home-card-title">Danh sách học sinh</div>
            <div className="home-card-desc">Quản lý danh sách học sinh theo lớp</div>
          </div>
          <div className="home-card-arrow">→</div>
        </button>
        <button className="home-card" onClick={() => onNavigate("timetable")}>
          <div className="home-card-icon hc-green"><Icon name="calendar" size={32} /></div>
          <div className="home-card-body">
            <div className="home-card-title">Thời Khóa Biểu</div>
            <div className="home-card-desc">Sắp xếp lịch học theo tuần</div>
          </div>
          <div className="home-card-arrow">→</div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
