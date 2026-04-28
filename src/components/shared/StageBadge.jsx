const stageColors = {
  Submitted: 'bg-blue-100 text-blue-800',
  Screening: 'bg-amber-100 text-amber-800',
  Interview: 'bg-purple-100 text-purple-800',
  Technical: 'bg-orange-100 text-orange-800',
  Offer: 'bg-emerald-100 text-emerald-800',
  Hired: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function StageBadge({ stage }) {
  const cls = stageColors[stage] || 'bg-gray-100 text-gray-800';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{stage}</span>;
}
