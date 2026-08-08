"use client";

import { useEffect, useState } from "react";
import { DeleteAccountDialog } from "@/components/auth/DeleteAccountDialog";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/lib/auth-context";
import { ROADMAPS } from "@/lib/data";
import { storage } from "@/lib/storage";
import { TUTORIAL_KEY } from "@/lib/tutorial";
import type { AppState, AppTab } from "@/lib/types";
import { DEFAULT_STATE } from "@/lib/utils";
import "./cert-study.css";
import { AccountMenu } from "./AccountMenu";
import { ContactDialog } from "./ContactDialog";
import { HomeTab } from "./HomeTab";
import { MapTab } from "./MapTab";
import { PlanTab } from "./PlanTab";
import { MaterialTab } from "./MaterialTab";
import { LogTab } from "./LogTab";
import { Tutorial } from "./Tutorial";

const KEY = "certstudy:v1";

export default function CertStudy() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [tab, setTab] = useState<AppTab>("home");
  const [loading, setLoading] = useState(true);
  const [saveErr, setSaveErr] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(KEY);
        if (r && r.value) {
          const v = JSON.parse(r.value);
          setState({ ...DEFAULT_STATE, ...v, target: { ...DEFAULT_STATE.target, ...(v.target || {}) } });
        }
      } catch {
        /* 初回 */
      }
      try {
        const seen = await storage.get(TUTORIAL_KEY);
        if (!seen) setTutorialOpen(true);
      } catch {
        /* 初回 */
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        await storage.set(KEY, JSON.stringify(state));
        setSaveErr("");
      } catch {
        setSaveErr("記録を保存できませんでした。通信状態を確認して、もう一度操作してください。");
      }
    })();
  }, [state, loading]);

  const rm = ROADMAPS.find((r) => r.id === state.goal) || ROADMAPS[0];

  if (authLoading) {
    return (
      <div className="rm">
        <div className="rm-wrap"><p style={{ color: "#6B6A67", paddingTop: 40 }}>読み込んでいます…</p></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <div className="rm">
        <div className="rm-wrap"><p style={{ color: "#6B6A67", paddingTop: 40 }}>読み込んでいます…</p></div>
      </div>
    );
  }

  return (
    <div className="rm" style={{ "--c": rm.color } as React.CSSProperties}>
      <div className="rm-wrap">
        <header className="rm-head">
          <div>
            <h1>資格ロードマップ</h1>
            <p>働きながら資格を取るための、計画・教材・記録がつながるノート。</p>
          </div>
          <div className="rm-head-tools">
            <button className="rm-btn quiet sm" onClick={() => setTutorialOpen(true)}>
              使い方を見る
            </button>
            <AccountMenu onDeleteAccount={() => setDeleteOpen(true)} onContact={() => setContactOpen(true)} />
          </div>
        </header>

        <nav className="rm-tabs">
          {([["home", "ホーム"], ["map", "ロードマップ"], ["plan", "計画"], ["mat", "教材"], ["log", "記録"]] as [AppTab, string][]).map(([k, v]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{v}</button>
          ))}
        </nav>

        {saveErr && <p className="rm-note rm-bad" style={{ marginTop: 12 }}>{saveErr}</p>}

        {tab === "home" && <HomeTab state={state} setState={setState} rm={rm} go={setTab} />}
        {tab === "map" && <MapTab state={state} setState={setState} rm={rm} goPlan={() => setTab("plan")} />}
        {tab === "plan" && <PlanTab state={state} setState={setState} rm={rm} goMap={() => setTab("map")} />}
        {tab === "mat" && <MaterialTab state={state} setState={setState} />}
        {tab === "log" && <LogTab state={state} setState={setState} rm={rm} goMat={() => setTab("mat")} goMap={() => setTab("map")} />}
      </div>

      <footer className="rm-foot">
        <span>受験料・出題範囲・試験日程は変更されます。申込前に各試験の公式ページで確認してください。</span>
        <button className="rm-btn quiet sm" style={{ marginLeft: "auto" }}
          onClick={() => { if (window.confirm("すべての記録を消します。元に戻せません。")) setState(DEFAULT_STATE); }}>
          記録をすべて消す
        </button>
      </footer>

      <Tutorial state={state} tab={tab} setTab={setTab} open={tutorialOpen} setOpen={setTutorialOpen} />
      <DeleteAccountDialog open={deleteOpen} setOpen={setDeleteOpen} />
      <ContactDialog open={contactOpen} setOpen={setContactOpen} />
    </div>
  );
}
