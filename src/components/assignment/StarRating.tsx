import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0-5 with 0.5 increments
  onRatingChange?: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  disabled = false,
  size = 'md'
}) => {
  const stars = [1, 2, 3, 4, 5];

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (disabled || !onRatingChange) return;

    const newRating = isHalf ? starIndex - 0.5 : starIndex;
    onRatingChange(newRating);
  };

  const getStarFill = (starIndex: number) => {
    if (rating >= starIndex) {
      return 'full';
    } else if (rating >= starIndex - 0.5) {
      return 'half';
    }
    return 'empty';
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((starIndex) => {
        const fill = getStarFill(starIndex);

        return (
          <div
            key={starIndex}
            className={`relative ${disabled ? '' : 'cursor-pointer'}`}
            onClick={(e) => {
              if (disabled || !onRatingChange) return;

              // Detect if clicked on left or right half
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const isLeftHalf = clickX < rect.width / 2;

              handleStarClick(starIndex, isLeftHalf);
            }}
          >
            {/* Background (empty star) */}
            <Star
              className={`${sizeClasses[size]} ${
                disabled
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400'
              }`}
            />

            {/* Foreground (filled star) */}
            {fill !== 'empty' && (
              <div
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: fill === 'half' ? '50%' : '100%' }}
              >
                <Star
                  className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`}
                />
              </div>
            )}
          </div>
        );
      })}
      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {rating > 0 ? rating.toFixed(1) : '0.0'}
      </span>
    </div>
  );
};
