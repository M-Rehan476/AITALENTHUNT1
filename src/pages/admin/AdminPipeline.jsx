import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import StageBadge from '../../components/shared/StageBadge';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, User, Briefcase, Clock, Building } from 'lucide-react';

const STAGES = ['Submitted', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired', 'Rejected'];

export default function AdminPipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editStage, setEditStage] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [expandedStages, setExpandedStages] = useState(
    STAGES.reduce((acc, stage) => ({ ...acc, [stage]: true }), {})
  );
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    api.getAllPipeline().then(setPipeline).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const recruiters = [...new Set(pipeline.map(p => p.recruiter_name).filter(Boolean))];
  const jobs = [...new Set(pipeline.map(p => p.job_title).filter(Boolean))];

  const filtered = pipeline.filter(p => {
    const matchRecruiter = !recruiterFilter || p.recruiter_name === recruiterFilter;
    const matchJob = !jobFilter || p.job_title === jobFilter;
    return matchRecruiter && matchJob;
  });

  const handleStageChange = async (id) => {
    setSavingId(id);
    try {
      await api.updatePipeline(id, { stage: editStage, notes: editNotes });
      toast.success(`Stage updated to ${editStage}`);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditStage(item.stage);
    setEditNotes(item.notes || '');
  };

  const toggleStage = (stage) => {
    setExpandedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pipeline Tracking</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and update candidate progress</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={recruiterFilter} onChange={e => setRecruiterFilter(e.target.value)} className="w-full sm:w-56 appearance-none pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 transition-all font-medium text-slate-700">
              <option value="">All Recruiters</option>
              {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
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
                        
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
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
                              <User className="w-3.5 h-3.5" /> Recruiter
                            </div>
                            <p className="text-sm text-slate-800 font-medium truncate">{item.recruiter_name}</p>
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

                        <div className="flex-shrink-0 w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-5">
                          {editingId === item.id ? (
                            <div className="space-y-3">
                              <select 
                                value={editStage} 
                                onChange={e => setEditStage(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input 
                                type="text" 
                                value={editNotes} 
                                onChange={e => setEditNotes(e.target.value)} 
                                placeholder="Add optional notes..." 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleStageChange(item.id)} 
                                  disabled={savingId === item.id}
                                  className={`flex-1 flex items-center justify-center gap-2 ${savingId === item.id ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-semibold py-2 rounded-lg transition-colors shadow-sm`}
                                >
                                  {savingId === item.id ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Saving...
                                    </>
                                  ) : 'Save Stage'}
                                </button>
                                <button 
                                  onClick={() => setEditingId(null)} 
                                  disabled={savingId === item.id}
                                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start lg:items-end w-full h-full justify-center">
                              <button 
                                onClick={() => startEdit(item)} 
                                className="w-full lg:w-auto text-sm bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm"
                              >
                                Update Progress
                              </button>
                              {item.notes && (
                                <p className="text-xs text-slate-500 mt-3 italic text-left lg:text-right w-full line-clamp-2">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>
                          )}
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
