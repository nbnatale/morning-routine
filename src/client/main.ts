import './styles.css'

const app = document.querySelector<HTMLDivElement>('#app')!

// Phase 0 placeholder — replaced in Phase 1 with the full SPA
app.innerHTML = `
  <div style="
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:100dvh;gap:12px;padding:24px;text-align:center;
  ">
    <div style="font-family:'Fraunces',serif;font-size:28px;font-weight:500;color:var(--ink)">
      Morning Routine<span style="color:var(--brass)">.</span>
    </div>
    <p style="color:var(--muted);font-size:14px">Phase 0 — skeleton</p>
  </div>
`
