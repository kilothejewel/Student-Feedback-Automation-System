import React, { useState } from 'react';

/**
 * StarRating component handles the interactive 1-5 rating input.
 * It tracks hover state locally to show a glowing yellow effect,
 * and passes the finalized selection back up to the parent form.
 */
export default function StarRating({ rating, onRatingChange, error }) {
  // hoveredRating represents the star the mouse is currently pointing at
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="form-group">
      <label className="form-label">
        <span>Course Rating *</span>
        {rating > 0 && (
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
            {rating} / 5
          </span>
        )}
      </label>
      
      <div className="rating-stars-container">
        {[1, 2, 3, 4, 5].map((star) => {
          // A star should be active (lit up) if its value is <= the current hovered value OR the selected rating
          const isActive = star <= (hoveredRating || rating);
          const isHovered = hoveredRating > 0 && star <= hoveredRating;

          return (
            <button
              key={star}
              type="button"
              className="star-button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              aria-label={`Rate ${star} stars out of 5`}
            >
              <svg
                className={`star-icon ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          );
        })}
      </div>
      
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
