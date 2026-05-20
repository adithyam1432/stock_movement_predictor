import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const Similarity = ({ data, analysisMode, selectedWeekday }) => {
  if (!data) return null;

  const { similarity_matrix, pca_data, cluster_summary, weekday_matrices } = data;

  const currentMatrix = useMemo(() => {
    if (analysisMode === 'weekday' && weekday_matrices && weekday_matrices[selectedWeekday]) {
      return weekday_matrices[selectedWeekday].heatmap_data;
    }
    return similarity_matrix;
  }, [analysisMode, selectedWeekday, similarity_matrix, weekday_matrices]);

  const displayMatrix = currentMatrix ? currentMatrix.slice(0, 15) : [];
  const columns = Object.keys(displayMatrix[0] || {}).filter(k => k !== 'id').slice(0, 15);

  const getHeatmapColor = (value) => {
    if (value === 1) return 'bg-primary text-white font-bold neo-button shadow-none';
    if (value > 0.8) return 'bg-primary/80 text-white';
    if (value > 0.5) return 'bg-primary/40 text-gray-200';
    if (value > 0) return 'bg-primary/10 text-gray-400';
    if (value > -0.5) return 'bg-danger/10 text-gray-400';
    return 'bg-danger/30 text-gray-300';
  };

  const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

  const filteredPcaData = useMemo(() => {
    if (!pca_data) return [];
    if (analysisMode === 'weekday') {
      return pca_data.filter(item => item.weekday === selectedWeekday);
    }
    return pca_data;
  }, [pca_data, analysisMode, selectedWeekday]);

  return (
    <div className="w-full flex flex-col space-y-5 lg:space-y-8 max-w-7xl mx-auto pb-10">
      <div className="px-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-1">
          {analysisMode === 'weekday' ? `${selectedWeekday} Linear Algebra` : 'Linear Algebra'}
        </h2>
        <p className="text-sm md:text-base text-gray-400">
          {analysisMode === 'weekday' 
            ? `Timeframe similarities specifically computed for ${selectedWeekday}s.` 
            : 'Timeframe similarities and PCA dimensionality reduction.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 flex-1">
        {/* PCA Scatter Plot */}
        <div className="neo-card p-4 md:p-6 flex flex-col min-h-[300px] md:min-h-[400px]">
          <h3 className="text-lg md:text-xl font-bold mb-1 text-gray-100">PCA 2D Projection</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 font-medium">4D candle vectors reduced to 2D using Principal Component Analysis. Colored by KMeans cluster.</p>
          
          <div className="flex-1 w-full neo-inset p-2 md:p-4 rounded-xl relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 5, bottom: 10, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="x" name="PC1" stroke="var(--text-tertiary)" tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
                <YAxis type="number" dataKey="y" name="PC2" stroke="var(--text-tertiary)" tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3', stroke: 'var(--text-tertiary)' }}
                  contentStyle={{ backgroundColor: 'var(--color-neo-bg)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '5px 5px 15px var(--color-neo-shadow1)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Scatter name="Candles" data={filteredPcaData} fill="#8884d8">
                  {filteredPcaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {/* Cluster Legend */}
          <div className="flex flex-wrap gap-2 md:gap-4 mt-4 md:mt-6 justify-center">
            {cluster_summary.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] md:text-sm font-medium text-gray-400 neo-inset px-2.5 py-1 md:px-3 md:py-1.5 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: COLORS[c.cluster_id % COLORS.length] }}></div>
                <span>Cluster {c.cluster_id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Similarity Matrix Heatmap */}
        <div className="neo-card p-4 md:p-6 flex flex-col w-full overflow-hidden">
          <h3 className="text-lg md:text-xl font-bold mb-1 text-gray-100">Cosine Similarity</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 font-medium">
            {analysisMode === 'weekday' 
              ? `Vector similarity between different times on ${selectedWeekday}s (Top 15).` 
              : `Vector similarity between different times of the day (Top 15).`}
          </p>
          
          <div className="flex-1 w-full neo-inset p-2 md:p-4 rounded-xl overflow-x-auto hide-scrollbar -mx-0">
            <div className="min-w-[500px] h-full flex items-center">
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-gray-500 font-medium text-left">Time</th>
                    {columns.map(col => (
                      <th key={col} className="p-2 text-gray-400 font-medium rotate-[-45deg] origin-bottom-left h-20 text-xs">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 text-gray-400 font-medium text-left text-xs border-r border-gray-700/30">{row.id}</td>
                      {columns.map(col => {
                        const val = row[col];
                        return (
                          <td key={col} className="p-1">
                            <div className={`w-full h-7 md:h-8 flex items-center justify-center rounded text-[10px] md:text-xs transition-transform hover:scale-110 ${getHeatmapColor(val)}`}>
                              {val ? val.toFixed(2) : '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Similarity;
