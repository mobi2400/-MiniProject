import Link from "next/link";

const steps = [
  ["Job & CV", "Save a job you're preparing for and upload your CV as a PDF, Word file, or .txt file."],
  ["CV match", "See which requirements your experience supports and where your CV needs clearer evidence."],
  ["Practice & Revised CV", "Complete skill checks with instant feedback and download a revised CV highlighting relevant experience."],
] as const;

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="shell header">
        <Link className="brand" href="/">MiniProject</Link>
        <nav className="header-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/account">Sign in</Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="shell hero" aria-labelledby="hero-title">
          <div>
            <p className="label">Career preparation</p>
            <h1 id="hero-title">Prepare for the role you want.</h1>
            <p className="intro">Compare your CV with a job description, practice the skills that role requires, and build a revised CV backed by your experience.</p>
            
            <div style={{ marginBlock: "1.25rem", padding: "1rem", background: "#f2effb", borderRadius: "0.5rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>Before you start, have ready:</p>
              <ul style={{ margin: 0, paddingInlineStart: "1.25rem", color: "var(--muted)" }}>
                <li>A job description you want to apply for</li>
                <li>Your CV as a PDF, Word file, or .txt file</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link className="button" href="/account?mode=register">Create free account</Link>
              <Link className="button button-secondary" href="/account">Sign in</Link>
            </div>
          </div>
          <aside className="example" aria-labelledby="example-title">
            <p className="label">Example preparation</p>
            <h2 id="example-title">Reporting Analyst Intern</h2>
            <dl>
              <div><dt>Job requirement</dt><dd>Build reports using SQL joins</dd></div>
              <div><dt>Experience from your CV</dt><dd>Database project with grouped reports</dd></div>
              <div><dt>Next exercise</dt><dd>Keep categories with no sales in a report</dd></div>
            </dl>
          </aside>
        </section>
        <section className="workflow" id="how-it-works" aria-labelledby="workflow-title">
          <div className="shell">
            <h2 id="workflow-title">From job description to revised CV</h2>
            <ol className="steps">
              {steps.map(([title, description]) => (
                <li key={title}><h3>{title}</h3><p>{description}</p></li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <footer className="shell footer">MiniProject · Career preparation for students and job seekers</footer>
    </>
  );
}
