import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import StageBadge from '../../components/shared/StageBadge';

const STAGES = ['Submitted', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired', 'Rejected'];

export default function RecruiterPipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyPipeline().then(setPipeline).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns = STAGES.map(stage => ({
    stage,
    items: pipeline.filter(p => p.stage === stage),
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Pipeline</h2>

      {pipeline.length === 0 ? (
        <EmptyState message="No candidates in your pipeline yet" />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.stage} className="min-w-[240px] w-[240px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">{col.stage}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{col.items.length}</span>
              </div>
              <div className="space-y-2.5">
                {col.items.map(item => (
                  <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                    <p className="text-sm font-medium text-slate-800">{item.candidate_name}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.job_title}</p>
                    <div className="mt-2">
                      <StageBadge stage={item.stage} />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {Math.max(1, Math.ceil((Date.now() - new Date(item.updated_at).getTime()) / 86400000))}d in stage
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
