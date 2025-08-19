'use client';

import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

import type { AnalysisData } from '@/app/page';

interface SocialFeedProps {
  data: AnalysisData;
}

export default function SocialFeed({ data }: SocialFeedProps) {
  const redditWrapper = data.reddit_posts;
  const xWrapper = data.x_posts;

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-400';
    if (score < -0.1) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <ThumbsUp className="w-4 h-4 text-green-400" />;
    if (score < -0.1) return <ThumbsDown className="w-4 h-4 text-red-400" />;
    return <span className="w-4 h-4 text-yellow-400">○</span>;
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <MessageSquare className="w-8 h-8 text-purple-400" />
        <h3 className="text-2xl font-bold text-white">Social Media Feed</h3>
      </div>

      <div className="space-y-6">
        {/* Reddit Posts */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span>Reddit Discussions</span>
          </h4>
          <div className="space-y-4">
            {Array.isArray(redditWrapper) && redditWrapper.length > 0 ? (
              redditWrapper.slice(0, 3).map((post, index: number) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(post.sentiment || 0)}
                      <span className={`text-sm font-medium ${getSentimentColor(post.sentiment || 0)}`}>
                        {(((post.sentiment || 0) as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">r/{post.subreddit}</span>
                  </div>
                  <h5 className="text-white font-medium mb-2 line-clamp-2">{post.title}</h5>
                  <p className="text-slate-300 text-sm mb-3 line-clamp-3">{post.text}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>by u/{post.author}</span>
                    <span>{post.score} points</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p>No Reddit posts available</p>
              </div>
            )}
          </div>
        </div>

        {/* X (Twitter) Posts */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>X (Twitter) Posts</span>
          </h4>
          <div className="space-y-4">
            {Array.isArray(xWrapper) && xWrapper.length > 0 ? (
              xWrapper.slice(0, 3).map((post, index: number) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(post.sentiment || 0)}
                      <span className={`text-sm font-medium ${getSentimentColor(post.sentiment || 0)}`}>
                        {(((post.sentiment || 0) as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">@{post.author || 'user'}</span>
                  </div>
                  <p className="text-white text-sm mb-3">{post.text}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{post.like_count || 0} likes</span>
                    <span>{post.retweet_count || 0} retweets</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p>No X posts available</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{Array.isArray(redditWrapper) ? redditWrapper.length : 0}</div>
              <div className="text-sm text-slate-400">Reddit Posts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{Array.isArray(xWrapper) ? xWrapper.length : 0}</div>
              <div className="text-sm text-slate-400">X Posts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
