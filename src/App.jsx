import React, { useState, useEffect } from 'react';
import { Upload, LayoutDashboard, BarChart2, GitCommit, Search, Activity, Sun, Moon, Menu, X, CheckCircle, AlertTriangle, AlertCircle, Trash2, HelpCircle, Sparkles, Settings, Globe, Wifi, Check } from 'lucide-react';
import UploadCSV from './components/UploadCSV';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Similarity from './components/Similarity';
import Patterns from './components/Patterns';
import { isNativePlatform, getApiBaseUrl, setApiBaseUrl } from './utils/apiConfig';

function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('global');
  const [selectedWeekday, setSelectedWeekday] = useState('Monday');

  // API host configuration states
  const [showApiSettingsModal, setShowApiSettingsModal] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'failed'

  const testApiConnection = async (url) => {
    setConnectionStatus('testing');
    try {
      const targetUrl = url.trim().endsWith('/') ? url.trim().slice(0, -1) : url.trim();
      const response = await fetch(`${targetUrl}/api/health`, { method: 'GET' });
      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('failed');
      }
    } catch (e) {
      console.error(e);
      setConnectionStatus('failed');
    }
  };

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  // Mobile navigation overlay state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Theme State (Strictly Light or Dark)
  const [theme, setTheme] = useState(() => {
    const persisted = localStorage.getItem('theme');
    if (persisted === 'light' || persisted === 'dark') {
      return persisted;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const navigation = [
    { id: 'upload', name: 'Upload', icon: Upload },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', name: 'Analytics', icon: BarChart2 },
    { id: 'similarity', name: 'Similarity', icon: GitCommit },
    { id: 'patterns', name: 'Patterns', icon: Search },
  ];

  // Splash screen transition timer
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, 3000); // Fade starts at 3 seconds
    
    const unmountTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500); // Unmounts at 3.5 seconds
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  // Theme application and device detection
  const applyTheme = (currentTheme) => {
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const renderContent = () => {
    if (!data && activeTab !== 'upload') {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-gray-400 p-6 text-center min-h-[400px]">
          <div className="p-8 neo-inset rounded-full">
            <Activity size={48} className="text-primary/70" />
          </div>
          <p className="text-lg font-medium">Please upload a CSV dataset to view this section.</p>
          <button 
            onClick={() => setActiveTab('upload')}
            className="neo-button px-6 py-3 font-semibold text-gray-200 hover:text-primary transition-colors"
          >
            Go to Upload
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'upload':
        return <UploadCSV setData={setData} setLoading={setLoading} setActiveTab={setActiveTab} />;
      case 'dashboard':
        return <Dashboard data={data} analysisMode={analysisMode} selectedWeekday={selectedWeekday} />;
      case 'analytics':
        return <Analytics data={data} analysisMode={analysisMode} selectedWeekday={selectedWeekday} />;
      case 'similarity':
        return <Similarity data={data} analysisMode={analysisMode} selectedWeekday={selectedWeekday} />;
      case 'patterns':
        return <Patterns data={data} analysisMode={analysisMode} selectedWeekday={selectedWeekday} />;
      default:
        return <Dashboard data={data} analysisMode={analysisMode} selectedWeekday={selectedWeekday} />;
    }
  };

  // 1. Growing Stock Line Loader Splash Screen View
  if (showSplash) {
    return (
      <div className={`fixed inset-0 z-50 bg-[#212428] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeSplash ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center space-y-8 px-4">
          <div className="relative">
            {/* Soft glowing ambient circle */}
            <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl w-48 h-48 -translate-x-12 -translate-y-12 animate-pulse"></div>
            
            {/* SVG Custom A-J-R-S-S-V Hand-drawn Styled Loader */}
            <svg className="w-80 h-64 text-success relative z-10 overflow-visible animate-in fade-in zoom-in-95 duration-500" viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M 25,155 L 70,90 L 115,120 L 155,50 L 200,80 L 240,10" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="growing-line"
              />
              
              {/* Pulsating Interactive Dots */}
              <circle cx="25" cy="155" r="5" className="loader-dot fill-success" style={{ animationDelay: '0s' }} />
              <circle cx="70" cy="90" r="5" className="loader-dot fill-success" style={{ animationDelay: '0.57s' }} />
              <circle cx="115" cy="120" r="5" className="loader-dot fill-success" style={{ animationDelay: '0.96s' }} />
              <circle cx="155" cy="50" r="5" className="loader-dot fill-success" style={{ animationDelay: '1.53s' }} />
              <circle cx="200" cy="80" r="5" className="loader-dot fill-success" style={{ animationDelay: '1.92s' }} />
              <circle cx="240" cy="10" r="5" className="loader-dot fill-success" style={{ animationDelay: '2.50s' }} />

              {/* Hand-drawn letter labels matching user's new upward image */}
              <text x="8" y="162" className="loader-text text-xl" style={{ animationDelay: '0.1s' }}>A</text>
              <text x="53" y="78" className="loader-text text-xl" style={{ animationDelay: '0.67s' }}>J</text>
              <text x="110" y="142" className="loader-text text-xl" style={{ animationDelay: '1.06s' }}>R</text>
              <text x="145" y="38" className="loader-text text-xl" style={{ animationDelay: '1.63s' }}>S</text>
              <text x="204" y="102" className="loader-text text-xl" style={{ animationDelay: '2.02s' }}>S</text>
              <text x="245" y="18" className="loader-text text-xl" style={{ animationDelay: '2.60s' }}>V</text>
            </svg>
          </div>
          
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-extrabold text-gray-100 tracking-wider flex items-center justify-center gap-2 mb-2">
              <Activity className="text-primary animate-pulse" />
              QuantEdge AI
            </h1>
            <p className="text-sm font-semibold tracking-widest text-primary/80 uppercase animate-pulse">
              Synthesizing Candlestick Intelligence
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#212428] text-gray-300 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 flex-col neo-card m-4 mr-0 p-4 z-20">
        <div className="p-4 mb-8 text-center border-b border-gray-700/30">
          <h1 className="text-xl font-bold text-gray-100 flex items-center justify-center gap-2">
            <Activity className="text-primary" />
            QuantEdge AI
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">LINEAR ALGEBRA MINING</p>
        </div>
        
        <nav className="flex-1 space-y-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const disabled = !data && item.id !== 'upload';
            
            return (
              <button
                key={item.id}
                onClick={() => !disabled && setActiveTab(item.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-4 px-5 py-3 transition-all duration-300 ${
                  isActive 
                    ? 'neo-inset text-primary' 
                    : disabled 
                      ? 'opacity-40 cursor-not-allowed text-gray-600' 
                      : 'neo-button text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Dynamic Theme switching Tab & Status */}
        <div className="mt-auto pt-6 border-t border-gray-700/30 space-y-4">
          <div className="flex items-center justify-between p-1 bg-[#151719] rounded-xl neo-inset">
            <button 
              onClick={() => handleThemeChange('light')}
              className={`py-2.5 rounded-lg transition-all duration-300 flex-1 flex items-center justify-center gap-2 font-semibold text-xs ${theme === 'light' ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-gray-200'}`}
              title="Light Mode"
            >
              <Sun size={15} />
              <span>Light</span>
            </button>
            <button 
              onClick={() => handleThemeChange('dark')}
              className={`py-2.5 rounded-lg transition-all duration-300 flex-1 flex items-center justify-center gap-2 font-semibold text-xs ${theme === 'dark' ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-gray-200'}`}
              title="Dark Mode"
            >
              <Moon size={15} />
              <span>Dark</span>
            </button>
          </div>

          {/* Connection Settings */}
          <button 
            onClick={() => {
              setApiUrlInput(getApiBaseUrl());
              setConnectionStatus('idle');
              setShowApiSettingsModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl neo-button text-gray-400 hover:text-primary transition-all text-xs font-semibold"
          >
            <Settings size={14} />
            <span>API Settings</span>
          </button>

          <div className="text-center">
            <div className="neo-inset p-3 inline-block rounded-lg w-full">
              <div className="text-[10px] text-gray-500 font-medium">
                Running in: <span className="text-primary font-bold ml-1">{isNativePlatform() ? 'Android Native App' : 'Web Browser'}</span>
              </div>
              <div className="text-[9px] text-gray-600 truncate mt-1">
                API Host: {isNativePlatform() ? getApiBaseUrl() : 'Internal Proxy'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8 pb-24 md:pb-8 z-10 w-full flex flex-col overflow-x-hidden">
        
        {/* Floating Controls for Mobile View (Theme and Settings) */}
        <div className="md:hidden absolute top-4 right-4 z-30 flex items-center gap-2">
          <div className="flex items-center bg-[#151719]/80 backdrop-blur-md p-1 rounded-full neo-inset border border-gray-800/40">
            <button 
              onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
          
          <button 
            onClick={() => {
              setApiUrlInput(getApiBaseUrl());
              setConnectionStatus('idle');
              setShowApiSettingsModal(true);
            }}
            className="p-2 bg-[#1e2024]/80 backdrop-blur-md border border-gray-700/50 rounded-full shadow-lg neo-button text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
            title="API Settings"
          >
            <Settings size={14} />
          </button>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-[#212428]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        {data && activeTab !== 'upload' && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1e2024] p-3 md:p-4 rounded-xl mb-6 neo-inset border border-gray-700/50 flex-shrink-0 gap-3">
            <div className="flex space-x-2 bg-[#151719] p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <button 
                onClick={() => setAnalysisMode('global')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none ${analysisMode === 'global' ? 'bg-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Global Mode
              </button>
              <button 
                onClick={() => setAnalysisMode('weekday')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none ${analysisMode === 'weekday' ? 'bg-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Weekday Mode
              </button>
            </div>
            
            {analysisMode === 'weekday' && (
              <select 
                value={selectedWeekday}
                onChange={(e) => setSelectedWeekday(e.target.value)}
                className="w-full sm:w-auto bg-[#212428] border border-gray-700 text-gray-200 rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors cursor-pointer appearance-none text-center"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="flex-1 h-full min-h-0">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 neo-card rounded-b-none rounded-t-3xl p-2 z-30 flex justify-around items-center h-20 px-2 pb-safe">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const disabled = !data && item.id !== 'upload';
          
          return (
            <button
              key={item.id}
              onClick={() => !disabled && setActiveTab(item.id)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center w-16 h-14 transition-all duration-300 rounded-xl ${
                isActive 
                  ? 'neo-inset text-primary' 
                  : disabled 
                    ? 'opacity-30 cursor-not-allowed text-gray-600' 
                    : 'text-gray-400'
              }`}
            >
              <Icon size={20} className={isActive ? 'mb-1 scale-110 transition-transform' : 'mb-1'} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic API Endpoint Configuration Dialog */}
      {showApiSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
          <div className="relative w-full max-w-md bg-[#212428] rounded-3xl p-6 border border-gray-700/50 shadow-2xl neo-card text-gray-200 transform transition-all scale-100 flex flex-col space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/30">
              <div className="flex items-center gap-3">
                <Globe className="text-primary animate-pulse" size={22} />
                <h3 className="text-lg font-bold text-gray-100">API Connection Hub</h3>
              </div>
              <button 
                onClick={() => setShowApiSettingsModal(false)}
                className="p-2 rounded-lg neo-button text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#151719] rounded-2xl border border-gray-800 neo-inset">
                <div className="text-xs text-gray-400 font-semibold mb-2 flex items-center justify-between">
                  <span>Current App Env</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${isNativePlatform() ? 'bg-indigo-950 text-indigo-300' : 'bg-green-950 text-green-300'}`}>
                    {isNativePlatform() ? 'Android Native' : 'Web Browser'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {isNativePlatform() 
                    ? "In native Android environment, standard localhosts like '127.0.0.1' won't resolve. Please specify your host IP or production domain." 
                    : "Running inside standard desktop browser environment. API proxy configuration will default cleanly."
                  }
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Target Backend API Host</label>
                <input 
                  type="text" 
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="e.g. http://10.0.2.2:8000"
                  className="w-full bg-[#151719] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-primary neo-inset transition-colors font-mono"
                />
              </div>

              {/* Connection preset buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button 
                  onClick={() => setApiUrlInput('http://10.0.2.2:8000')}
                  className="px-3 py-1.5 rounded-lg neo-button text-[10px] font-semibold text-gray-400 hover:text-gray-200"
                >
                  Android Emulator (10.0.2.2)
                </button>
                <button 
                  onClick={() => setApiUrlInput('http://localhost:8000')}
                  className="px-3 py-1.5 rounded-lg neo-button text-[10px] font-semibold text-gray-400 hover:text-gray-200"
                >
                  Localhost (8000)
                </button>
              </div>

              {/* API test status indicators */}
              <div className="flex items-center justify-between text-xs pt-2">
                <button 
                  onClick={() => testApiConnection(apiUrlInput)}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 transition-colors text-white font-bold rounded-xl flex items-center gap-2 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                  disabled={connectionStatus === 'testing'}
                >
                  <Wifi size={14} />
                  <span>{connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
                </button>
                
                {connectionStatus === 'success' && (
                  <span className="text-success font-semibold flex items-center gap-1">
                    <CheckCircle size={14} /> Online & Reachable
                  </span>
                )}
                {connectionStatus === 'failed' && (
                  <span className="text-danger font-semibold flex items-center gap-1">
                    <AlertCircle size={14} /> Unreachable
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-700/30">
              <button 
                onClick={() => setShowApiSettingsModal(false)}
                className="flex-1 py-3 font-semibold text-xs text-gray-400 hover:text-gray-200 neo-button rounded-2xl transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setApiBaseUrl(apiUrlInput);
                  setShowApiSettingsModal(false);
                  window.location.reload(); // Reload context to bind the new host
                }}
                className="flex-1 py-3 bg-success hover:bg-green-600 transition-colors text-white font-bold text-xs rounded-2xl shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                <Check size={14} />
                <span>Save & Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;

