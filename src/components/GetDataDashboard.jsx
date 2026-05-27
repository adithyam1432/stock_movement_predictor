import React, { useState, useEffect, useRef } from 'react';
import { Download, Search, Calendar, Clock, Activity, Loader2 } from 'lucide-react';
import nseSymbols from '../data/nse_symbols.json';

const GetDataDashboard = ({ onDataReceived }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  
  // Default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [interval, setInterval] = useState('15m');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const searchRef = useRef(null);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length > 0) {
      const filtered = nseSymbols.filter(s => 
        s.name.toLowerCase().includes(value.toLowerCase()) || 
        s.symbol.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSymbol = (symbolObj) => {
    setSelectedSymbol(symbolObj);
    setQuery(symbolObj.name);
    setSuggestions([]);
    setError('');
  };

  const fetchMarketData = async () => {
    if (!selectedSymbol) {
      setError('Please select a stock or index from the search suggestions.');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/fetch_market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: selectedSymbol.symbol,
          start_date: startDate,
          end_date: endDate,
          interval: interval
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch market data');
      }

      const data = await response.json();
      onDataReceived(data);
      
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message || 'An unexpected error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4 md:px-0">
      <div className="text-center mb-8 max-w-2xl">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
          <Activity size={40} className="text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 mb-4 tracking-tight">
          CandleMiner
        </h1>
        <p className="text-gray-400 text-base md:text-lg">
          Connect directly to the National Stock Exchange of India (NSE). Fetch real-time historical data, preprocess it automatically, and run advanced Machine Learning projections.
        </p>
      </div>

      <div className="neo-card p-6 md:p-8 w-full max-w-2xl relative">
        <h2 className="text-xl font-bold text-gray-100 mb-6 flex items-center">
          <Download className="mr-2 text-primary" size={24} />
          Market Data Configuration
        </h2>

        {/* Search Bar */}
        <div className="mb-6 relative" ref={searchRef}>
          <label className="block text-sm font-medium text-gray-400 mb-2">Search NSE Symbol or Index</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="e.g. NIFTY 50, Reliance, TCS..."
              className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner placeholder-gray-500 text-lg font-medium"
            />
          </div>
          
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
              {suggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelectSymbol(s)}
                  className="px-4 py-3 hover:bg-primary/20 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-700/50 last:border-0"
                >
                  <span className="font-medium text-gray-200">{s.name}</span>
                  <span className="text-xs px-2 py-1 bg-slate-700 text-gray-300 rounded neo-inset">{s.symbol}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Date Pickers */}
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                <Calendar className="mr-2" size={16} /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                <Calendar className="mr-2" size={16} /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
              <Clock className="mr-2" size={16} /> Interval / Timeframe
            </label>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'].map((t) => (
                <button
                  key={t}
                  onClick={() => setInterval(t)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    interval === t 
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400' 
                    : 'bg-slate-800 text-gray-400 border border-slate-700 hover:bg-slate-700 hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm font-medium flex items-start">
            <span className="block mt-0.5 mr-2">⚠️</span>
            {error}
          </div>
        )}

        <button
          onClick={fetchMarketData}
          disabled={isLoading || !selectedSymbol}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
            isLoading || !selectedSymbol
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
              : 'bg-gradient-to-r from-primary to-blue-600 text-white hover:from-blue-600 hover:to-blue-500 shadow-lg hover:shadow-primary/25 border border-blue-400/30'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-3" size={24} />
              Preprocessing ML Pipeline...
            </>
          ) : (
            'Fetch & Preprocess Data'
          )}
        </button>
        
        {!selectedSymbol && !isLoading && (
           <p className="text-center text-xs text-gray-500 mt-4 font-medium">
             You must select a symbol from the search bar to proceed.
           </p>
        )}
      </div>
    </div>
  );
};

export default GetDataDashboard;
