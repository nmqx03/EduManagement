// TIME PICKER — Custom dropdown giờ 0-23 + phút (không dùng native select)
// ─────────────────────────────────────────────────────────────────

function TimeDropdown({ options, value, onChange, width = 68 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll to selected item when dropdown opens
  const listRef = useRef(null);
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) selected.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <div ref={ref} style={{position:'relative', width}}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', padding:'9px 10px', border:'1.5px solid #bfdbfe',
          borderRadius:9, fontSize:15, fontWeight:700, background:'#fff',
          cursor:'pointer', textAlign:'center', color:'#1f2937',
          display:'flex', alignItems:'center', justifyContent:'center', gap:4,
          outline:'none', transition:'border-color 0.15s',
          ...(open ? {borderColor:'#4f7fff', boxShadow:'0 0 0 3px rgba(79,127,255,0.12)'} : {})
        }}
      >
        {value}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4a0b4" strokeWidth="2.5" style={{marginLeft:2, flexShrink:0, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.15s'}}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <ul ref={listRef} style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:200,
          background:'#fff', border:'1.5px solid #bfdbfe', borderRadius:10,
          boxShadow:'0 8px 24px rgba(79,127,255,0.18)',
          maxHeight:200, overflowY:'auto', overflowX:'hidden',
          padding:'4px 0', margin:0, listStyle:'none', width:'100%',
          scrollbarWidth:'thin', scrollbarColor:'#bfdbfe transparent'
        }}>
          {options.map(opt => {
            const isSel = opt.value === value;
            return (
              <li key={opt.value}
                data-selected={isSel}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding:'7px 10px', fontSize:14, fontWeight: isSel ? 700 : 500,
                  cursor:'pointer', textAlign:'center',
                  background: isSel ? 'linear-gradient(135deg,#4f7fff,#2563eb)' : 'transparent',
                  color: isSel ? '#fff' : '#374151',
                  borderRadius: isSel ? 6 : 0, margin: isSel ? '0 4px' : 0,
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='#fff5f8'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent'; }}
              >{opt.label}</li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TimePicker({ label, value, onChange }) {
  const [h, m] = (value || "00:00").split(":").map(Number);

  const hourOpts = Array.from({length:24}, (_, i) => ({
    value: String(i).padStart(2,"0") + "h",
    label: String(i).padStart(2,"0") + "h"
  }));
  const minOpts = [0,5,10,15,20,25,30,35,40,45,50,55].map(min => ({
    value: String(min).padStart(2,"0") + "p",
    label: String(min).padStart(2,"0")
  }));

  const curH = String(h).padStart(2,"0") + "h";
  const curM = String(m).padStart(2,"0") + "p";

  const update = (newH, newM) => {
    const hh = newH.replace("h","");
    const mm = newM.replace("p","");
    onChange(`${hh}:${mm}`);
  };

  return (
    <div>
      {label && <label className="form-label">{label}</label>}
      <div style={{display:'flex', alignItems:'center', gap:5}}>
        <TimeDropdown options={hourOpts} value={curH} onChange={v => update(v, curM)} width={72} />
        <span style={{fontWeight:700, color:'#d4a0b4', fontSize:16}}>:</span>
        <TimeDropdown options={minOpts} value={curM} onChange={v => update(curH, v)} width={64} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
