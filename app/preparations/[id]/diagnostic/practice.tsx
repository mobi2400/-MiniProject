"use client";

import { useState } from "react";

export function JoinPractice() {
  const [choice, setChoice] = useState("");
  const [checked, setChecked] = useState(false);
  return (
    <section className="fields" aria-labelledby="practice-title">
      <h2 id="practice-title">Practice keeping unmatched rows</h2>
      <p>A student has no recorded attendance. An inner join drops that student. A left join starting from the student list keeps the student and leaves attendance columns empty.</p>
      <form className="fields" onSubmit={(event) => { event.preventDefault(); setChecked(true); }}>
        <label>
          Which rows should you preserve when showing every course, including courses with no enrolments?
          <select required value={choice} onChange={(event) => { setChoice(event.target.value); setChecked(false); }}>
            <option value="">Choose an answer</option>
            <option value="course">All course rows</option>
            <option value="enrolment">Only enrolment rows</option>
          </select>
        </label>
        <button className="button">Check practice answer</button>
      </form>
      {checked && <p role="status">{choice === "course"
        ? "Correct. Start from courses and left join enrolments."
        : "Try again. An enrolment-only result cannot include a course with no enrolments."}</p>}
    </section>
  );
}
