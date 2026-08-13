import React, { useState } from 'react';
import StarRating from './StarRating';

export default function FeedbackForm() {
  // 1. Core State Variables for Form Fields
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [courseName, setCourseName] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  // 2. UI State for Validation Errors, Submission, and Alerts
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  // 2b. Webhook Settings State
  const [webhookUrl, setWebhookUrl] = useState(() => {
    const savedUrl = localStorage.getItem('n8n_webhook_url');
    return savedUrl || import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/test-webhook-url';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(webhookUrl);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // 3. Client-Side Validation Logic
  const validateForm = () => {
    const newErrors = {};

    if (!studentName.trim()) {
      newErrors.studentName = 'Student name is required.';
    } else if (studentName.trim().length < 2) {
      newErrors.studentName = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!courseName) {
      newErrors.courseName = 'Please select a course.';
    }

    if (rating === 0) {
      newErrors.rating = 'Please choose a rating.';
    }

    if (!message.trim()) {
      newErrors.message = 'Feedback message is required.';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Please provide a more detailed message (minimum 10 characters).';
    }

    setErrors(newErrors);
    // Form is valid if the errors object has no keys
    return Object.keys(newErrors).length === 0;
  };

  // 3b. Webhook settings save handler
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('n8n_webhook_url', tempWebhookUrl.trim());
    setWebhookUrl(tempWebhookUrl.trim());
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const handleResetSettings = () => {
    const defaultUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/test-webhook-url';
    localStorage.removeItem('n8n_webhook_url');
    setWebhookUrl(defaultUrl);
    setTempWebhookUrl(defaultUrl);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  // 4. Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('idle');
    setStatusMessage('');

    // Trigger validation; abort if invalid
    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      studentName: studentName.trim(),
      email: email.trim(),
      courseName,
      rating,
      message: message.trim(),
      submittedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setStatusMessage('Thank you! Your feedback has been successfully processed and recorded.');
        
        // Reset form inputs upon successful submission
        setStudentName('');
        setEmail('');
        setCourseName('');
        setRating(0);
        setMessage('');
      } else {
        throw new Error(`Server returned code ${response.status}`);
      }
    } catch (error) {
      setSubmitStatus('error');
      setStatusMessage('Oops! We couldn\'t reach the automation server. Please ensure your webhook is online or try again later.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-card">
      <div className="feedback-header" style={{ position: 'relative' }}>
        <button
          type="button"
          className="settings-toggle-btn"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Toggle Webhook Settings"
          title="Configure Webhook Destination"
        >
          <svg viewBox="0 0 24 24" className={`settings-cog-icon ${showSettings ? 'is-active' : ''}`}>
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
        <h1 className="feedback-title">Share Your Experience</h1>
        <p className="feedback-subtitle">
          Your feedback goes directly into our automated pipeline to help us improve our courses.
        </p>
      </div>

      {/* Dynamic Webhook Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3 className="settings-panel-title">Developer Settings</h3>
          <p className="settings-panel-subtitle">
            Configure the destination webhook URL for testing. This setting is persisted locally in your browser.
          </p>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="webhookUrlInput">
                <span>n8n Webhook URL</span>
              </label>
              <input
                id="webhookUrlInput"
                type="url"
                className="form-input settings-input"
                value={tempWebhookUrl}
                onChange={(e) => setTempWebhookUrl(e.target.value)}
                placeholder="http://localhost:5678/webhook/..."
                required
              />
            </div>
            
            <div className="settings-actions">
              <button type="submit" className="settings-btn save-btn">
                Save Webhook
              </button>
              <button type="button" className="settings-btn reset-btn" onClick={handleResetSettings}>
                Reset to Default
              </button>
            </div>
          </form>

          {settingsSuccess && (
            <div className="settings-success-alert">
              ✓ Settings saved successfully!
            </div>
          )}
        </div>
      )}

      {/* Submission status alerts */}
      {submitStatus === 'success' && (
        <div className="alert alert-success">
          ✨ {statusMessage}
        </div>
      )}
      {submitStatus === 'error' && (
        <div className="alert alert-error">
          ⚠️ {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Student Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="studentName">
            Full Name *
          </label>
          <input
            id="studentName"
            type="text"
            className={`form-input ${errors.studentName ? 'is-invalid' : ''}`}
            placeholder="Jane Doe"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.studentName && <span className="error-text">{errors.studentName}</span>}
        </div>

        {/* Email Address */}
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'is-invalid' : ''}`}
            placeholder="jane.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {/* Course Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="courseName">
            Course Name *
          </label>
          <select
            id="courseName"
            className={`form-input ${errors.courseName ? 'is-invalid' : ''}`}
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            disabled={isSubmitting}
            style={{ appearance: 'none', backgroundPosition: 'right 1rem center' }}
          >
            <option value="" disabled>-- Select your enrolled course --</option>
            <option value="Full Stack Web Development">Full Stack Web Development</option>
            <option value="Introduction to Test Automation & n8n">Introduction to Test Automation & n8n</option>
            <option value="Python for Data Science">Python for Data Science</option>
            <option value="UI/UX Design Masterclass">UI/UX Design Masterclass</option>
          </select>
          {errors.courseName && <span className="error-text">{errors.courseName}</span>}
        </div>

        {/* Interactive Star Rating */}
        <StarRating
          rating={rating}
          onRatingChange={(newRating) => setRating(newRating)}
          error={errors.rating}
        />

        {/* Feedback Message */}
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="message">
            Feedback Message *
          </label>
          <textarea
            id="message"
            className={`form-textarea ${errors.message ? 'is-invalid' : ''}`}
            rows="4"
            placeholder="Please write your review here (min 10 characters)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.message && <span className="error-text">{errors.message}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending to Workflow...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
