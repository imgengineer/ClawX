import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./index.css";
import StepWelcome from "./components/StepWelcome";
import StepLicense from "./components/StepLicense";
import StepPath from "./components/StepPath";
import StepInstall from "./components/StepInstall";
import StepFinish from "./components/StepFinish";

const STEPS = [
  {
    title: "欢迎",
    caption: "了解离线安装器和安装前说明。",
  },
  {
    title: "许可协议",
    caption: "阅读并接受 ClawMate 的许可证条款。",
  },
  {
    title: "安装位置",
    caption: "选择用户目录中的安装路径和快捷方式选项。",
  },
  {
    title: "正在安装",
    caption: "解压离线包并写入桌面集成。",
  },
  {
    title: "完成",
    caption: "验证结果并立即启动 ClawMate。",
  },
] as const;

function App() {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState("");
  const [shortcut, setShortcut] = useState(true);
  const [licenseAccepted, setLicenseAccepted] = useState(false);

  const next = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));
  const closeWindow = () => {
    void getCurrentWindow().close();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--shell-bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-12%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(2,42,153,0.34),_transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[-14%] right-[-8%] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(252,132,22,0.24),_transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto flex h-screen max-w-[1360px] p-4 md:p-5">
        <div className="grid h-full w-full overflow-hidden rounded-[30px] border border-white/10 bg-[var(--shell-panel)] shadow-[0_32px_80px_rgba(4,14,20,0.28)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden border-r border-[var(--line-soft)] bg-[var(--panel-strong)] p-6">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),transparent_38%,transparent_62%,rgba(2,42,153,0.1))]" />
            <div className="relative min-h-0 space-y-5 overflow-y-auto pr-1">
              <div className="space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(145deg,var(--accent-strong),var(--accent-soft))] text-xl font-semibold tracking-[0.22em] text-white shadow-[0_16px_30px_rgba(2,42,153,0.28)]">
                  CM
                </div>
                <div className="space-y-2.5">
                  <p className="text-xs uppercase tracking-[0.38em] text-white/50">
                    Offline Setup Wizard
                  </p>
                  <h1 className="max-w-[13ch] text-[2.05rem] font-semibold leading-[1.04] text-white">
                    ClawMate 桌面安装向导
                  </h1>
                  <p className="text-[13px] leading-5 text-white/72">
                    面向当前用户目录的离线安装器，直接内嵌完整 Electron 包，无需额外下载。
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--card-soft)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">模式</div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">离线安装 / 无需管理员权限</div>
                </div>
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--card-soft)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">目标</div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">Windows / Linux / macOS</div>
                </div>
              </div>

              <ol className="space-y-2">
                {STEPS.map((item, index) => {
                  const state =
                    index < step ? "done" : index === step ? "active" : "pending";
                  return (
                    <li
                      key={item.title}
                      className={`rounded-2xl border px-4 py-2.5 transition-all ${
                        state === "active"
                          ? "border-[var(--accent-soft)] bg-[var(--card-active)] shadow-[0_16px_30px_rgba(2,42,153,0.14)]"
                          : state === "done"
                            ? "border-[var(--line-soft)] bg-[var(--card-soft)]"
                            : "border-transparent bg-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            state === "active"
                              ? "bg-[var(--accent-soft)] text-slate-950"
                              : state === "done"
                                ? "bg-[var(--success-soft)] text-slate-950"
                                : "border border-[var(--line-soft)] text-[var(--text-muted)]"
                          }`}
                        >
                          {state === "done" ? "✓" : index + 1}
                        </div>
                        <div className="space-y-0.5">
                          <div className={`text-sm font-medium ${state === "pending" ? "text-white/88" : "text-[var(--text-primary)]"}`}>
                            {item.title}
                          </div>
                          <div className={`text-xs leading-[1.35] ${state === "pending" ? "text-white/56" : "text-[var(--text-secondary)]"}`}>
                            {item.caption}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="relative px-1 text-[11px] leading-4 text-white/50">
              安装器会把 ClawMate 解压到当前账户的默认目录，并在可选情况下写入桌面快捷方式或启动菜单入口。
            </div>
          </aside>

          <main className="relative flex h-full min-h-0 flex-col bg-[var(--panel-main)]">
            <header
              className="flex items-center justify-between gap-6 border-b border-[var(--line-soft)] px-8 py-5"
            >
              <div data-tauri-drag-region className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">
                  Step {step + 1} / {STEPS.length}
                </div>
                <div className="mt-1 text-lg font-medium text-[var(--text-primary)]">{STEPS[step].title}</div>
              </div>
              <button
                type="button"
                onClick={closeWindow}
                className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
              >
                关闭
              </button>
            </header>

            <section className="min-h-0 flex-1 overflow-hidden px-8 py-7">
              {step === 0 && <StepWelcome onNext={next} />}
              {step === 1 && (
                <StepLicense
                  agreed={licenseAccepted}
                  onAgreedChange={setLicenseAccepted}
                  onNext={next}
                  onBack={back}
                />
              )}
              {step === 2 && (
                <StepPath
                  onNext={next}
                  onBack={back}
                  path={path}
                  setPath={setPath}
                  shortcut={shortcut}
                  setShortcut={setShortcut}
                />
              )}
              {step === 3 && <StepInstall onFinish={next} path={path} shortcut={shortcut} />}
              {step === 4 && <StepFinish path={path} />}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
