export function Splash() {
  return (
    <div class="screen splash" role="status" aria-label="Cargando">
      <div style={{ height: 120 }} />
      <img src="./icons/splash-figure.png" alt="" width={220} height={220} />
      <div class="loader"><div /></div>
    </div>
  );
}
