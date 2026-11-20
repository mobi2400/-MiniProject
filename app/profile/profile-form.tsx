"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "./actions";

export function ProfileForm({ name, goal }: { name: string; goal: string }) {
  const [message, action, pending] = useActionState(saveProfile, "");
  const [displayName, setDisplayName] = useState(name);
  const [careerGoal, setCareerGoal] = useState(goal);
  return (
    <form action={action} className="fields">
      <label>Name <input name="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" maxLength={100} required /></label>
      <label>Career goal (optional) <input name="careerGoal" value={careerGoal} onChange={(event) => setCareerGoal(event.target.value)} maxLength={200} /></label>
      {message && <p role={message === "Profile saved." ? "status" : "alert"}>{message}</p>}
      <button className="button" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
