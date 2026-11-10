const EXPORT_SIZE = { '16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920] };

function AgencyPiece({ clip, W }) {
  const { T } = useComposition();
  const P = window.AgencyPieces;
  P.setUnit(W / 100, 'px');
  const t = Math.max(0, Math.min(T, clip.dur - 0.001));
  return <div style={{ position: 'absolute', inset: 0 }}>{clip.fn(t)}</div>;
}

function AgencyExport({ piece }) {
  const P = window.AgencyPieces;
  if (!P) return <div style={{ color: '#fff', font: '14px sans-serif', padding: 20 }}>Loading…</div>;
  P.init(React);
  const clip = P.CLIPS.find(c => c.code === piece) || P.CLIPS[0];
  const [W, H] = EXPORT_SIZE[clip.aspect];
  return (
    <CompositionStage width={W} height={H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={window.AGENCY_ALPHA ? "transparent" : "#FFFFFF"}>
      <AgencyPiece clip={clip} W={W} />
    </CompositionStage>
  );
}

window.AgencyExport = AgencyExport;
