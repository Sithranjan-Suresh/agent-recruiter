import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function ApplyButton({ jobId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');

  const applyMutation = useMutation({
    mutationFn: () => api.post('/applications', { jobId }),
    onSuccess: () => {
      setToast('Your agent introduced itself to the recruiter');
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] });
    },
    onError: (err) => {
      setToast(err.response?.data?.error?.message || 'Something went wrong');
    },
  });

  if (!user || user.role !== 'candidate') return null;

  const profileIncomplete = !user.aicooInitialized;

  return (
    <div className="text-right">
      <button
        onClick={() => applyMutation.mutate()}
        disabled={profileIncomplete || applyMutation.isPending || applyMutation.isSuccess}
        title={profileIncomplete ? 'Complete your profile first' : undefined}
        className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {applyMutation.isPending ? 'Setting up your agent...' : applyMutation.isSuccess ? 'Agent active' : 'Apply via Agent'}
      </button>
      {profileIncomplete && <p className="text-xs text-slate-400 mt-1">Complete your profile first</p>}
      {toast && <p className="text-xs text-slate-500 mt-1">{toast}</p>}
    </div>
  );
}

export default function JobBoardPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then((r) => r.data),
  });

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Open roles</h1>
      {isLoading && <p className="text-slate-500">Loading jobs...</p>}
      <div className="grid gap-4">
        {jobs?.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-slate-900">{job.title}</h2>
              <p className="text-sm text-slate-500">{job.recruiter.company} · {job.location}</p>
              <ul className="text-sm text-slate-600 mt-2 list-disc pl-5">
                {job.requirements.slice(0, 3).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <ApplyButton jobId={job.id} />
          </div>
        ))}
        {jobs?.length === 0 && <p className="text-slate-500">No open roles right now.</p>}
      </div>
    </Layout>
  );
}
