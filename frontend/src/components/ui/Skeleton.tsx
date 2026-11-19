import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-midnight-800/70 via-slate-800/50 to-midnight-800/70 rounded-lg ${className}`}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-3.5 ${
            idx === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br from-midnight-900/80 to-midnight-950/90 border border-slate-800/80 space-y-4 shadow-card-surface ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-3 p-4 bg-gradient-to-br from-midnight-900/80 to-midnight-950/90 rounded-2xl border border-slate-800/80 shadow-card-surface ${className}`}>
      <div className="flex space-x-4 pb-2 border-b border-slate-800/80">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 py-2 border-b border-slate-800/40">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: string; className?: string }> = ({
  height = 'h-64',
  className = '',
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br from-midnight-900/80 to-midnight-950/90 border border-slate-800/80 flex flex-col justify-between ${height} ${className} shadow-card-surface`}
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex-1 flex items-end space-x-3 px-4 pb-2">
        <Skeleton className="h-1/3 flex-1 rounded-t" />
        <Skeleton className="h-2/3 flex-1 rounded-t" />
        <Skeleton className="h-1/2 flex-1 rounded-t" />
        <Skeleton className="h-4/5 flex-1 rounded-t" />
        <Skeleton className="h-3/5 flex-1 rounded-t" />
        <Skeleton className="h-full flex-1 rounded-t" />
      </div>
      <div className="flex justify-between pt-3 border-t border-slate-800/80">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
};
