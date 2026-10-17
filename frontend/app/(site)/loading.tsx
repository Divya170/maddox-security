export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="dark">
        <div className="phero">
          <div>
            <div className="skel" style={{ height: 32, width: 180, borderRadius: 999, opacity: 0.15 }} />
            <div className="skel" style={{ height: 'clamp(48px,6vw,88px)', width: 'min(620px,92%)', opacity: 0.15 }} />
          </div>
          <div>
            <div className="skel" style={{ height: 18, width: '90%', opacity: 0.15 }} />
            <div className="skel" style={{ height: 18, width: '70%', opacity: 0.15 }} />
          </div>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 48 }}>
        <div className="skel" style={{ height: 'clamp(220px,30vw,380px)', borderRadius: 24 }} />
      </div>
    </div>
  );
}
