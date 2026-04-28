import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import toast from 'react-hot-toast';

export default function SubmitCandidate() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', linkedin_url: '', skills: '', experience_years: '', notes: '',
  });

  useEffect(() => {
    api.getJob(jobId).then(setJob).catch(() => toast.error('Job not found')).finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) return toast.error('Name and email are required');
    setSubmitting(true);
    try {
      await api.submitCandidate({
        ...form,
        job_id: jobId,
        experience_years: parseInt(form.experience_years) || 0,
      });
      toast.success('Candidate submitted successfully!');
      navigate('/recruiter/my-candidates');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  if (loading) return <Spinner />;
  if (!job) return <div className="text-center text-slate-500 py-12">Job not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Submit Candidate</h2>
      <p className="text-sm text-slate-500 mb-6">For: <span className="font-medium text-slate-700">{job.title}</span> at {job.company}</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input type="text" value={form.full_name} onChange={update('full_name')} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={update('email')} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input type="text" value={form.phone} onChange={update('phone')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">LinkedIn URL</label>
              <input type="url" value={form.linkedin_url} onChange={update('linkedin_url')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills (comma-separated)</label>
              <input type="text" value={form.skills} onChange={update('skills')} placeholder="React, Node.js, SQL" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
              <input type="number" value={form.experience_years} onChange={update('experience_years')} min="0" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={update('notes')} rows={3} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Candidate'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
