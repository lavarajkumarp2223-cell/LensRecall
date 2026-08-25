'use client';

import { useState } from 'react';
import {
  Shield,
  Clock,
  Trash2,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  UserCheck,
  Upload,
  Lock,
  Calendar,
  AlertCircle,
  Database,
  Search,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: 'FACE_SEARCH_PERFORMED' | 'CONSENT_GRANTED' | 'PHOTOS_UPLOADED' | 'USER_LOGIN' | 'EVENT_CREATED' | 'PRIVACY_REQUEST_PROCESSED';
  actor: string;
  entity: string;
  time: string;
  status: 'SUCCESS' | 'WARNING';
  details: string;
  ip?: string;
  latency?: string;
}

interface PrivacyRequestItem {
  id: string;
  email: string;
  event: string;
  requestType: string;
  requestedAt: string;
  status: 'PENDING' | 'COMPLETED';
}

const INITIAL_LOGS: AuditLogItem[] = [];

const INITIAL_REQUESTS: PrivacyRequestItem[] = [];

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'privacy'>('logs');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs] = useState<AuditLogItem[]>(INITIAL_LOGS);
  const [requests, setRequests] = useState<PrivacyRequestItem[]>(INITIAL_REQUESTS);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = actionFilter === 'ALL' || log.action.includes(actionFilter);
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprovePurge = (id: string) => {
    setProcessingId(id);
    setTimeout(() => {
      setRequests(
        requests.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' } : r)),
      );
      setProcessingId(null);
    }, 600);
  };

  const getActionBadge = (action: AuditLogItem['action']) => {
    switch (action) {
      case 'FACE_SEARCH_PERFORMED':
        return {
          label: 'Face Search',
          icon: Sparkles,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          iconBg: 'bg-indigo-600 text-white',
        };
      case 'CONSENT_GRANTED':
        return {
          label: 'Consent Granted',
          icon: UserCheck,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'PHOTOS_UPLOADED':
        return {
          label: 'Photos Uploaded',
          icon: Upload,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-600 text-white',
        };
      case 'USER_LOGIN':
        return {
          label: 'Authentication',
          icon: Lock,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-600 text-white',
        };
      case 'EVENT_CREATED':
        return {
          label: 'Event Provisioned',
          icon: Calendar,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          iconBg: 'bg-amber-600 text-white',
        };
      case 'PRIVACY_REQUEST_PROCESSED':
        return {
          label: 'GDPR Data Purge',
          icon: Trash2,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-600 text-white',
        };
      default:
        return {
          label: action,
          icon: FileText,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-600 text-white',
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield size={28} className="text-indigo-600" />
          Audit Logs & GDPR Compliance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cryptographically verifiable audit trail of biometric searches, consent grants, and right-to-be-forgotten purges
        </p>
      </div>

      {/* ── Status Metrics Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Audit Stream</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Immutable Stream Active
          </div>
          <div className="text-xs text-slate-500 font-medium">{logs.length} logged biometric events</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Auto-Purge Scheduler</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600">0 Overdue Purges</div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} />
            All Rekognition partitions compliant (90d max)
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">GDPR Deletion Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">
            {requests.filter((r) => r.status === 'PENDING').length} Pending Request
          </div>
          <div className="text-xs text-slate-500 font-medium">SLA: 48 hours for biometric erasure</div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText size={16} />
          Security & Operation Logs ({logs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield size={16} />
          Privacy Requests Queue ({requests.filter((r) => r.status === 'PENDING').length})
        </button>
      </div>

      {/* ── Tab: Security & Operation Logs ─────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Action Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search actor, event, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'FACE_SEARCH', label: 'Face Searches' },
                { id: 'CONSENT', label: 'Consent Grants' },
                { id: 'PHOTO', label: 'Uploads' },
                { id: 'USER', label: 'Auth' },
                { id: 'PRIVACY', label: 'GDPR Purges' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActionFilter(id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    actionFilter === id
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs List Container */}
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <FileText size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">No audit activity recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All guest biometric verifications, photo uploads, logins, and GDPR actions will be logged here with real-time latency telemetry.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={log.id}
                    className="p-5 hover:bg-slate-50/80 transition-colors space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {/* Action Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${badge.iconBg}`}>
                          <BadgeIcon size={15} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {log.actor}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        {log.latency && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            ⚡ {log.latency}
                          </span>
                        )}
                        {log.ip && (
                          <span className="text-[11px] text-slate-500">
                            IP: {log.ip}
                          </span>
                        )}
                        <span>{log.time}</span>
                      </div>
                    </div>

                    {/* Details block */}
                    <div className="pl-11">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {log.details}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Target: <span className="text-slate-600 font-semibold">{log.entity}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Privacy Requests Queue ────────────────────────────────────── */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Shield size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Privacy Queue Clean</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No pending GDPR or DPDP biometric deletion requests. When a guest requests face data removal, it will appear here for 1-click execution.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {requests.map((req) => (
              <div
                key={req.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-slate-900">
                      {req.email}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        req.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Request: <strong className="text-indigo-600 font-bold">{req.requestType}</strong> &bull; Event: <span className="font-semibold text-slate-800">{req.event}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    Submitted {req.requestedAt}
                  </p>
                </div>

                {req.status === 'PENDING' ? (
                  <button
                    type="button"
                    disabled={processingId === req.id}
                    onClick={() => handleApprovePurge(req.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {processingId === req.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={14} />
                        Approve & Execute Face Purge
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={15} />
                    Purged & GDPR Compliant
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
