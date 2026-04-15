export default function QRViewer({ qrCodeDataUrl, verificationUrl }) {
  if (!qrCodeDataUrl) {
    return null;
  }

  return (
    <div className="glass-panel rounded-xl p-5 fade-in-up">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slateui-500">QR Verification</p>
      <div className="mt-4 flex flex-col items-center gap-4 text-center">
        <img src={qrCodeDataUrl} alt="Certificate verification QR code" className="h-56 w-56 rounded-2xl border border-slateui-200 bg-white p-3 shadow-sm" />
        {verificationUrl ? <p className="max-w-md break-all rounded-xl bg-slateui-50 px-3 py-2 text-sm text-slateui-600">{verificationUrl}</p> : null}
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slateui-400">Scan to verify instantly</p>
      </div>
    </div>
  );
}