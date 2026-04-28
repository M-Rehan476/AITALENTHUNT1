import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import StageBadge from '../../components/shared/StageBadge';
import toast from 'react-hot-toast';

const STAGES = ['Submitted', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired', 'Rejected'];

export default function AdminPipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editStage, setEditStage] = useState('');
  const [editNotes, setEditNotes] = useState('');

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
    try {
      await api.updatePipeline(id, { stage: editStage, notes: editNotes });
      toast.success(`Stage updated to ${editStage}`);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditStage(item.stage);
    setEditNotes(item.notes || '');
  };

  if (loading) return <Spinner />;

  const columns = STAGES.map(stage => ({
    stage,
    items: filtered.filter(p => p.stage === stage),
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Pipeline Management</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={recruiterFilter} onChange={e => setRecruiterFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Recruiters</option>
            {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No pipeline entries" />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.stage} className="min-w-[260px] w-[260px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">{col.stage}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{col.items.length}</span>
              </div>
              <div className="space-y-2.5">
                {col.items.map(item => (
                  <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm">
                    <p className="text-sm font-medium text-slate-800">{item.candidate_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.job_title}</p>
                    <p className="text-xs text-slate-400">{item.recruiter_name}</p>
                    <div className="mt-2">
                      <StageBadge stage={item.stage} />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {Math.max(1, Math.ceil((Date.now() - new Date(item.updated_at).getTime()) / 86400000))}d in stage
                    </p>
                    {editingId === item.id ? (
                      <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                        <select value={editStage} onChange={e => setEditStage(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Add notes..." className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                        <div className="flex gap-1.5">
                          <button onClick={() => handleStageChange(item.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-1 rounded transition-colors">Save</button>
                          <button onClick={() => setEditingId(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1 rounded transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item)} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">Change Stage</button>
                    )}
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
