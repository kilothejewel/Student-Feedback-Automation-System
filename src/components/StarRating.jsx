import { useState } from 'react';

// What each star means, shown next to the stars so the scale is unambiguous
const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * StarRating: an accessible 1-5 rating input.
 * - The parent form owns the chosen `rating`; this component only tracks hover.
 * - Behaves like a radio group: Tab focuses it, Left/Right arrow keys change the value.
 */
export default function StarRating({ rating, onRatingChange, error, disabled }) {
  // The star the mouse is over (0 = none), used for the hover preview
  const [hoveredRating, setHoveredRating] = useState(0);

  // Hover preview wins; otherwise show the chosen rating
  const shownRating = hoveredRating || rating;

  // Arrow keys move the rating up or down (within 1-5) and move focus with it
  const handleKeyDown = (e) => {
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, rating + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, rating - 1);
    if (next === null) return;

    e.preventDefault();
    onRatingChange(next);
    e.currentTarget.querySelectorAll('button')[next - 1].focus();
  };

  return (
    <div className="field">
      <span className="label" id="rating-label">
        Overall rating
      </span>

      <div className="rating">
        <div
          className="stars"
          role="radiogroup"
          aria-labelledby="rating-label"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'rating-error' : undefined}
          onKeyDown={handleKeyDown}
          onMouseLeave={() => setHoveredRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} out of 5, ${RATING_LABELS[star - 1]}`}
              // Only one star is in the Tab order (roving tabindex), like a native radio group
              tabIndex={rating === star || (rating === 0 && star === 1) ? 0 : -1}
              className="star-button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => setHoveredRating(star)}
              disabled={disabled}
            >
              <svg
                className={`star-icon ${star <= shownRating ? 'is-active' : ''}`}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2.75l2.84 5.76 6.36.92-4.6 4.49 1.08 6.33L12 17.26l-5.68 2.99 1.08-6.33-4.6-4.49 6.36-.92L12 2.75z" />
              </svg>
            </button>
          ))}
        </div>

        {/* Plain-language meaning of the current (or hovered) rating */}
        <span className="rating-caption" aria-live="polite">
          {shownRating > 0 ? (
            <>
              <strong>{RATING_LABELS[shownRating - 1]}</strong> · {shownRating}/5
            </>
          ) : (
            'Select a rating'
          )}
        </span>
      </div>

      {error && (
        <span className="error-text" id="rating-error">
          <ErrorIcon />
          {error}
        </span>
      )}
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.667a8.333 8.333 0 100 16.666 8.333 8.333 0 000-16.666zm0 12.5a.833.833 0 110-1.667.833.833 0 010 1.667zm.833-3.334a.833.833 0 01-1.666 0V5.833a.833.833 0 011.666 0v5z" />
    </svg>
  );
}
