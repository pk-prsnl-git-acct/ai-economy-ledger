"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="app-shell"><section className="panel quality-lead" role="alert">
    <p className="panel-label">Data service degraded</p>
    <h1>Verified release data is temporarily unavailable</h1>
    <p>The application failed closed because the production release or its integrity proof could not be verified. No partial or fixture data has been substituted.</p>
    <div className="hero-actions"><button className="primary-action" onClick={reset} type="button">Try again</button><Link className="secondary-action" href="/methodology">View methodology</Link></div>
  </section></main>;
}
