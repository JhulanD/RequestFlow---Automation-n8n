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
    urgent: "bg-[#FF4F25] text-white",
    standard: "bg-black/5 text-black/60",
    error: "bg-red-50 text-red-600 border border-red-100",
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
    <div className="min-h-screen flex flex-col selection:bg-ink selection:text-paper">
      {/* Navigation */}
      <nav className="h-20 lg:px-16 flex items-center justify-between sticky top-0 z-50 bg-paper/80 backdrop-blur-md px-8 border-b border-black/5">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 bg-brand flex items-center justify-center transition-transform duration-700 group-hover:rotate-90">
            <div className="w-2 h-2 bg-white rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-[0.2em] uppercase leading-none">RequestFlow</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-ink-dim mt-1">Intelligence Protocol</span>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 flex items-center justify-center text-ink-dim hover:text-ink transition-colors border border-transparent hover:border-black/5 rounded-full"
        >
          <Settings2 size={14} strokeWidth={2.5} />
        </button>
      </nav>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[60] px-4 pt-4"
          >
            <div className="compact-card shadow-2xl border-white/80">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  System Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity">Close</button>
              </div>
              <div className="space-y-6">
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
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-ink-dim mb-2">Security Headers</label>
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

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 bg-transparent border-t border-border-subtle/30 items-start">
        {/* Left Section: Intake Form & Intro */}
        <section className="flex-1 lg:w-1/2 p-8 lg:pt-8 lg:pb-24 lg:px-16 flex flex-col bg-paper">
          <div className="max-w-xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-5xl lg:text-[72px] font-bold mb-4 tracking-tight leading-[0.95]">
                Refining the standard <br /> 
                <span className="">of request intake.</span>
              </h1>
              <p className="text-ink-muted mb-4 text-[14px] leading-relaxed max-w-sm">
                A streamlined protocol for high-performance teams to evaluate, route, and deploy service demands with absolute precision.
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {!result && !error ? (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="compact-card shadow-deep border-black/10"
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink-dim">Given Name</label>
                        <motion.input 
                          whileFocus={{ x: 4 }}
                          required
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="ink-input py-1.5"
                          placeholder="Julian"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink-dim">Surname</label>
                        <motion.input 
                          whileFocus={{ x: 4 }}
                          required
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="ink-input py-1.5"
                          placeholder="Moreau"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink-dim">Communication Address</label>
                      <motion.input 
                        whileFocus={{ x: 4 }}
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="ink-input py-1.5"
                        placeholder="julian@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink-dim">Preferred Deployment Date</label>
                      <motion.input 
                        whileFocus={{ x: 4 }}
                        required
                        type="date"
                        name="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="ink-input py-1.5"
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={loading}
                      type="submit" 
                      className="ink-button w-full mt-2 overflow-hidden relative group"
                    >
                      <motion.div 
                        initial={false}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute inset-0 bg-white/5 -translate-x-full"
                      />
                      {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <span className="flex items-center gap-4 relative z-10">
                          Initiate Submission
                          <ArrowRight size={14} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="compact-card"
                >
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={result.urgent ? 'urgent' : 'standard'} />
                      <span className="text-[9px] text-ink-dim font-mono tracking-[0.2em] uppercase">Verified Protocol</span>
                    </div>
                    <ShieldCheck className="text-ink/20" size={20} />
                  </div>
                  <h3 className="text-3xl font-serif font-light mb-6 leading-tight">{result.message}</h3>
                  <p className="text-ink-muted text-base mb-12 leading-relaxed max-w-xl italic">
                    {result.nextStep}
                  </p>
                  <div className="pt-10 border-t border-border-subtle flex flex-col sm:flex-row gap-6 items-center justify-between">
                    <button 
                      onClick={resetForm}
                      className="w-full sm:w-auto ink-button"
                    >
                      Process New Intake
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ink-dim font-mono tabular-nums">
                      Ref: #{Math.random().toString(16).slice(2, 8).toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="compact-card border-red-500/10"
                >
                  <div className="mb-8">
                    <StatusBadge status="error" />
                  </div>
                  <h3 className="text-2xl font-serif font-light mb-4">Submission Encoutered a Fault</h3>
                  <p className="text-ink-muted mb-10 text-sm leading-relaxed">{error}</p>
                  <div className="flex gap-4">
                    <button onClick={handleSubmit} className="ink-button">
                       Retry Connection
                    </button>
                    <button onClick={resetForm} className="px-8 py-4 border border-border-subtle text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors">
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Section: Intel & Logs */}
        <section className="lg:w-1/2 p-8 lg:pt-8 lg:pb-24 lg:px-16 flex flex-col gap-24 bg-paper-dark border-l border-border-subtle/50 relative overflow-hidden">
          <div className="relative z-10 space-y-24 h-full flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-10"
            >
               <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ink-dim">Protocol Intel</h2>
               <p className="text-xl font-serif italic text-ink-muted leading-relaxed max-w-sm font-light">
                 "Our automated urgency filter prioritizes requests within a 7-day window, ensuring zero-latency response for critical deployments."
               </p>
               <div className="flex items-center gap-6">
                 <div className="w-10 h-[1px] bg-ink" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.4em]">System v2.4a</span>
               </div>
            </motion.div>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ink-dim flex items-center gap-3">
                   <History size={12} strokeWidth={3} className="opacity-40" />
                   Verified Stream
                </h2>
              </div>
              
              <div className="space-y-10">
                {activity.length === 0 ? (
                  <p className="text-[9px] italic text-ink-dim uppercase tracking-[0.4em] font-mono">Listening for secure transmission...</p>
                ) : (
                  activity.map((item, idx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 + (idx * 0.1) }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium tracking-tight">{item.firstName} {item.lastName}</span>
                        <span className="text-[9px] text-ink-dim uppercase tracking-widest font-mono">
                         {item.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="text-[10px] text-ink-dim font-mono tabular-nums opacity-40">
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
          
          {/* Subtle graphic element */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ink/[0.01] rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none" />
        </section>
      </main>
    </div>
  );
}
