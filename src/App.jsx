import React from 'react';
import FeedbackForm from './components/FeedbackForm';

export default function App() {
  return (
    <div className="feedback-container">
      {/* Decorative background glows for deep visual aesthetics */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      {/* Render the Feedback Form Component */}
      <FeedbackForm />
    </div>
  );
}
