import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import StageBadge from '../../components/shared/StageBadge';
import { ChevronDown, ChevronRight, Briefcase, Clock, Building } from 'lucide-react';

const STAGES = ['Submitted', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired', 'Rejected'];

export default function RecruiterPipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState('');
  const [expandedStages, setExpandedStages] = useState(
    STAGES.reduce((acc, stage) => ({ ...acc, [stage]: true }), {})
  );

  useEffect(() => {
    api.getMyPipeline().then(setPipeline).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleStage = (stage) => {
    setExpandedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

  const jobs = [...new Set(pipeline.map(p => p.job_title).filter(Boolean))];

  const filtered = pipeline.filter(p => {
    return !jobFilter || p.job_title === jobFilter;
  });

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">Track your candidates' progress</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="w-full sm:w-56 appearance-none pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 transition-all font-medium text-slate-700">
              <option value="">All Jobs</option>
              {jobs.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No candidates match your filters." />
      ) : (
        <div className="space-y-6">
          {STAGES.map(stage => {
            const stageItems = filtered.filter(p => p.stage === stage);
            if (stageItems.length === 0) return null;
            
            return (
              <div key={stage} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <button 
                  onClick={() => toggleStage(stage)}
                  className="w-full bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">
                      {expandedStages[stage] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{stage}</h3>
                    <span className="bg-blue-100 text-blue-700 py-0.5 px-3 rounded-full text-xs font-bold">
                      {stageItems.length}
                    </span>
                  </div>
                </button>
                
                {expandedStages[stage] && (
                  <div className="divide-y divide-slate-100 bg-white">
                    {stageItems.map(item => (
                      <div key={item.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-5 hover:bg-slate-50/50 transition-colors">
                        
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                          <div>
                            <p className="text-base font-bold text-slate-900 mb-1">{item.candidate_name}</p>
                            <StageBadge stage={item.stage} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              <Briefcase className="w-3.5 h-3.5" /> Job Role
                            </div>
                            <p className="text-sm text-slate-800 font-medium truncate">{item.job_title}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              <Clock className="w-3.5 h-3.5" /> Time in Stage
                            </div>
                            <p className="text-sm text-slate-800 font-medium">
                              {Math.max(1, Math.ceil((Date.now() - new Date(item.updated_at).getTime()) / 86400000))} days
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0 w-full lg:w-48 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-5">
                            <div className="flex flex-col items-start lg:items-end w-full h-full justify-center">
                              {item.notes ? (
                                <div className="bg-slate-50 rounded p-3 w-full border border-slate-100">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Latest Update:</p>
                                  <p className="text-sm text-slate-700 italic line-clamp-2">
                                    "{item.notes}"
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 italic">No notes added</p>
                              )}
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
