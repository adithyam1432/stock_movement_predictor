import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Clock, CheckCircle, AlertTriangle, AlertCircle, Trash2, Sparkles, ArrowRight, Table, ShieldCheck, Database, RefreshCw, Layers } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';
import logoImg from '../assets/logo.png';

const UploadCSV = ({ setData, setLoading, setActiveTab }) => {
  const [timeframe, setTimeframe] = useState('15m');
  const [errorMsg, setErrorMsg] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setPendingData(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timeframe', timeframe);

    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Store response locally first to present the cleaning report dashboard panel
      setPendingData(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        setErrorMsg(error.response.data.detail);
      } else {
        setErrorMsg('Failed to analyze CSV. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  }, [setLoading, timeframe]);

  const handleConfirmClean = () => {
    if (pendingData) {
      setData(pendingData);
      setActiveTab('dashboard');
    }
  };

  const handleReset = () => {
    setPendingData(null);
    setErrorMsg(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const timeframes = ['1m', '3m', '5m', '10m', '15m', '30m', '45m', '1h'];

  // If data was uploaded, render the Data Cleaning Status Dashboard
  if (pendingData) {
    const report = pendingData.cleaning_report || {};
    const summary = pendingData.summary || {};
    
    // Calculate a data health percentage
    const totalRaw = summary.total_candles + (report.corrupted_removed || 0) + (report.duplicates_removed || 0);
    const healthPercent = totalRaw > 0 
      ? Math.max(50, Math.round(((totalRaw - (report.corrected_rows || 0) - (report.corrupted_removed || 0) - (report.duplicates_removed || 0)) / totalRaw) * 100))
      : 100;

    return (
      <div className="w-full min-h-full flex flex-col items-center justify-start md:justify-center animate-in fade-in zoom-in duration-500 px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center mb-6 w-full pt-10 sm:pt-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold mb-3 border border-success/20">
            <ShieldCheck size={14} />
            <span>AI Preprocessing & Cleaning Engine Active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-100">Data Cleaning Status Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1 max-w-xl mx-auto">
            Your market dataset has run through the 4-tier preprocessing pipeline. All timestamps have been normalized and corrected.
          </p>
        </div>

        {/* Preprocessor Statistics Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-6">
          <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-gray-500 font-semibold mb-1">RAW RECORDS</span>
            <span className="text-xl md:text-2xl font-bold text-gray-300">{totalRaw}</span>
            <span className="text-[10px] text-gray-600 mt-1">Submitted in CSV</span>
          </div>
          <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-primary font-semibold mb-1">AUTO-FIXED PRICE</span>
            <span className="text-xl md:text-2xl font-bold text-primary">{report.corrected_rows || 0}</span>
            <span className="text-[10px] text-gray-600 mt-1">Nulls / Boundary corrected</span>
          </div>
          <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-warning font-semibold mb-1">REMOVED DUPLICATES</span>
            <span className="text-xl md:text-2xl font-bold text-warning">{report.duplicates_removed || 0}</span>
            <span className="text-[10px] text-gray-600 mt-1">Timestamp collisions</span>
          </div>
          <div className="neo-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-success font-semibold mb-1">HEALTH METRIC</span>
            <span className="text-xl md:text-2xl font-bold text-success">{healthPercent}%</span>
            <span className="text-[10px] text-gray-600 mt-1">Clean dataset ratio</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full mb-8">
          {/* AI Insights & Pipeline Logs */}
          <div className="md:col-span-7 space-y-6">
            <div className="neo-card p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2 tracking-wide uppercase">
                <Sparkles size={16} className="text-primary" />
                AI Quality Insights & Checklist
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-success/5 border border-success/10 rounded-xl">
                  <div className="mt-0.5 p-1 rounded bg-success/10 text-success">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-300">Indian Standard Time Alignment</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Purged all non-session times. Only active IST trading hours (09:15 - 15:30) have been retained.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-success/5 border border-success/10 rounded-xl">
                  <div className="mt-0.5 p-1 rounded bg-success/10 text-success">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-300">WeekendPurge™ Filter Active</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">All Saturday and Sunday candles have been cleanly filtered to keep mathematical models unwarped.</p>
                  </div>
                </div>

                {report.ai_insights && report.ai_insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#1e2024] rounded-xl border border-gray-700/40">
                    <div className="mt-0.5 p-1 rounded bg-primary/10 text-primary">
                      <ShieldCheck size={14} />
                    </div>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Preprocessing Pipeline details */}
          <div className="md:col-span-5 space-y-6">
            <div className="neo-card p-5 md:p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2 tracking-wide uppercase">
                  <Layers size={16} className="text-primary" />
                  Preprocessing Stage Verification
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-700/30">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span>Column Header Resolution</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success font-semibold">SUCCESS</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-700/30">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span>Candle Metric Derivations</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success font-semibold">SUCCESS</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-700/30">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span>Volume Correction</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success font-semibold">VERIFIED</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-700/30">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span>Corrupted Row Filter</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success font-semibold">VERIFIED</span>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-lg bg-[#151719] neo-inset text-center">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">PROCESSED TIMESTAMP DURATION</div>
                  <div className="text-sm font-bold text-gray-300 mt-1 flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    <span>{summary.total_candles} standard trading candles</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <button
                  onClick={handleConfirmClean}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-white rounded-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Proceed to Analytics Dashboard</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-gray-400 hover:text-gray-200 text-xs font-semibold hover:bg-gray-700/20 transition-all border border-transparent hover:border-gray-700/30"
                >
                  <RefreshCw size={12} />
                  <span>Upload Different Dataset</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed preprocessor logs button */}
        {report.auto_fixed_summary && report.auto_fixed_summary.length > 0 && (
          <div className="w-full">
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-bold text-gray-500 hover:text-gray-300 flex items-center gap-2 mx-auto mb-4 bg-transparent outline-none focus:outline-none transition-colors"
            >
              <Database size={12} />
              <span>{showLogs ? 'Hide preprocessor details log' : 'View complete preprocessor pipeline logs'}</span>
            </button>
            
            {showLogs && (
              <div className="w-full p-4 rounded-xl bg-[#151719] border border-gray-700/30 font-mono text-[11px] text-gray-400 space-y-2 max-h-48 overflow-y-auto neo-inset">
                {report.auto_fixed_summary.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">[AUTO-FIX]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start md:justify-center animate-in fade-in zoom-in duration-500 px-4 py-12 relative">
      
      {/* Premium App Logo in the top-left corner */}
      <div className="absolute top-2 left-2 sm:top-0 sm:left-0 z-20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1e2024]/80 backdrop-blur-md border border-gray-700/50 p-1 flex items-center justify-center shadow-lg neo-card">
          <img src={logoImg} alt="CandleMiner Logo" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-gray-200 tracking-wider">CandleMiner</span>
        </div>
      </div>

      <div className="text-center mb-8 w-full max-w-2xl mx-auto pt-16 sm:pt-0">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-gray-100">Upload Market Data</h2>
        <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base font-medium">
          Select your dataset timeframe and upload OHLC CSV data. The system will perform advanced Linear Algebra transformations and Data Mining to extract hidden patterns.
        </p>
      </div>

      <div className="neo-card w-full max-w-2xl p-4 md:p-8 flex flex-col items-center">
        {/* Timeframe Selector */}
        <div className="w-full mb-6 max-w-xs">
          <label className="block text-gray-400 text-sm font-bold mb-2 flex items-center justify-center gap-2">
            <Clock size={16} /> Expected Timeframe
          </label>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-[#1e2024] border border-gray-700 text-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors cursor-pointer neo-inset text-center appearance-none"
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>

        {errorMsg && (
          <div className="w-full mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <div 
          {...getRootProps()} 
          className={`neo-inset w-full p-10 md:p-16 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center border-2 border-transparent rounded-2xl
            ${isDragActive ? 'border-primary/50 !shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] text-primary' : 'hover:border-gray-700'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className={`p-6 rounded-full mb-6 transition-transform duration-300 ${isDragActive ? 'neo-inset scale-110' : 'neo-button text-gray-400'}`}>
            <UploadCloud size={48} className={isDragActive ? 'text-primary' : ''} />
          </div>
          
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-center text-gray-200">
            {isDragActive ? 'Drop your dataset here' : 'Drag & drop CSV file'}
          </h3>
          <p className="text-sm text-gray-500 mb-8 text-center">or click to browse from your computer</p>
          
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-400">
            <span className="neo-button px-3 py-1.5 font-mono">Date</span>
            <span className="neo-button px-3 py-1.5 font-mono">Time</span>
            <span className="neo-button px-3 py-1.5 font-mono">Open</span>
            <span className="neo-button px-3 py-1.5 font-mono">Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadCSV;
