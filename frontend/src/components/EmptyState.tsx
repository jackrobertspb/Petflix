import { Link } from 'react-router-dom';
import { memo } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState = memo(({ icon, title, description, actionText, actionLink, onAction }: EmptyStateProps) => {
  return (
    <div className="text-center py-20 bg-petflix-dark-gray rounded-lg p-12 max-w-2xl mx-auto">
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
      <p className="text-gray-400 text-lg mb-8">{description}</p>
      
      {actionText && (actionLink || onAction) && (
        <>
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-block px-8 py-3 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded transition"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-block px-8 py-3 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded transition"
            >
              {actionText}
            </button>
          )}
        </>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

