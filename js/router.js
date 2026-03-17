// HASH ROUTER
// ─────────────────────────────────────────────────────────────────
function useHashRouter() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const handler = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);
  return { hash, navigate };
}

function parseHash(hash) {
  const path = hash.replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  return { path, parts };
}

