import Link from "next/link";
import { STAGES } from "../lib/journey";

export function JourneyBar({
  currentStep,
  preparationId,
}: {
  currentStep: number;
  preparationId: string;
}) {
  const stageLinks: Record<number, string> = {
    1: `/preparations/${preparationId}/setup`,
    2: `/preparations/${preparationId}/setup`,
    3: `/preparations/${preparationId}/analysis`,
    4: `/preparations/${preparationId}/diagnostic`,
    5: `/preparations/${preparationId}/revised-cv`,
  };

  const currentStage = STAGES.find((s) => s.step === currentStep) ?? STAGES[0];

  return (
    <nav className="journey-bar" aria-label="Preparation journey">
      <div className="journey-summary">
        <span className="step-count">Step {currentStep} of 5:</span>{" "}
        <strong className="step-name">{currentStage.name}</strong>
      </div>
      <ol className="journey-steps">
        {STAGES.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const link = stageLinks[s.step];

          return (
            <li
              key={s.step}
              className={`journey-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <Link href={link}>
                <span className="step-badge">{isDone ? "✓" : s.step}</span>
                <span className="step-label">
                  {isDone ? `Completed: ${s.name}` : s.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
