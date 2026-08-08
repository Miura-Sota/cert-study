import { useState } from "react";
import { storage } from "@/lib/storage";
import { TAB_LABEL, TUTORIAL_KEY, TUTORIAL_STEPS } from "@/lib/tutorial";
import type { AppState, AppTab } from "@/lib/types";

export function Tutorial({
  state,
  tab,
  setTab,
  open,
  setOpen,
}: {
  state: AppState;
  tab: AppTab;
  setTab: (t: AppTab) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const [logBaseline, setLogBaseline] = useState(state.logs.length);
  const [prevStepForBaseline, setPrevStepForBaseline] = useState(0);
  const [lastAutoAdvanced, setLastAutoAdvanced] = useState(-1);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStepIndex(0);
      setLogBaseline(state.logs.length);
      setPrevStepForBaseline(0);
      setLastAutoAdvanced(-1);
    }
  }

  if (!open) return null;

  const step = TUTORIAL_STEPS[stepIndex];

  if (stepIndex !== prevStepForBaseline) {
    setPrevStepForBaseline(stepIndex);
    setLogBaseline(state.logs.length);
  }

  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  const isDone = step.id === "log-study" ? state.logs.length > logBaseline : (step.isDone ? step.isDone(state) : false);

  if (step.kind === "action" && isDone && !isLast && lastAutoAdvanced !== stepIndex) {
    setLastAutoAdvanced(stepIndex);
    setStepIndex(stepIndex + 1);
  }

  const finish = () => {
    setOpen(false);
    void storage.set(TUTORIAL_KEY, "1");
  };

  const goNext = () => {
    if (isLast) { finish(); return; }
    const next = stepIndex + 1;
    setStepIndex(next);
    setTab(TUTORIAL_STEPS[next].tab);
  };
  const goBack = () => {
    const prev = Math.max(0, stepIndex - 1);
    setStepIndex(prev);
    setTab(TUTORIAL_STEPS[prev].tab);
  };

  return (
    <div className="rm-tut" role="dialog" aria-label="使い方ガイド">
      <div className="rm-tut-top">
        <span className="rm-tut-step">STEP {stepIndex + 1} / {TUTORIAL_STEPS.length}</span>
        <button className="rm-tut-close" aria-label="ガイドを閉じる" onClick={finish}>×</button>
      </div>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      {step.kind === "action" && isDone && <div className="rm-tut-done">✓ できました</div>}
      <div className="rm-tut-row">
        {tab !== step.tab && (
          <button className="rm-tut-btn" onClick={() => setTab(step.tab)}>「{TAB_LABEL[step.tab]}」タブを開く</button>
        )}
        {stepIndex > 0 && <button className="rm-tut-btn quiet" onClick={goBack}>戻る</button>}
        <button className="rm-tut-btn pri" style={{ marginLeft: "auto" }} onClick={goNext}>{isLast ? "閉じる" : "次へ"}</button>
      </div>
    </div>
  );
}
