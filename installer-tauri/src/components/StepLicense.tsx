import licenseText from "../../../LICENSE?raw";

export default function StepLicense({
  agreed,
  onAgreedChange,
  onNext,
  onBack,
}: {
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
      <div className="min-h-0 flex flex-col gap-5">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">许可协议</h2>
          <p className="max-w-[54ch] text-sm leading-7 text-[var(--text-secondary)]">
            请先阅读 ClawMate 的许可证条款。安装向导会直接加载仓库根目录中的 `LICENSE` 内容，确保打包时和产品主体保持一致。
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--card-soft)] p-1">
          <div className="h-full overflow-y-auto rounded-[24px] bg-[rgba(5,15,20,0.18)] px-5 py-5">
            <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-[var(--text-secondary)]">
              {licenseText}
            </pre>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--card-soft)] px-4 py-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => onAgreedChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--line-strong)] bg-transparent text-[var(--accent-strong)] focus:ring-[var(--accent-soft)]"
          />
          <span className="text-sm leading-7 text-[var(--text-primary)]">
            我已阅读并接受许可证协议，同意按当前条款安装 ClawMate。
          </span>
        </label>
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
          disabled={!agreed}
          className="rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent-soft))] px-7 py-3 text-sm font-medium text-white shadow-[0_16px_28px_rgba(2,42,153,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          继续
        </button>
      </div>
    </div>
  );
}
