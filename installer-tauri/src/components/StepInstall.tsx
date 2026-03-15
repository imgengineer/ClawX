import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface InstallProgressEvent {
  percentage: number;
  processed_files: number;
  total_files: number;
  current_file: string;
}

export default function StepInstall({
  onFinish,
  path,
  shortcut,
}: {
  onFinish: () => void;
  path: string;
  shortcut: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFile, setCurrentFile] = useState("正在准备离线安装资源...");
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;
    let finishTimer: number | undefined;

    const startInstallation = async () => {
      try {
        unlisten = await listen<InstallProgressEvent>("install-progress", (event) => {
          if (cancelled) {
            return;
          }

          setProgress(event.payload.percentage);
          setProcessedFiles(event.payload.processed_files);
          setTotalFiles(event.payload.total_files);
          setCurrentFile(event.payload.current_file);
          setRecentFiles((current) => {
            const nextValue = [
              event.payload.current_file,
              ...current.filter((value) => value !== event.payload.current_file),
            ];
            return nextValue.slice(0, 6);
          });
        });

        await invoke("start_installation", {
          targetDir: path,
          createShortcut: shortcut,
        });

        if (cancelled) {
          return;
        }

        setProgress(100);
        setCurrentFile("ClawMate 已完成安装。");
        finishTimer = window.setTimeout(onFinish, 900);
      } catch (invokeError) {
        if (!cancelled) {
          setError(String(invokeError));
        }
      }
    };

    void startInstallation();

    return () => {
      cancelled = true;
      if (typeof finishTimer === "number") {
        window.clearTimeout(finishTimer);
      }
      if (unlisten) {
        void unlisten();
      }
    };
  }, [path, shortcut, onFinish]);

  const handleClose = () => {
    void getCurrentWindow().close();
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
      <div className="min-h-0 space-y-6 overflow-y-auto pr-2">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">安装中</p>
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">
            {error ? "安装失败" : progress >= 100 ? "安装完成" : "正在铺设 ClawMate"}
          </h2>
          <p className="max-w-[60ch] text-sm leading-7 text-[var(--text-secondary)]">
            {error
              ? "离线包解压或快捷方式创建过程中出现错误，请先检查提示信息。"
              : "正在把内嵌的 Electron 主程序解压到目标目录，并为当前系统补齐必要的桌面集成。"}
          </p>
        </div>

        <div className="rounded-[30px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.32em] text-[var(--text-muted)]">
                {error ? "错误信息" : "当前文件"}
              </div>
              <div className="break-all text-sm leading-7 text-[var(--text-primary)]">
                {error ? error : currentFile}
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(2,42,153,0.1)] text-lg font-semibold text-[var(--text-primary)]">
              {progress}%
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[rgba(6,18,25,0.14)]">
            <div
              className={`relative h-full rounded-full transition-[width] duration-300 ${
                error
                  ? "bg-[linear-gradient(90deg,var(--danger-strong),#f2994a)]"
                  : "bg-[linear-gradient(90deg,var(--accent-strong),var(--accent-soft))]"
              } after:absolute after:inset-y-0 after:right-0 after:w-24 after:animate-[installerShimmer_1.35s_linear_infinite] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <span>已处理 {processedFiles} / {totalFiles || "?"} 个条目</span>
            <span className="break-all sm:text-right">{path}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-5">
            <div className="text-sm font-medium text-[var(--text-primary)]">状态</div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]" />
                正在解压内嵌 payload.zip
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-soft)]" />
                同步当前平台的可执行文件布局
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--success-soft)]" />
                {shortcut ? "创建快捷方式与菜单入口" : "跳过快捷方式创建"}
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--text-primary)]">最近处理的文件</div>
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">实时</div>
            </div>
            <div className="mt-4 grid gap-2">
              {recentFiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line-soft)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                  等待 Rust 后端发出解压进度事件...
                </div>
              ) : (
                recentFiles.map((file) => (
                  <div
                    key={file}
                    className="rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 font-mono text-xs leading-6 text-[var(--text-secondary)]"
                  >
                    {file}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClose}
          disabled={!error}
          className="rounded-full border border-[var(--line-soft)] px-6 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          {error ? "关闭安装器" : "安装进行中"}
        </button>
      </div>
    </div>
  );
}
