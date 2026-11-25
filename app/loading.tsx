export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Carregando">
      <div className="topo"><div className="sk" style={{ width: 110, height: 28 }} /></div>
      <div className="sk" style={{ height: 140, borderRadius: 22 }} />
      <div className="atalhos">
        {[0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ aspectRatio: "1", borderRadius: 18 }} />)}
      </div>
      <div className="sk" style={{ height: 18, width: 160, margin: "20px 0 10px" }} />
      <div className="sk" style={{ height: 260 }} />
    </main>
  );
}
