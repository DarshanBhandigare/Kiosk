import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Edit3, Settings, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { MOCK_RED_FLAG_RULES } from '../../data/mockData';

export const AdminRulesPanel: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRedFlagRules();
      setRules(data.length > 0 ? data : MOCK_RED_FLAG_RULES);
    } catch (e) {
      console.warn('Fetch rules error, using mock:', e);
      setRules(MOCK_RED_FLAG_RULES);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <span>Red-Flag Clinical Rules Engine Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage deterministic safety rules, symptom pattern triggers, severity tiers, and automatic nursing staff triage escalation paths.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  {rule.rule_code}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
              </div>
              <Badge variant={rule.severity === 'CRITICAL' ? 'critical' : 'high'} size="sm">
                {rule.severity} Severity
              </Badge>
            </div>

            <p className="text-xs text-slate-600 mb-4">{rule.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <strong className="font-bold text-slate-700 block mb-1">Keywords / Symptom Patterns:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {(rule.required_symptom_keys || []).map((k: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-800">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="font-bold text-slate-700 block mb-1">Triage Protocol Action:</strong>
                <p className="text-slate-800 font-medium">{rule.action_required || 'Notify OPD triage nurse & duty physician'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
