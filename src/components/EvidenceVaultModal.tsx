import React, { useState, useEffect } from 'react';
import { Shield, Film, Send, Download, Trash2, X, MapPin, CheckCircle, ExternalLink } from 'lucide-react';
import { getEvidenceRecords, getDispatchLogs } from '../services/storage';
import { EvidenceRecord, DispatchLog } from '../types/safeov';

interface EvidenceVaultModalProps {
  onClose: () => void;
}

export const EvidenceVaultModal: React.FC<EvidenceVaultModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'evidence' | 'logs'>('evidence');
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([]);

  useEffect(() => {
    setEvidenceList(getEvidenceRecords());
    setDispatchLogs(getDispatchLogs());
  }, []);

  const handleClearEvidence = () => {
    if (confirm('Are you sure you want to clear stored evidence logs?')) {
      localStorage.removeItem('SafeOV_Evidence');
      localStorage.removeItem('SafeOV_DispatchLogs');
      setEvidenceList([]);
      setDispatchLogs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-3xl p-6 flex flex-col max-h-[85vh] shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Incident &amp; Evidence Vault</h2>
              <p className="text-xs text-slate-400">Captured camera evidence and emergency dispatch logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mt-4 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setTab('evidence')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'evidence'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Camera Evidence ({evidenceList.length})
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            Dispatch Logs ({dispatchLogs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {tab === 'evidence' ? (
            evidenceList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No video evidence recorded yet.
                <p className="text-[11px] text-slate-600 mt-1">
                  Trigger SOS in MainActivity to record camera and audio evidence automatically.
                </p>
              </div>
            ) : (
              evidenceList.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      {rec.trigger}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{rec.timestamp}</span>
                  </div>

                  {rec.videoUrl && (
                    <div className="rounded-xl overflow-hidden bg-black/50 aspect-video border border-white/5 relative">
                      <video
                        src={rec.videoUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {rec.location && (
                    <div className="text-xs text-slate-300 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">
                        {rec.location.address || `${rec.location.latitude.toFixed(4)}, ${rec.location.longitude.toFixed(4)}`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    {rec.videoUrl && (
                      <a
                        href={rec.videoUrl}
                        download={`SafeOV_Evidence_${rec.id}.webm`}
                        className="text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-1.5 rounded-lg border border-white/10 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Clip
                      </a>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            dispatchLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No emergency alerts dispatched yet.
              </div>
            ) : (
              dispatchLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#1E293B] border border-white/10 rounded-2xl p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                        {log.type}
                      </span>
                      <span className="font-medium text-slate-200">{log.recipient}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                  </div>

                  <p className="text-slate-300 text-xs bg-[#0F172A] p-2.5 rounded-xl border border-white/5 font-mono text-[11px] leading-relaxed">
                    {log.content}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Status: {log.status}
                    </span>
                    {log.content.includes('http') && (
                      <a
                        href={log.content.match(/https?:\/\/[^\s]+/)?.[0] || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-indigo-400 hover:underline"
                      >
                        Map Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          {(evidenceList.length > 0 || dispatchLogs.length > 0) && (
            <button
              onClick={handleClearEvidence}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Records
            </button>
          )}
          <span className="text-slate-500 text-[11px] ml-auto">
            SafeOV Shield Encrypted Local Cache
          </span>
        </div>
      </div>
    </div>
  );
};
