import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const Dashboard = ({ data, analysisMode, selectedWeekday }) => {
  if (!data) return null;

  const { summary, insights, weekday_stats, timeframe } = data;
  
  let currentTotal = summary.total_candles;
  let currentBullish = summary.bullish_count;
  let currentBearish = summary.bearish_count;
  let currentNeutral = summary.neutral_count;
  
  if (analysisMode === 'weekday' && weekday_stats && weekday_stats[selectedWeekday]) {
    const stats = weekday_stats[selectedWeekday];
    currentTotal = stats.reduce((acc, curr) => acc + curr.total, 0);
    currentBullish = stats.reduce((acc, curr) => acc + curr.bullish, 0);
    currentBearish = stats.reduce((acc, curr) => acc + curr.bearish, 0);
    currentNeutral = stats.reduce((acc, curr) => acc + curr.neutral, 0);
  }

  const pieData = [
    { name: 'Bullish', value: currentBullish, color: '#10B981' },
    { name: 'Bearish', value: currentBearish, color: '#EF4444' },
    { name: 'Neutral', value: currentNeutral, color: '#6B7280' },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className="neo-card p-5 md:p-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-gray-400 text-xs md:text-sm font-medium mb-1">{title}</h4>
          <div className="text-2xl md:text-3xl font-bold text-gray-100">{value}</div>
        </div>
        <div className={`p-3 rounded-xl neo-inset ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-xs md:text-sm text-gray-500 font-medium">{subtitle}</div>
    </div>
  );

  return (
    <div className="w-full flex flex-col space-y-5 lg:space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-1">
            {analysisMode === 'weekday' ? `${selectedWeekday} Dominance Dashboard` : 'Market Dashboard'}
          </h2>
          <p className="text-sm md:text-base text-gray-400">
            {analysisMode === 'weekday' 
              ? `High-level analysis of ${selectedWeekday}s for ${timeframe} timeframe.` 
              : `High-level analysis of your ${timeframe} candle dataset.`}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        <StatCard 
          title={analysisMode === 'weekday' ? `${selectedWeekday} Candles` : "Total Candles"} 
          value={currentTotal.toLocaleString()} 
          subtitle="Analyzed points"
          icon={Activity}
          colorClass="text-primary"
        />
        <StatCard 
          title="Bullish Dominance" 
          value={currentTotal > 0 ? `${((currentBullish / currentTotal) * 100).toFixed(1)}%` : '0%'} 
          subtitle={`${currentBullish.toLocaleString()} candles`}
          icon={TrendingUp}
          colorClass="text-success"
        />
        <StatCard 
          title="Bearish Dominance" 
          value={currentTotal > 0 ? `${((currentBearish / currentTotal) * 100).toFixed(1)}%` : '0%'} 
          subtitle={`${currentBearish.toLocaleString()} candles`}
          icon={TrendingDown}
          colorClass="text-danger"
        />
        <StatCard 
          title="Neutral / Doji" 
          value={currentTotal > 0 ? `${((currentNeutral / currentTotal) * 100).toFixed(1)}%` : '0%'} 
          subtitle={`${currentNeutral.toLocaleString()} candles`}
          icon={Minus}
          colorClass="text-gray-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8 flex-1">
        {/* Insight Engine Panel */}
        <div className="neo-card p-4 md:p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-700/30 pb-4">
            <div className="neo-inset p-2 rounded-full text-secondary">
              <Zap size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-100">AI Insight Engine</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {Array.isArray(insights) ? (
              // Legacy Array Fallback
              insights.map((insight, idx) => (
                <div key={idx} className="neo-inset rounded-xl p-5 flex gap-4 border-l-2 border-primary/50">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  <p className="text-gray-300 leading-relaxed text-sm md:text-base font-medium">{insight}</p>
                </div>
              ))
            ) : (
              // New Structured JSON Format
              <div className="space-y-6">
                {insights.market_trend && insights.market_trend.length > 0 && (
                  <div className="animate-in slide-in-from-right-8 duration-700 fade-in">
                    <h4 className="text-secondary font-bold mb-3 flex items-center gap-2"><TrendingUp size={16} /> Market Trend</h4>
                    <div className="space-y-3">
                      {insights.market_trend.map((insight, idx) => (
                        <div key={`trend-${idx}`} className="neo-inset rounded-xl p-4 flex gap-4 border-l-2 border-secondary/50">
                          <div className="h-2 w-2 rounded-full bg-secondary mt-1.5 flex-shrink-0"></div>
                          <p className="text-gray-300 text-sm font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {insights.actionable_patterns && insights.actionable_patterns.length > 0 && (
                  <div className="animate-in slide-in-from-right-8 duration-700 fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                    <h4 className="text-primary font-bold mb-3 flex items-center gap-2"><Activity size={16} /> Actionable Patterns</h4>
                    <div className="space-y-3">
                      {insights.actionable_patterns.map((insight, idx) => (
                        <div key={`action-${idx}`} className="neo-inset rounded-xl p-4 flex gap-4 border-l-2 border-primary/50">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                          <p className="text-gray-300 text-sm font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.volatility_alerts && insights.volatility_alerts.length > 0 && (
                  <div className="animate-in slide-in-from-right-8 duration-700 fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                    <h4 className="text-danger font-bold mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Volatility Alerts</h4>
                    <div className="space-y-3">
                      {insights.volatility_alerts.map((insight, idx) => (
                        <div key={`vol-${idx}`} className="neo-inset rounded-xl p-4 flex gap-4 border-l-2 border-danger/50">
                          <div className="h-2 w-2 rounded-full bg-danger mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                          <p className="text-gray-300 text-sm font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Distribution */}
        <div className="neo-card p-4 md:p-6 flex flex-col h-[350px] md:h-[450px] overflow-y-auto w-full">
          <h3 className="text-xl font-bold mb-6 text-gray-100 flex-shrink-0">
            {analysisMode === 'weekday' ? `${selectedWeekday} Distribution` : 'Global Distribution'}
          </h3>
          <div className="flex-1 w-full neo-inset rounded-xl p-2 md:p-4 relative flex items-center justify-center min-h-[220px] md:min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-neo-bg)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '5px 5px 15px var(--color-neo-shadow1)', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  cursor={false}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Forecasting Panel */}
      {data.forecasts && data.forecasts.length > 0 && (
        <div className="neo-card p-4 md:p-6 w-full animate-in slide-in-from-bottom-8 duration-700 fade-in mt-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="neo-inset p-2 rounded-full text-indigo-400">
                 <TrendingUp size={20} />
               </div>
               <h3 className="text-xl font-bold text-gray-100">Linear Regression Projection</h3>
             </div>
             <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 mt-3 md:mt-0 rounded-full border border-indigo-500/30">
               Next 10 Intervals Forecast
             </span>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
             {data.forecasts.map((f, i) => {
               // Determine color based on Open vs Close
               const isBullish = f.Close > f.Open;
               const colorClass = isBullish ? 'text-success' : 'text-danger';
               const borderClass = isBullish ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5';
               
               return (
                 <div key={i} className={`neo-inset rounded-lg p-3 border ${borderClass} flex flex-col justify-center items-center text-center transition-all hover:scale-105`}>
                   <div className="text-[10px] text-gray-400 font-medium mb-1">{f.Date.split('-').slice(1).join('/')} {f.Time}</div>
                   <div className={`text-sm md:text-base font-bold ${colorClass}`}>₹{f.Close.toFixed(2)}</div>
                   <div className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">{isBullish ? 'BULLISH' : 'BEARISH'}</div>
                 </div>
               );
             })}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
