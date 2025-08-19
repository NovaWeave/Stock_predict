'use client';

import { Newspaper, ExternalLink, Calendar } from 'lucide-react';

import type { AnalysisData } from '@/app/page';

interface NewsSectionProps {
  data: AnalysisData;
}

export default function NewsSection({ data }: NewsSectionProps) {
  const newsWrapper = data.news;

  if (!newsWrapper || !newsWrapper.success || !newsWrapper.data || newsWrapper.data.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
        <div className="text-center">
          <Newspaper className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Company News</h3>
          <p className="text-slate-400">No recent news available</p>
        </div>
      </div>
    );
  }

  const news = newsWrapper.data.slice(0, 5);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Newspaper className="w-8 h-8 text-green-400" />
        <h3 className="text-2xl font-bold text-white">Latest News</h3>
      </div>

      <div className="space-y-4">
        {news.map((item: NonNullable<AnalysisData['news']['data']>[number], index: number) => (
          <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium line-clamp-2 flex-1 mr-4">
                {item.headline}
              </h4>
              <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
            
            {item.summary && (
              <p className="text-slate-300 text-sm mb-3 line-clamp-3">
                {item.summary}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.datetime)}</span>
              </div>
              <span className="bg-slate-600 px-2 py-1 rounded text-xs">
                {item.source}
              </span>
            </div>
            
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Read full article →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* News Summary */}
      <div className="mt-6 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">
            {newsWrapper.data.length}
          </div>
          <div className="text-sm text-slate-400">Total news articles</div>
          <div className="text-xs text-slate-500 mt-1">
            Last updated: {newsWrapper.data.length > 0 ? formatDate(newsWrapper.data[0].datetime) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
