import React, { useMemo } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = ({ data, analysisMode, selectedWeekday }) => {
  if (!data) return null;

  const { timeframe_stats, weekday_stats, timeframe } = data;

  const currentStats = useMemo(() => {
    if (analysisMode === 'weekday' && weekday_stats && weekday_stats[selectedWeekday]) {
      return weekday_stats[selectedWeekday];
    }
    return timeframe_stats;
  }, [analysisMode, selectedWeekday, weekday_stats, timeframe_stats]);

  const chartData = useMemo(() => {
    if (!currentStats || currentStats.length === 0) return [];
    
    let processed = [...currentStats]
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(stat => ({
        name: stat.time,
        Bullish: stat.bullish,
        Bearish: stat.bearish,
        Neutral: stat.neutral,
        Volatility: stat.volatility_std || 0
      }));
      
    // Recharts AreaChart requires at least 2 points to render an area.
    // If we only have 1 timeframe (e.g. daily data where time is always '00:00'),
    // we duplicate the point so the chart can draw a flat line.
    if (processed.length === 1) {
      processed.push({
        ...processed[0],
        name: processed[0].name + " (End)"
      });
    }
    
    return processed;
  }, [currentStats]);

  const strongestBullish = currentStats?.length ? [...currentStats].sort((a, b) => b.bullish_ratio - a.bullish_ratio)[0] : null;
  const strongestBearish = currentStats?.length ? [...currentStats].sort((a, b) => b.bearish_ratio - a.bearish_ratio)[0] : null;
  const mostVolatile = currentStats?.length ? [...currentStats].sort((a, b) => (b.volatility_std || 0) - (a.volatility_std || 0))[0] : null;

  return (
    <div className="w-full flex flex-col space-y-5 lg:space-y-8 max-w-7xl mx-auto pb-10">
      <div className="px-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-1">
          {analysisMode === 'weekday' ? `${selectedWeekday} Timeframe Analytics` : 'Timeframe Analytics'}
        </h2>
        <p className="text-sm md:text-base text-gray-400">
          {analysisMode === 'weekday' 
            ? `Historical performance breakdown by ${timeframe} intervals for ${selectedWeekday}s.` 
            : `Historical performance breakdown by ${timeframe} intervals.`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
        <div className="neo-card p-5 md:p-6 border-l-4 border-l-success flex flex-col justify-center">
          <h3 className="text-xs md:text-sm text-gray-400 font-medium mb-1">Strongest Bullish Timeframe</h3>
          <div className="text-3xl md:text-4xl font-bold text-success mb-2">{strongestBullish?.time || 'N/A'}</div>
          <p className="text-sm text-gray-300 font-medium">
            Historically closes bullish <span className="font-bold text-white px-1 py-0.5 rounded neo-inset text-xs ml-1">{strongestBullish ? (strongestBullish.bullish_ratio * 100).toFixed(1) : 0}%</span> of the time.
          </p>
        </div>
        
        <div className="neo-card p-5 md:p-6 border-l-4 border-l-danger flex flex-col justify-center">
          <h3 className="text-xs md:text-sm text-gray-400 font-medium mb-1">Strongest Bearish Timeframe</h3>
          <div className="text-3xl md:text-4xl font-bold text-danger mb-2">{strongestBearish?.time || 'N/A'}</div>
          <p className="text-sm text-gray-300 font-medium">
            Historically closes bearish <span className="font-bold text-white px-1 py-0.5 rounded neo-inset text-xs ml-1">{strongestBearish ? (strongestBearish.bearish_ratio * 100).toFixed(1) : 0}%</span> of the time.
          </p>
        </div>

        <div className="neo-card p-5 md:p-6 border-l-4 border-l-warning flex flex-col justify-center">
          <h3 className="text-xs md:text-sm text-gray-400 font-medium mb-1">Most Volatile Timeframe</h3>
          <div className="text-3xl md:text-4xl font-bold text-warning mb-2">{mostVolatile?.time || 'N/A'}</div>
          <p className="text-sm text-gray-300 font-medium">
            Standard deviation of <span className="font-bold text-white px-1 py-0.5 rounded neo-inset text-xs ml-1">{mostVolatile && mostVolatile.volatility_std != null ? mostVolatile.volatility_std.toFixed(4) : '0.0000'}</span> in price swings.
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        <div className="neo-card p-4 md:p-6 flex flex-col min-h-[300px] md:min-h-[400px]">
        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-gray-100 px-2">Timeframe Distribution (Counts)</h3>
        <div className="w-full neo-inset rounded-xl p-2 md:p-6 relative">
          {chartData.length > 0 ? (
            <div className="w-full h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 5, left: -25, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-tertiary)" 
                    tick={{fill: 'var(--text-secondary)', fontSize: 10}} 
                    angle={-45} 
                    textAnchor="end"
                    height={55}
                    tickMargin={8}
                  />
                  <YAxis stroke="var(--text-tertiary)" tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ backgroundColor: 'var(--color-neo-bg)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '5px 5px 15px var(--color-neo-shadow1)', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar dataKey="Bullish" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Neutral" stackId="a" fill="#6B7280" />
                  <Bar dataKey="Bearish" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">No timeframe data available for the selected filters.</div>
          )}
        </div>
      </div>

      <div className="neo-card p-4 md:p-6 flex flex-col min-h-[300px] md:min-h-[400px]">
        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-gray-100 px-2">Price Volatility (Standard Deviation)</h3>
        <div className="w-full neo-inset rounded-xl p-2 md:p-6 relative">
          {chartData.length > 0 ? (
            <div className="w-full h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 5, left: -25, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-tertiary)" 
                    tick={{fill: 'var(--text-secondary)', fontSize: 10}} 
                    angle={-45} 
                    textAnchor="end"
                    height={55}
                    tickMargin={8}
                  />
                  <YAxis stroke="var(--text-tertiary)" tick={{fill: 'var(--text-secondary)', fontSize: 10}} tickFormatter={(val) => val.toFixed(4)} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ backgroundColor: 'var(--color-neo-bg)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '5px 5px 15px var(--color-neo-shadow1)', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                    formatter={(value) => value.toFixed(4)}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Area type="monotone" dataKey="Volatility" stroke="#F59E0B" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">No volatility data available for the selected filters.</div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Analytics;
