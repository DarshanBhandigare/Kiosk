import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, Clock, ArrowRight, User, CheckCircle2, Stethoscope, RefreshCw } from 'lucide-react';
import { QueueItem } from '../../types';
import { Badge } from '../common/Badge';

interface OPDQueueProps {
  queue: QueueItem[];
  loading: boolean;
  onSelectCase: (caseId: string) => void;
  onRefresh: () => void;
}

export const OPDQueue: React.FC<OPDQueueProps> = ({
  queue,
  loading,
  onSelectCase,
  onRefresh
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'PRIORITY' | 'WAITING' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQueue = queue.filter((item) => {
    // Tab filter
    if (filterTab === 'PRIORITY' && !item.has_red_flag) return false;
    if (filterTab === 'WAITING' && item.status !== 'WAITING_REVIEW') return false;
    if (filterTab === 'APPROVED' && item.status !== 'APPROVED') return false;
    if (filterTab === 'COMPLETED' && item.status !== 'COMPLETED') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.token_number.toLowerCase().includes(q) ||
        item.patient_name.toLowerCase().includes(q) ||
        item.chief_complaint.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const redFlagCount = queue.filter((i) => i.has_red_flag).length;
  const waitingCount = queue.filter((i) => i.status === 'WAITING_REVIEW').length;
  const approvedCount = queue.filter((i) => i.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Queue Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Patients In OPD</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{queue.length}</div>
        </div>

        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-2xs">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Red-Flag Priority Cases</span>
          </span>
          <div className="text-3xl font-black text-rose-800 mt-1">{redFlagCount}</div>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Waiting Doctor Review</span>
          <div className="text-3xl font-black text-amber-800 mt-1">{waitingCount}</div>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Approved & Consulted</span>
          <div className="text-3xl font-black text-emerald-800 mt-1">{approvedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: `All Patients (${queue.length})` },
            { id: 'PRIORITY', label: `🚨 Priority Red-Flag (${redFlagCount})` },
            { id: 'WAITING', label: `Waiting Review (${waitingCount})` },
            { id: 'APPROVED', label: `Approved (${approvedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Token, Name, Symptoms..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 w-64 focus:border-teal-600"
            />
          </div>

          <button
            onClick={onRefresh}
            title="Refresh Queue"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600">Updating OPD Patient Queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-700">No patients match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Chief Complaint</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Triage Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectCase(item.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-black text-teal-700 text-sm">
                      {item.token_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.patient_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.patient_age ? `${item.patient_age} Y • ` : ''}{item.patient_sex || 'Unspecified'}
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-xs truncate font-medium">
                      {item.chief_complaint}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.department}
                    </td>
                    <td className="py-3 px-4">
                      {item.has_red_flag ? (
                        <Badge variant="critical" size="sm">
                          🚨 Priority ({item.red_flag_severity || 'CRITICAL'})
                        </Badge>
                      ) : item.status === 'APPROVED' ? (
                        <Badge variant="success" size="sm">
                          ✓ Approved
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Waiting Review
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(item.id);
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs transition-colors"
                      >
                        <span>Open Case</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
