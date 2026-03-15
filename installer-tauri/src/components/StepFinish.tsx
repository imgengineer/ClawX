import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function StepFinish({ path }: { path: string }) {
  const [launchChecked, setLaunchChecked] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (launchChecked) {
        await invoke("launch_app", { targetDir: path });
      }
      await getCurrentWindow().close();
    } catch (invokeError) {
      setError(String(invokeError));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
      <div className="min-h-0 space-y-6 overflow-y-auto pr-2">
        <div className="flex items-center gap-5">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(160deg,rgba(2,42,153,0.26),rgba(252,132,22,0.18))] text-[var(--success-soft)] shadow-[0_18px_36px_rgba(2,42,153,0.2)]">
            <div className="absolute inset-[-8px] rounded-full border border-[rgba(252,132,22,0.26)] animate-[installerPulse_1.8s_ease-out_infinite]" />
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">完成</p>
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">ClawMate 已准备就绪</h2>
            <p className="max-w-[52ch] text-sm leading-7 text-[var(--text-secondary)]">
              安装器已经完成离线解压。你现在可以直接启动 ClawMate，或者关闭向导后稍后从安装目录和快捷方式入口打开它。
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">安装位置</div>
          <div className="mt-3 break-all rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-4 font-mono text-sm leading-7 text-[var(--text-primary)]">
            {path}
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--line-soft)] bg-[rgba(2,42,153,0.08)] px-4 py-4">
            <input
              type="checkbox"
              checked={launchChecked}
              onChange={(event) => setLaunchChecked(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--line-strong)] bg-transparent text-[var(--accent-strong)] focus:ring-[var(--accent-soft)]"
            />
            <span className="text-sm leading-7 text-[var(--text-primary)]">完成后立即运行 ClawMate</span>
          </label>
          {error && (
            <p className="mt-4 text-sm leading-6 text-[var(--danger-strong)]">{error}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--text-secondary)]">
          关闭安装器不会移除任何已解压文件。
        </div>
        <button
          type="button"
          onClick={handleLaunch}
          disabled={submitting}
          className="rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent-soft))] px-7 py-3 text-sm font-medium text-white shadow-[0_16px_28px_rgba(2,42,153,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {submitting ? "正在收尾..." : launchChecked ? "完成并运行 ClawMate" : "完成"}
        </button>
      </div>
    </div>
  );
}
