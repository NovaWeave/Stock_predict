'use client';

import { Building2, Globe, MapPin, Users, TrendingUp } from 'lucide-react';

import type { AnalysisData } from '@/app/page';

interface CompanyProfileProps {
  data: AnalysisData;
}

export default function CompanyProfile({ data }: CompanyProfileProps) {
  const profileWrapper = data.company_profile;

  if (!profileWrapper || !profileWrapper.success) {
    return (
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Company Profile</h3>
          <p className="text-slate-400">Company profile data not available</p>
        </div>
      </div>
    );
  }

  const profile = profileWrapper.data || {};

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Building2 className="w-8 h-8 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">Company Profile</h3>
      </div>

      <div className="space-y-6">
        {/* Company Name and Basic Info */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
          <h4 className="text-xl font-semibold text-white mb-4">{profile.name || 'N/A'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-400">Website</div>
                <div className="text-white">
                  {profile.website ? (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {profile.website}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-400">Country</div>
                <div className="text-white">{profile.country || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Industry and Exchange */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h5 className="text-lg font-semibold text-white">Industry</h5>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{profile.industry || 'N/A'}</div>
            <div className="text-sm text-slate-400">Primary business sector</div>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-purple-400" />
              <h5 className="text-lg font-semibold text-white">Exchange</h5>
            </div>
            <div className="text-2xl font-bold text-white mb-2">
              {profile.exchange || 'N/A'}
            </div>
            <div className="text-sm text-slate-400">Trading platform</div>
          </div>
        </div>

        {/* Additional Details */}
        {profile.ipo && (
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
            <h5 className="text-lg font-semibold text-white mb-4">IPO Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">IPO Date</div>
                <div className="text-white font-semibold">
                  {profile.ipo ? new Date(profile.ipo).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Market Cap</div>
                <div className="text-white font-semibold">
                  {profile.market_cap ? `$${(profile.market_cap / 1000000000).toFixed(2)}B` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Description */}
        {profile.company_description && (
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
            <h5 className="text-lg font-semibold text-white mb-4">About</h5>
            <p className="text-slate-300 leading-relaxed">
              {profile.company_description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
