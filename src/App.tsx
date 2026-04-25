/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  History, 
  ChevronRight, 
  Loader2,
  Calendar,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface WebhookSettings {
  url: string;
  headers: Record<string, string>;
}

const StatusBadge = ({ status }: { status: 'urgent' | 'standard' | 'error' | string }) => {
  const styles = {
    urgent: "bg-red-600 text-white",
    standard: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    error: "bg-orange-100 text-orange-700 border border-orange-200",
  };

  const currentStyle = styles[status as keyof typeof styles] || styles.standard;

  return (
    <span className={`text-[10px] px-2 py-0.5 uppercase font-bold tracking-tighter rounded-sm ${currentStyle}`}>
      {status}
    </span>
  );
};

interface RequestData {
  firstName: string;
  lastName: string;
  email: string;
  date: string;
}

interface WebhookResponse {
  urgent: boolean;
  status: string;
  message: string;
  nextStep: string;
}

interface ActivityItem extends RequestData {
  id: string;
  timestamp: string;
  status: 'urgent' | 'standard' | 'error';
}

export default function App() {
  // --- State ---
  const [formData, setFormData] = useState<RequestData>({
    firstName: '',
    lastName: '',
    email: '',
    date: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebhookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings initialization from localStorage
  const [settings, setSettings] = useState<WebhookSettings>(() => {
    const saved = localStorage.getItem('rf_settings');
    return saved ? JSON.parse(saved) : { 
      url: 'https://framelabs.app.n8n.cloud/webhook/33b7bab4-5a7b-4d09-9e8f-1d122ca17ac6', 
      headers: {} 
    };
  });

  // Activity feed initialization from localStorage
  const [activity, setActivity] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('rf_activity');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('rf_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('rf_activity', JSON.stringify(activity));
  }, [activity]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveToActivity = (status: 'urgent' | 'standard' | 'error') => {
    const newItem: ActivityItem = {
      ...formData,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      status
    };
    setActivity(prev => [newItem, ...prev].slice(0, 5)); // Keep last 5
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address format.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...settings.headers
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Could not connect to the workflow.');

      const data: WebhookResponse = await response.json();
      setResult(data);
      saveToActivity(data.urgent ? 'urgent' : 'standard');
    } catch (err) {
      setError('Something went wrong. Please check your connection or try again.');
      saveToActivity('error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      date: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-ink selection:text-paper">
      {/* Header */}
      <header className="h-16 border-b border-border-subtle bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 lg:px-16 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ink flex items-center justify-center">
              <div className="w-2 h-2 bg-white rotate-45"></div>
            </div>
            <span className="font-semibold text-lg tracking-tight uppercase">RequestFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              <span className="cursor-pointer hover:text-ink transition-colors">Services</span>
              <span className="cursor-pointer hover:text-ink transition-colors">Safety</span>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 h-8 px-3 rounded-full border border-border-subtle hover:bg-ink hover:text-white transition-all group"
              title="Workflow Settings"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Configure</span>
              <Settings2 size={13} className={showSettings ? 'rotate-90' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Overlay - Adjusted for Theme */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border-subtle bg-white"
          >
            <div className="max-w-4xl mx-auto px-8 py-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  System Configuration
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity">Close Settings</button>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-ink-dim mb-2">Endpoint URL</label>
                    <input 
                      type="text" 
                      value={settings.url}
                      onChange={(e) => setSettings(prev => ({ ...prev, url: e.target.value }))}
                      className="ink-input"
                      placeholder="https://..."
                    />
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Local browser persistence enabled. No data leaves this environment except to your specified endpoint.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-ink-dim mb-2">Security Headers (JSON)</label>
                  <textarea 
                    value={JSON.stringify(settings.headers, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSettings(prev => ({ ...prev, headers: parsed }));
                      } catch (err) {}
                    }}
                    className="ink-input min-h-[100px] font-mono text-[10px]"
                    placeholder='{ "Authorization": "..." }'
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Section: Intake Form & Intro */}
        <section className="flex-1 lg:w-3/5 p-8 lg:p-16 flex flex-col">
          <div className="max-w-md w-full">
            <h1 className="text-4xl lg:text-5xl font-light mb-4 tracking-tight leading-[1.1]">
              Initiate Service <br /> Request
            </h1>
            <p className="text-ink-muted mb-8 text-sm leading-relaxed">
              Fill in your details below. Our system will analyze your preferred date and route your request to the relevant team immediately.
            </p>

            <AnimatePresence mode="wait">
              {!result && !error ? (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-ink-dim">First Name</label>
                        <input 
                          required
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="ink-input"
                          placeholder="Julian"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-ink-dim">Last Name</label>
                        <input 
                          required
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="ink-input"
                          placeholder="Moreau"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-ink-dim">Email Address</label>
                      <input 
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="ink-input"
                        placeholder="julian@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-ink-dim">Preferred Installation Date</label>
                      <input 
                        required
                        type="date"
                        name="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="ink-input"
                      />
                    </div>

                    <button 
                      disabled={loading}
                      type="submit" 
                      className="ink-button w-full"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <span className="flex items-center gap-3">
                          Submit Request
                          <ArrowRight size={14} />
                        </span>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="p-8 border-l-4 border-ink bg-white rounded-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <StatusBadge status={result.urgent ? 'urgent' : 'standard'} />
                      <span className="text-[10px] text-ink-dim font-mono">Secure Protocol</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{result.message}</h3>
                    <p className="text-sm text-ink-muted mb-8 leading-relaxed">
                      {result.nextStep}
                    </p>
                    <div className="pt-4 border-t border-border-subtle">
                      <button 
                        onClick={resetForm}
                        className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        Submit Another Request <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 border-l-4 border-orange-500 bg-white rounded-sm"
                >
                  <div className="mb-4">
                    <StatusBadge status="error" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-ink uppercase tracking-tight">Submission Failed</h3>
                  <p className="text-sm text-ink-muted mb-8">{error}</p>
                  <div className="flex gap-6">
                    <button onClick={handleSubmit} className="text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2 hover:underline">
                       Retry Connection <RefreshCw size={12} />
                    </button>
                    <button onClick={resetForm} className="text-[10px] font-bold uppercase tracking-widest text-ink-dim hover:text-ink transition-colors">Clear Form</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Activity - Moved here as requested */}
            <div className="mt-16 pt-12 border-t border-border-subtle/50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-dim flex items-center gap-2">
                   <History size={14} />
                   Recent Intake Log
                </h2>
                <span className="text-[10px] text-ink-dim tracking-widest">Browser Only</span>
              </div>
              
              <div className="space-y-6">
                {activity.length === 0 ? (
                  <p className="text-[11px] italic text-ink-dim uppercase tracking-widest">No recent submissions found in this session.</p>
                ) : (
                  activity.map((item) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id}
                      className="flex items-center justify-between pb-4 border-b border-border-subtle/30 last:border-0 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{item.firstName} {item.lastName}</span>
                          <span className="text-[10px] text-ink-dim uppercase tracking-wider font-mono">
                           Scheduled: {item.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-ink-dim font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-16">
            <div className="h-[1px] w-full bg-border-subtle mb-6"></div>
            <p className="text-[10px] text-ink-dim uppercase tracking-widest leading-relaxed max-w-sm">
              Data encrypted via AES-256. Information is only used for service scheduling purposes and is not shared with third-party vendors.
            </p>
          </div>
        </section>

        {/* Right Section: Intel & Status */}
        <section className="lg:w-2/5 bg-white border-l border-border-subtle p-8 lg:p-16 flex flex-col gap-12 overflow-y-auto">
          <div className="space-y-12">
            <div className="p-8 border border-border-subtle rounded-sm flex flex-col gap-6">
               <h2 className="text-xs font-bold uppercase tracking-widest text-ink-dim">Submission Insight</h2>
               <p className="text-sm text-ink-muted leading-relaxed">
                 Each request is analyzed for urgency based on the installation date proximity. Requests within a <span className="text-ink font-bold">7-day window</span> are prioritized automatically.
               </p>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-[1px] bg-ink" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Intake Protocol v2.4</span>
               </div>
            </div>

            <div className="space-y-6">
               <h2 className="text-xs font-bold uppercase tracking-widest text-ink-dim flex items-center gap-2">
                 <RefreshCw size={12} />
                 Workflow Schema
               </h2>
               <div className="bg-paper p-6 rounded-sm border border-border-subtle font-mono text-[10px] leading-relaxed relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-40 transition-opacity">
                   <ShieldCheck size={24} />
                 </div>
                 <p className="text-ink-dim mb-4 tracking-tighter">// Expected n8n Response</p>
                 <pre className="text-ink">
{`{
  "urgent": boolean,
  "status": "string",
  "message": "string",
  "nextStep": "string"
}`}
                 </pre>
               </div>
               <p className="text-[10px] text-ink-muted leading-relaxed italic">
                 Note: Ensure n8n returns this JSON structure to trigger the success UI states correctly.
               </p>
            </div>
          </div>

          {/* System Health / Info Card */}
          <div className="bg-paper p-8 rounded-sm border border-border-subtle mt-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest">Intake Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-medium border-b border-border-subtle/50 pb-2">
                <span className="text-ink-muted uppercase tracking-tighter">Workflow System</span>
                <span className="font-mono">Operational</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium border-b border-border-subtle/50 pb-2">
                <span className="text-ink-muted uppercase tracking-tighter">Latency</span>
                <span className="font-mono">1.2s</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-ink-muted uppercase tracking-tighter">Availability</span>
                <span className="font-mono">99.9%</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
