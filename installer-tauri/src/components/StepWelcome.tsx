export default function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
      <div className="min-h-0 space-y-5 overflow-y-auto pr-2">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.38em] text-[var(--text-muted)]">
            ClawMate Premium Installer
          </p>
          <h2 className="max-w-[15ch] text-[clamp(2.3rem,4vw,3.45rem)] font-semibold leading-[0.98] text-[var(--text-primary)]">
            欢迎使用 ClawMate AI 助手安装向导
          </h2>
          <p className="max-w-[56ch] text-sm leading-6 text-[var(--text-secondary)]">
            该向导会把完整的离线版 ClawMate 安装到当前用户目录。无需提权，不依赖外部下载，适合在受限网络或批量分发场景下直接交付。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-4">
            <div className="text-sm font-medium text-[var(--text-primary)]">离线完整包</div>
            <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              安装器内嵌当前架构对应的 Electron 主程序，不需要安装时联网拉取资源。
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-4">
            <div className="text-sm font-medium text-[var(--text-primary)]">当前用户安装</div>
            <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              默认写入用户主目录，避免弹出管理员权限提示，适合快速分发和自助安装。
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-4">
            <div className="text-sm font-medium text-[var(--text-primary)]">跨平台流程</div>
            <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              向导会根据当前系统选择默认路径，并在支持的平台上补齐桌面或开始菜单入口。
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--line-soft)] bg-[linear-gradient(135deg,rgba(2,42,153,0.16),rgba(252,132,22,0.1))] p-4">
          <div className="text-sm font-medium text-[var(--text-primary)]">安装前建议</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            如果当前已经运行旧版 ClawMate，建议先退出应用后再继续。这样可以避免文件被占用，保证安装过程稳定完成。
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent-soft))] px-7 py-3 text-sm font-medium text-white shadow-[0_16px_28px_rgba(2,42,153,0.24)] transition hover:translate-y-[-1px]"
        >
          开始安装
        </button>
      </div>
    </div>
  );
}
