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
    4: `/preparations/${preparationId}/reassessment`,
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
          const isLocked = s.step > currentStep;
          const label = isDone ? `Completed: ${s.name}` : isLocked ? `${s.name} · Not yet` : s.name;
          const content = (
            <>
              <span className="step-badge">{isDone ? "✓" : s.step}</span>
              <span className="step-label">{label}</span>
            </>
          );

          return (
            <li
              key={s.step}
              className={`journey-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""} ${isLocked ? "is-locked" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isDone ? (
                <Link href={stageLinks[s.step]}>{content}</Link>
              ) : (
                <span className="journey-static">{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
