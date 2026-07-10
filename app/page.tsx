const foundations = [
  "Source-linked metrics",
  "Visible confidence and freshness",
  "Gross versus net economic flows",
  "Human-reviewed publication"
];

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary navigation">
        <span className="brand">
          <span className="logo-mark" aria-hidden="true" />
          AI Economy Ledger
        </span>
        <span className="runtime-badge">Cloudflare runtime scaffold</span>
      </nav>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Open-source accounting for the AI economy</p>
        <h1 id="page-title">Track the math behind the AI economy.</h1>
        <p className="lede">
          AI Economy Ledger is being built as an auditable model of capital, revenue, debt, compute commitments,
          and circularity. Every future metric will carry sources, review state, and visible uncertainty.
        </p>
      </section>

      <section className="notice" aria-label="Development status">
        <strong>Foundation release:</strong> the application runtime is connected, but no financial figures are
        published yet. Sample data will remain clearly isolated from verified data.
      </section>

      <section className="foundation-grid" aria-label="Product foundations">
        {foundations.map((foundation) => (
          <article className="foundation-card" key={foundation}>
            <span className="card-index" aria-hidden="true">◆</span>
            <h2>{foundation}</h2>
            <p>Planned as a tested, documented boundary in the public ledger.</p>
          </article>
        ))}
      </section>

      <footer>
        <span>aieconomyledger.com</span>
        <span>No investment advice · No verified financial data yet</span>
      </footer>
    </main>
  );
}
