import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  Bot, 
  User, 
  RefreshCw, 
  Package, 
  ClockAlert, 
  TrendingUp, 
  ListOrdered,
  Power,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Download,
  AlertTriangle,
  Sliders,
  Layers,
  Search
} from 'lucide-react';
import { askPharmacyAssistant, generatePharmacyImage, AIMessage, GroundingSource } from '../../services/ai';
import { db } from '../../services/db';
import { PharmacySettings } from '../../types';

export const AIAssistantView: React.FC = () => {
  const [settings, setSettings] = useState<PharmacySettings>(db.getSettings());
  const [activeSubTab, setActiveSubTab] = useState<'assistant' | 'search-grounding' | 'image-studio'>('assistant');

  // Chat State
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello! I am your **Vinisha Pharma Operations Assistant**.\n\nI have direct read access to your live medicine catalog, batch inventory, and sales records. I can assist you with:\n\n• **Stock Audits:** Identifying medicines below minimum safety levels\n• **Expiry Tracking:** Detecting batches expiring in the next 30/60/90 days\n• **Sales Summaries:** Revenue, top-selling items, and daily order counts\n• **Reorder Suggestions:** Formulating distributor purchase orders based on stock thresholds\n• **Google Search Grounding:** Real-time web checks for CDSCO drug notices and price caps\n\n*Notice:* Medical diagnoses and prescription decisions remain the sole professional responsibility of the licensed pharmacist.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableGroundingInChat, setEnableGroundingInChat] = useState(false);

  // Dedicated Regulatory Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string; sources: GroundingSource[] } | null>(null);

  // Image Studio State
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '9:16'>('16:9');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      setSettings(db.getSettings());
    };
    const unsub = db.subscribe(update);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'assistant') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeSubTab]);

  const aiEnabled = settings.aiFeaturesEnabled;

  const handleToggleAIFeatures = () => {
    db.toggleAIFeatures();
  };

  const handleSendChat = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || isLoading) return;

    if (!aiEnabled) {
      const offMsg: AIMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: '⚠️ **AI Features are currently switched OFF.**\n\nVinisha Pharma is operating in **Manual Pharmacy Mode**. Click **"Enable AI Features"** above to activate the operations assistant.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, offMsg]);
      return;
    }

    const userMsg: AIMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askPharmacyAssistant(text, messages, enableGroundingInChat);
      const botMsg: AIMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: response.text,
        isGrounded: enableGroundingInChat,
        groundingSources: response.sources,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: AIMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: 'Unable to connect to intelligence engine. Please verify system status.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteRegulatorySearch = async (queryToRun?: string) => {
    const q = (queryToRun || searchQuery).trim();
    if (!q || isSearching) return;

    if (!aiEnabled) {
      setSearchResult({
        text: '⚠️ **AI Search Grounding is currently disabled.** Please switch on AI Mode to execute live Google Search grounding.',
        sources: []
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await askPharmacyAssistant(q, [], true);
      setSearchResult({
        text: result.text,
        sources: result.sources || []
      });
    } catch {
      setSearchResult({
        text: 'Failed to retrieve grounded regulatory information. Please try again.',
        sources: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateGraphic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isGeneratingImage) return;

    if (!aiEnabled) {
      setImageError('AI Image Tools are currently switched OFF. Please enable AI Mode above.');
      return;
    }

    setIsGeneratingImage(true);
    setImageError(null);
    setGeneratedImage(null);

    try {
      const result = await generatePharmacyImage(imagePrompt, aspectRatio);
      setGeneratedImage(result.imageUrl);
      setImageDescription(result.description || null);
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const quickPrompts = [
    { label: 'Low Stock Alert', query: 'Which medicines are currently low in stock or out of stock?' },
    { label: 'Expiring Batches', query: 'Show batches expiring within the next 60 days.' },
    { label: 'Today\'s Sales', query: 'Summarize today\'s sales and top-selling medicines.' },
    { label: 'Reorder Suggestions', query: 'Generate an inward reorder suggestion list based on current stock levels.' }
  ];

  const sampleRegulatoryQueries = [
    'Recent CDSCO safety alerts or banned drug combinations in India',
    'NPPA ceiling price notification updates for essential medicines (NLEM)',
    'Schedule H1 dispensing and record-keeping mandates in Karnataka',
    'Paracetamol 650 dosage and hepatotoxicity guidelines by health authorities'
  ];

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 bg-slate-50 overflow-hidden max-w-6xl mx-auto w-full">
      {/* Top AI Mode Master Control Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            aiEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Vinisha Pharma AI Operations &amp; Intelligence Suite
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider ${
                aiEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {aiEnabled ? 'MODE: ACTIVE (ON)' : 'MODE: MANUAL (OFF)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {aiEnabled 
                ? 'AI operations assistant, live Google Search grounding, and image studio are enabled.'
                : 'Manual pharmacy mode active. Automated AI lookups, search grounding, and image generators are paused.'}
            </p>
          </div>
        </div>

        {/* Master ON / OFF Toggle Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleToggleAIFeatures}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              aiEnabled
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{aiEnabled ? 'Switch to Manual Mode (Turn OFF)' : 'Turn ON AI Intelligence'}</span>
          </button>
        </div>
      </div>

      {/* STATE A: AI IS TURNED OFF (MANUAL MODE VIEW) */}
      {!aiEnabled ? (
        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full my-auto shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Power className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              AI Intelligence Features Are Currently Turned OFF
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Vinisha Pharma is currently running in <strong>100% Manual Mode</strong>. In this mode, no background AI queries, search grounding, or image generation calls are performed.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2 w-full max-w-md">
            <p className="font-semibold text-slate-800">In Manual Mode:</p>
            <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
              <li>All billing, inventory, POS, reports, and invoices remain 100% functional.</li>
              <li>No external AI requests are triggered.</li>
              <li>You can re-enable AI features anytime with 1-click.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleToggleAIFeatures}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Turn ON AI Intelligence Suite</span>
          </button>
        </div>
      ) : (
        /* STATE B: AI IS TURNED ON (FULL CAPABILITY SUITE) */
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Sub-Tabs: Operations Chat, Live Search Grounding, Image Studio */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveSubTab('assistant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeSubTab === 'assistant'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Operations Assistant</span>
            </button>

            <button
              onClick={() => setActiveSubTab('search-grounding')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeSubTab === 'search-grounding'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Google Search Grounding (Live Drug Info)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('image-studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeSubTab === 'image-studio'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              <span>AI Graphic &amp; Banner Studio</span>
            </button>
          </div>

          {/* SUB-VIEW 1: PHARMACY OPERATIONS CHAT */}
          {activeSubTab === 'assistant' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              {/* Safety Notice Banner */}
              <div className="p-2.5 px-4 bg-amber-50/80 border-b border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Medical Guardrail Active:</strong> Provides inventory, sales, and retail operations support. Does not prescribe medicines or replace licensed medical judgment.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-200/60 px-2 py-0.5 rounded text-amber-950">
                  Gemini 3.8 Flash
                </span>
              </div>

              {/* Chat Scroll Window */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map((m) => {
                  const isUser = m.role === 'user';

                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isUser ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white shadow-xs'
                        }`}
                      >
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-slate-900 text-white font-medium rounded-tr-xs'
                            : 'bg-slate-50 text-slate-900 border border-slate-200/80 rounded-tl-xs space-y-2'
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                        {/* Grounding Web Sources Display */}
                        {m.groundingSources && m.groundingSources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Globe className="w-3 h-3 text-blue-600" />
                              <span>Google Search Grounding Sources:</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {m.groundingSources.map((source, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center gap-1 border border-blue-200 transition-colors"
                                >
                                  <span className="truncate max-w-[200px]">{source.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <span
                          className={`text-[10px] block mt-1 ${
                            isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                          }`}
                        >
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                      <span>
                        {enableGroundingInChat
                          ? 'Consulting live pharmacy database & Google Search data...'
                          : 'Analyzing pharmacy database snapshot...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Quick Audits:
                </span>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChat(qp.query)}
                    disabled={isLoading}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-slate-700 transition-colors cursor-pointer"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Search Grounding Inline Toggle */}
                  <button
                    type="button"
                    onClick={() => setEnableGroundingInChat(!enableGroundingInChat)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                      enableGroundingInChat
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Enable real-time Google Search grounding for latest web data"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Google Search:</span>
                    <span className="font-mono font-bold">{enableGroundingInChat ? 'ON' : 'OFF'}</span>
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about inventory, expiring batches, top sellers, or reorders..."
                    disabled={isLoading}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: GOOGLE SEARCH GROUNDING REGULATORY TOOL */}
          {activeSubTab === 'search-grounding' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Live Pharmaceutical Search Grounding (Google Search Data)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Query real-time CDSCO, NPPA, WHO, and Indian drug authority updates grounded directly with Google Search
                  </p>
                </div>
                <span className="text-[10px] font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                  gemini-3.5-flash + Google Search
                </span>
              </div>

              {/* Search Form */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. CDSCO banned fixed dose combinations 2025-2026, NPPA ceiling price on Metformin..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteRegulatorySearch()}
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>{isSearching ? 'Searching...' : 'Search Google Grounding'}</span>
                  </button>
                </div>

                {/* Pre-canned Regulatory Inquiries */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Suggested Searches:
                  </span>
                  {sampleRegulatoryQueries.map((query, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(query);
                        handleExecuteRegulatorySearch(query);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results Display */}
              {searchResult && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Grounded Search Findings</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {searchResult.sources.length} Verified Sources Found
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {searchResult.text}
                  </div>

                  {searchResult.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Citations &amp; Official References:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResult.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 flex items-center justify-between gap-2 group transition-all"
                          >
                            <span className="text-xs font-medium text-blue-700 truncate group-hover:underline">
                              {s.title}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 3: AI IMAGE & PROMOTIONAL BANNER STUDIO */}
          {activeSubTab === 'image-studio' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>AI Pharmacy Graphic &amp; Banner Studio</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate or edit promotional pharmacy posters, storefront banners, and health awareness graphics using text prompts
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-bold border border-purple-200">
                  gemini-3.1-flash-image-preview
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Prompt Controls (7 cols) */}
                <form onSubmit={handleGenerateGraphic} className="md:col-span-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Graphic Text Prompt *
                    </label>
                    <textarea
                      rows={4}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="e.g. Modern pharmacy promotional banner for Vinisha Pharma, 'Monsoon Health Essentials & Vitamin C Tablets - 15% Off', clean medical green and blue styling..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {(['16:9', '4:3', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={`py-1.5 rounded-lg border font-mono font-bold transition-colors ${
                            aspectRatio === ratio
                              ? 'bg-purple-50 border-purple-400 text-purple-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pre-made Template Prompts */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Popular Pharmacy Poster Templates:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {[
                        'Seasonal flu care pack banner: ORS, Paracetamol, and Cough Lozenges with Vinisha Pharma branding',
                        'Free Diabetes & Blood Pressure screening camp banner with medical stethoscope graphic',
                        'Generic medicine awareness poster: 100% genuine quality at transparent retail prices'
                      ].map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImagePrompt(t)}
                          className="text-left text-[11px] p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-purple-800 text-slate-700 border border-slate-200/80 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!imagePrompt.trim() || isGeneratingImage}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    {isGeneratingImage ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Graphic with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Poster Graphic</span>
                      </>
                    )}
                  </button>

                  {imageError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{imageError}</span>
                    </div>
                  )}
                </form>

                {/* Generated Graphic Preview Area (5 cols) */}
                <div className="md:col-span-6 flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 min-h-[300px]">
                  {generatedImage ? (
                    <div className="space-y-3 w-full flex flex-col items-center">
                      <img
                        src={generatedImage}
                        alt="Generated Graphic"
                        className="rounded-lg shadow-md max-h-[340px] w-auto object-contain border border-slate-300"
                      />
                      {imageDescription && (
                        <p className="text-[11px] text-slate-600 text-center italic">
                          {imageDescription}
                        </p>
                      )}
                      <a
                        href={generatedImage}
                        download="vinisha_pharmacy_poster.png"
                        className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </a>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 space-y-2 p-6">
                      <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
                      <p className="text-xs font-medium">
                        {isGeneratingImage 
                          ? 'Rendering high-resolution graphic with Gemini 3.1 Flash Image Preview...'
                          : 'Your generated graphic will appear here for download and display'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
