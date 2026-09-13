import React from 'react';
import { Info } from 'lucide-react';

export const DemoOtpNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-xs text-slate-800 flex items-start space-x-2.5 my-3">
      <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5 text-left">
        <div className="font-bold text-amber-950 text-xs sm:text-sm">Demo Mode</div>
        <div className="text-slate-700 text-xs sm:text-sm font-medium leading-snug">
          Use OTP <span className="gov-id text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">123456</span> to continue.
        </div>
      </div>
    </div>
  );
};
