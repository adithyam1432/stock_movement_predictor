import React from 'react';
import { Target, Maximize2, Minimize2 } from 'lucide-react';

const Patterns = ({ data }) => {
  if (!data) return null;

  const { cluster_summary } = data;

  const getPatternIcon = (patternType) => {
    if (patternType.includes('Bullish')) return <Maximize2 className="text-success" size={20} />;
    if (patternType.includes('Bearish')) return <Minimize2 className="text-danger" size={20} />;
    return <Target className="text-gray-400" size={20} />;
  };

  const getCandleColor = (patternType) => {
    if (patternType.includes('Bullish')) return 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (patternType.includes('Bearish')) return 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    return 'bg-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)]';
  };

  return (
    <div className="h-full flex flex-col space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-10">
      <div className="px-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-1">KMeans Cluster Patterns</h2>
        <p className="text-sm md:text-base text-gray-400">Hidden market structures identified through unsupervised learning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {cluster_summary.map((cluster) => {
          const isBullish = cluster.centroid_close >= cluster.centroid_open;
          const bodyHeight = Math.max(Math.abs(cluster.centroid_close - cluster.centroid_open) * 20, 10);
          const topWick = isBullish ? 15 : 5;
          const bottomWick = isBullish ? 5 : 15;
          
          return (
            <div key={cluster.cluster_id} className="neo-card p-6 flex flex-col group">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="neo-inset p-2.5 rounded-xl">
                    {getPatternIcon(cluster.pattern_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200">Cluster {cluster.cluster_id}</h3>
                    <p className="text-xs font-medium text-gray-500">{cluster.size} occurrences</p>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-gray-400 neo-button px-3 py-1.5 rounded-lg shadow-none border border-gray-700/30">
                  #{cluster.cluster_id}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center py-10 neo-inset rounded-2xl mb-6">
                {/* Visual Representation of the Centroid Candle */}
                <div className="flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  {/* Top Wick */}
                  <div className={`w-1 bg-gray-500 rounded-t-full shadow-inner`} style={{ height: `${topWick}px` }}></div>
                  
                  {/* Body */}
                  <div 
                    className={`w-6 rounded-[4px] ${getCandleColor(cluster.pattern_type)} z-10`} 
                    style={{ height: `${bodyHeight}px` }}
                  ></div>
                  
                  {/* Bottom Wick */}
                  <div className={`w-1 bg-gray-500 rounded-b-full shadow-inner`} style={{ height: `${bottomWick}px` }}></div>
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-lg font-bold mb-4 text-gray-200">{cluster.pattern_type}</h4>
                <div className="flex justify-center gap-8 text-xs text-gray-400">
                  <div className="flex flex-col items-center neo-button px-4 py-2 rounded-xl">
                    <span className="mb-1 font-medium">Avg Open</span>
                    <span className="font-mono text-gray-200 font-bold">{cluster.centroid_open.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center neo-button px-4 py-2 rounded-xl">
                    <span className="mb-1 font-medium">Avg Close</span>
                    <span className="font-mono text-gray-200 font-bold">{cluster.centroid_close.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Patterns;
