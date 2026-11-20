import Link from "next/link";

const steps = [
  ["Compare your CV", "See which job requirements your experience supports and where your CV needs clearer evidence."],
  ["Practice for the role", "Get feedback on your answers and work through exercises that address the specific skills you missed."],
  ["Review your revised CV", "Once you meet the preparation criteria, review the suggested changes and download a CV tailored to the role."],
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
      <main id="main">
        <section className="shell hero" aria-labelledby="hero-title">
          <div>
            <p className="label">Career preparation</p>
            <h1 id="hero-title">Prepare for the role you want.</h1>
            <p className="intro">Compare your CV with a job description, practice the skills that role requires, and build a revised CV backed by your experience.</p>
            <a className="button" href="#how-it-works">See how it works</a>
          </div>
          <aside className="example" aria-labelledby="example-title">
            <p className="label">Example preparation</p>
            <h2 id="example-title">Reporting Analyst Intern</h2>
            <dl>
              <div><dt>Job requirement</dt><dd>Build reports using SQL joins</dd></div>
              <div><dt>CV evidence</dt><dd>Database project with grouped reports</dd></div>
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
