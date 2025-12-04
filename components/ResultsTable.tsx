import React, { useMemo } from 'react';
import { FileJob, DisplayRow } from '../types';
import { formatTimestamp } from '../utils';

interface ResultsTableProps {
  jobs: FileJob[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ jobs }) => {
  // Flatten jobs into display rows and calculate duplicates
  const displayRows: DisplayRow[] = useMemo(() => {
    let rows: DisplayRow[] = [];
    
    // 1. Flatten jobs into rows
    jobs.forEach(job => {
      // If job is success and has results, create a row for each result
      if (job.status === 'success' && job.results.length > 0) {
        job.results.forEach((res, idx) => {
          const timestamp = res.time ? new Date(res.time).getTime() : 0;
          rows.push({
            uniqueId: `${job.id}-${idx}`,
            jobId: job.id,
            fileName: job.fileName,
            imageUrl: job.imageUrl,
            account: res.account,
            timestamp: isNaN(timestamp) ? 0 : timestamp,
            score: res.score,
            status: 'success'
          });
        });
      } 
      // If success but no results (empty), or error/pending/processing, create one row representing the file
      else {
        rows.push({
          uniqueId: job.id,
          jobId: job.id,
          fileName: job.fileName,
          imageUrl: job.imageUrl,
          account: '-',
          timestamp: 0,
          score: 0,
          status: job.status,
          errorMessage: job.errorMessage
        });
      }
    });

    // 2. Calculate frequencies for successful rows
    const accountCounts: Record<string, number> = {};
    rows.forEach(row => {
      if (row.status === 'success' && row.account && row.account !== '-') {
        const key = row.account;
        accountCounts[key] = (accountCounts[key] || 0) + 1;
      }
    });

    // 3. Assign duplicate counts and sort
    return rows.map(row => ({
      ...row,
      duplicateCount: (row.status === 'success' && row.account) ? accountCounts[row.account] : 0
    })).sort((a, b) => {
      // Sort: 1. Status (Success first), 2. Timestamp ASC
      if (a.status === 'success' && b.status !== 'success') return -1;
      if (a.status !== 'success' && b.status === 'success') return 1;
      return a.timestamp - b.timestamp;
    });
  }, [jobs]);

  const successRows = displayRows.filter(r => r.status === 'success');
  const successCount = successRows.length;

  const handleDownloadCSV = () => {
    // 1. Prepare CSV Header
    const header = ['アカウント', '日時', '点数', '備考'];
    const csvRows = [header.join(',')];

    // 2. Build rows
    successRows.forEach(row => {
      // Format timestamp (YYYY/MM/DD HH:mm:ss)
      const timeStr = row.timestamp > 0 
        ? new Date(row.timestamp).toLocaleString('ja-JP', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        : '';
      
      // Escape double quotes by doubling them (" -> "") and wrap fields in quotes
      const account = `"${row.account.replace(/"/g, '""')}"`;
      const time = `"${timeStr}"`;
      const score = row.score;
      const note = (row.duplicateCount && row.duplicateCount > 1) ? `"${row.duplicateCount}回出た"` : "";

      csvRows.push(`${account},${time},${score},${note}`);
    });

    // 3. Create content with BOM for Excel compatibility (UTF-8 with BOM)
    const csvContent = csvRows.join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 4. Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '80万目指し隊_集計結果.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (jobs.length === 0) return null;

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <div className="text-slate-200">
          <span className="font-bold text-primary">{successCount}</span> 件のデータを抽出完了
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadCSV}
            disabled={successCount === 0}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all shadow-lg
              bg-green-600 hover:bg-green-700 text-white shadow-green-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSVをダウンロード
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700 shadow-xl max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-800 text-slate-200 uppercase font-semibold sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 w-16 bg-slate-800">No.</th>
              <th scope="col" className="px-6 py-3 bg-slate-800">画像</th>
              <th scope="col" className="px-6 py-3 bg-slate-800">アカウント</th>
              <th scope="col" className="px-6 py-3 bg-slate-800">日時 (昇順)</th>
              <th scope="col" className="px-6 py-3 text-right bg-slate-800">点数</th>
              <th scope="col" className="px-6 py-3 bg-slate-800">備考</th>
              <th scope="col" className="px-6 py-3 text-center bg-slate-800">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-900">
            {displayRows.map((row, index) => (
              <tr key={row.uniqueId} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {row.imageUrl && (
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-slate-800 overflow-hidden border border-slate-700 group relative">
                            <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                    )}
                    <span className="truncate max-w-[150px] text-xs" title={row.fileName}>
                      {row.fileName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-200">
                  {row.status === 'success' ? row.account : '-'}
                </td>
                <td className="px-6 py-4">
                  {row.status === 'success' ? formatTimestamp(row.timestamp) : '-'}
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-200">
                  {row.status === 'success' ? row.score.toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {row.duplicateCount && row.duplicateCount > 1 ? (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-yellow-900/40 text-yellow-200 border border-yellow-800">
                      {row.duplicateCount}回出た
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {row.status === 'pending' && <span className="inline-block px-2 py-1 rounded-full bg-slate-700 text-xs text-slate-300">待機中</span>}
                  {row.status === 'processing' && <span className="inline-block px-2 py-1 rounded-full bg-blue-900/50 text-xs text-blue-400 animate-pulse">解析中...</span>}
                  {row.status === 'success' && <span className="inline-block px-2 py-1 rounded-full bg-green-900/30 text-xs text-green-400">完了</span>}
                  {row.status === 'error' && <span className="inline-block px-2 py-1 rounded-full bg-red-900/30 text-xs text-red-400 cursor-help" title={row.errorMessage}>エラー</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;