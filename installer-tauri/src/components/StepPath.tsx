import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

function normalizeMacBundlePath(selected: string, referencePath: string) {
  if (!referencePath.endsWith(".app") || selected.endsWith(".app")) {
    return selected;
  }

  return `${selected.replace(/\/+$/, "")}/ClawMate.app`;
}

export default function StepPath({
  onNext,
  onBack,
  path,
  setPath,
  shortcut,
  setShortcut
}: { 
  onNext: () => void;
  onBack: () => void;
  path: string;
  setPath: (p: string) => void;
  shortcut: boolean;
  setShortcut: (s: boolean) => void;
}) {
  const [defaultPath, setDefaultPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setLoading(true);
      invoke<string>("get_default_install_dir")
        .then((dir) => {
          setDefaultPath(dir);
          setPath(dir);
        })
        .catch((invokeError) => {
          setError(String(invokeError));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [path, setPath]);

  const handleBrowse = async () => {
    setError(null);

    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected && typeof selected === "string") {
      setPath(normalizeMacBundlePath(selected, defaultPath || path));
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
      <div className="min-h-0 space-y-6 overflow-y-auto pr-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">选择安装位置</h2>
          <p className="max-w-[58ch] text-sm leading-7 text-[var(--text-secondary)]">
            安装器默认会使用当前系统推荐的用户目录。你也可以改成自定义位置；在 macOS 上会自动规范为 `ClawMate.app` 应用包路径。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-5">
            <label className="mb-3 block text-sm font-medium text-[var(--text-primary)]">
              目标目录
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={path}
                onChange={(event) => setPath(event.target.value)}
                placeholder={loading ? "正在探测默认安装目录..." : "输入或选择安装路径"}
                className="min-w-0 flex-1 rounded-2xl border border-[var(--line-soft)] bg-[rgba(7,17,23,0.18)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-soft)]"
                autoFocus
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="rounded-2xl border border-[var(--line-soft)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--line-strong)]"
              >
                浏览
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
              <span className="rounded-full border border-[var(--line-soft)] px-3 py-1.5">
                预计占用约 450 MB
              </span>
              <span className="rounded-full border border-[var(--line-soft)] px-3 py-1.5">
                当前用户级安装
              </span>
              {(defaultPath || path).endsWith(".app") && (
                <span className="rounded-full border border-[var(--line-soft)] px-3 py-1.5">
                  macOS 应用包路径
                </span>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm leading-6 text-[var(--danger-strong)]">{error}</p>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[linear-gradient(160deg,rgba(2,42,153,0.14),rgba(252,132,22,0.08))] p-5">
            <div className="text-sm font-medium text-[var(--text-primary)]">可选集成</div>
            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <input
                type="checkbox"
                checked={shortcut}
                onChange={(event) => setShortcut(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--line-strong)] bg-transparent text-[var(--accent-strong)] focus:ring-[var(--accent-soft)]"
              />
              <span className="text-sm leading-7 text-[var(--text-primary)]">
                为 ClawMate 创建快捷方式
              </span>
            </label>
            <p className="mt-4 text-xs leading-6 text-[var(--text-secondary)]">
              Windows 会写入桌面和开始菜单。Linux 会生成 `.desktop` 文件。macOS 保持应用包安装，不额外创建快捷方式。
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-[var(--line-soft)] px-6 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!path || loading}
          className="rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent-soft))] px-7 py-3 text-sm font-medium text-white shadow-[0_16px_28px_rgba(2,42,153,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          开始安装
        </button>
      </div>
    </div>
  );
}
