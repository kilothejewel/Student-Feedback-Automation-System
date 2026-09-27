import { useState } from 'react';
import StarRating from './StarRating';

// Where submissions go: .env value if set, otherwise the local n8n production webhook
const DEFAULT_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/student-feedback';

const COURSES = [
  'Full Stack Web Development',
  'Introduction to Test Automation & n8n',
  'Python for Data Science',
  'UI/UX Design Masterclass',
];

const MIN_MESSAGE_LENGTH = 10;

// The order fields appear in, used to focus the first one with an error
const FIELD_ORDER = ['studentName', 'email', 'courseName', 'rating', 'message'];

export default function FeedbackForm() {
  // 1. Form field values
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [courseName, setCourseName] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  // 2. UI state: validation errors, sending, result
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [submitted, setSubmitted] = useState(null); // details shown on the thank-you screen

  // 2b. Developer settings: webhook URL (saved in the browser)
  const [webhookUrl, setWebhookUrl] = useState(
    () => localStorage.getItem('n8n_webhook_url') || DEFAULT_WEBHOOK_URL
  );
  const [showSettings, setShowSettings] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(webhookUrl);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Update a field and clear its error as soon as the user starts fixing it
  const updateField = (setter, key) => (value) => {
    setter(value);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // 3. Client-side validation: returns the errors found (empty object = valid)
  const validateForm = () => {
    const newErrors = {};

    if (!studentName.trim()) {
      newErrors.studentName = 'Enter your full name.';
    } else if (studentName.trim().length < 2) {
      newErrors.studentName = 'Your name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email, like name@example.com.';
    }

    if (!courseName) {
      newErrors.courseName = 'Choose the course you took.';
    }

    if (rating === 0) {
      newErrors.rating = 'Choose a rating from 1 to 5.';
    }

    if (!message.trim()) {
      newErrors.message = 'Tell us a little about your experience.';
    } else if (message.trim().length < MIN_MESSAGE_LENGTH) {
      newErrors.message = `Add a bit more detail (at least ${MIN_MESSAGE_LENGTH} characters).`;
    }

    setErrors(newErrors);
    return newErrors;
  };

  // Move keyboard focus to the first field that needs fixing
  const focusFirstError = (foundErrors) => {
    const first = FIELD_ORDER.find((key) => foundErrors[key]);
    if (!first) return;
    const el =
      first === 'rating'
        ? document.querySelector('[role="radiogroup"] button[tabindex="0"]')
        : document.getElementById(first);
    el?.focus();
  };

  // 3b. Developer settings handlers
  const flashSaved = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const url = tempWebhookUrl.trim();
    localStorage.setItem('n8n_webhook_url', url);
    setWebhookUrl(url);
    flashSaved();
  };

  const handleResetSettings = () => {
    localStorage.removeItem('n8n_webhook_url');
    setWebhookUrl(DEFAULT_WEBHOOK_URL);
    setTempWebhookUrl(DEFAULT_WEBHOOK_URL);
    flashSaved();
  };

  // 4. Submit: validate, send to n8n, show the result
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('idle');
    setStatusMessage('');

    const foundErrors = validateForm();
    if (Object.keys(foundErrors).length > 0) {
      focusFirstError(foundErrors);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      studentName: studentName.trim(),
      email: email.trim(),
      courseName,
      rating,
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // 400 = the workflow rejected the data; anything else = server problem
        throw new Error(response.status === 400 ? 'validation' : `status ${response.status}`);
      }

      // Remember what was sent for the thank-you screen, then clear the form
      setSubmitted({
        firstName: payload.studentName.split(' ')[0],
        email: payload.email,
        courseName: payload.courseName,
      });
      setStudentName('');
      setEmail('');
      setCourseName('');
      setRating(0);
      setMessage('');
      setSubmitStatus('success');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setStatusMessage(
        error.message === 'validation'
          ? "Some of your answers didn't pass our checks. Please review them and try again."
          : "We couldn't send your feedback right now. Check your connection and try again in a moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers for the markup: invalid styling and linking inputs to their error text
  const fieldClass = (base, key) => `${base}${errors[key] ? ' is-invalid' : ''}`;
  const a11y = (key) => ({
    'aria-invalid': errors[key] ? 'true' : undefined,
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });
  const messageLength = message.trim().length;

  return (
    <>
      <div className="card">
        {submitStatus === 'success' && submitted ? (
          /* ---------- Thank-you screen ---------- */
          <div className="success" role="status">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h1 className="title">Thanks, {submitted.firstName}!</h1>
            <p className="subtitle">
              Your feedback on <strong>{submitted.courseName}</strong> has been recorded. A
              confirmation email is on its way to <strong>{submitted.email}</strong>.
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSubmitStatus('idle')}
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* ---------- Feedback form ---------- */
          <>
            <header className="header">
              <div className="eyebrow">
                <span className="eyebrow-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </span>
                Course feedback
              </div>
              <h1 className="title">How was your course?</h1>
              <p className="subtitle">
                It takes about a minute. Your answers go straight to the course team and help
                shape future classes.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate>
              {/* About you */}
              <fieldset className="section" disabled={isSubmitting}>
                <legend className="section-title">About you</legend>
                <div className="field-row">
                  <div className="field">
                    <label className="label" htmlFor="studentName">
                      Full name
                    </label>
                    <input
                      id="studentName"
                      type="text"
                      autoComplete="name"
                      className={fieldClass('input', 'studentName')}
                      placeholder="Jane Doe"
                      value={studentName}
                      onChange={(e) => updateField(setStudentName, 'studentName')(e.target.value)}
                      {...a11y('studentName')}
                    />
                    <FieldError id="studentName-error" message={errors.studentName} />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="email">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      className={fieldClass('input', 'email')}
                      placeholder="jane.doe@example.com"
                      value={email}
                      onChange={(e) => updateField(setEmail, 'email')(e.target.value)}
                      {...a11y('email')}
                    />
                    <FieldError id="email-error" message={errors.email} />
                  </div>
                </div>
              </fieldset>

              {/* Your course */}
              <fieldset className="section" disabled={isSubmitting}>
                <legend className="section-title">Your course</legend>

                <div className="field">
                  <label className="label" htmlFor="courseName">
                    Course
                  </label>
                  <select
                    id="courseName"
                    className={`${fieldClass('select', 'courseName')}${courseName ? '' : ' is-placeholder'}`}
                    value={courseName}
                    onChange={(e) => updateField(setCourseName, 'courseName')(e.target.value)}
                    {...a11y('courseName')}
                  >
                    <option value="" disabled>
                      Select the course you took
                    </option>
                    {COURSES.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                  <FieldError id="courseName-error" message={errors.courseName} />
                </div>

                <StarRating
                  rating={rating}
                  onRatingChange={updateField(setRating, 'rating')}
                  error={errors.rating}
                  disabled={isSubmitting}
                />

                <div className="field">
                  <label className="label" htmlFor="message">
                    Your feedback
                  </label>
                  <textarea
                    id="message"
                    className={fieldClass('textarea', 'message')}
                    rows="5"
                    placeholder="What worked well? What could be better?"
                    value={message}
                    onChange={(e) => updateField(setMessage, 'message')(e.target.value)}
                    {...a11y('message')}
                  />
                  <div className="field-meta">
                    {errors.message ? (
                      <FieldError id="message-error" message={errors.message} />
                    ) : (
                      <span>At least {MIN_MESSAGE_LENGTH} characters</span>
                    )}
                    <span
                      className={`counter ${messageLength >= MIN_MESSAGE_LENGTH ? 'is-met' : ''}`}
                    >
                      {messageLength} characters
                    </span>
                  </div>
                </div>
              </fieldset>

              {/* Server / network error, shown right above the button the user just pressed */}
              {submitStatus === 'error' && (
                <div className="alert alert-error" role="alert">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 1.667a8.333 8.333 0 100 16.666 8.333 8.333 0 000-16.666zm0 12.5a.833.833 0 110-1.667.833.833 0 010 1.667zm.833-3.334a.833.833 0 01-1.666 0V5.833a.833.833 0 011.666 0v5z" />
                  </svg>
                  <p>{statusMessage}</p>
                </div>
              )}

              <div className="actions">
                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    'Submit feedback'
                  )}
                </button>
                <p className="form-note">
                  All fields are required. We only use your email to send you a confirmation.
                </p>
              </div>
            </form>
          </>
        )}
      </div>

      {/* ---------- Developer settings (kept out of the student's way) ---------- */}
      <button
        type="button"
        className="dev-toggle"
        onClick={() => setShowSettings(!showSettings)}
        aria-expanded={showSettings}
        aria-controls="dev-panel"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.47.47 0 00-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.74 8.87a.47.47 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z" />
        </svg>
        Webhook settings
      </button>

      {showSettings && (
        <div className="dev-panel" id="dev-panel">
          <h2>Developer settings</h2>
          <p>Where submissions are sent. Saved in this browser only.</p>
          <form onSubmit={handleSaveSettings}>
            <div className="field">
              <label className="label" htmlFor="webhookUrlInput">
                n8n webhook URL
              </label>
              <input
                id="webhookUrlInput"
                type="url"
                className="input"
                value={tempWebhookUrl}
                onChange={(e) => setTempWebhookUrl(e.target.value)}
                placeholder="http://localhost:5678/webhook/student-feedback"
                required
              />
            </div>
            <div className="dev-actions">
              <button type="submit" className="button button-primary">
                Save
              </button>
              <button type="button" className="button button-secondary" onClick={handleResetSettings}>
                Reset to default
              </button>
            </div>
          </form>
          {settingsSaved && (
            <p className="dev-saved" role="status">
              Saved. New submissions will use this URL.
            </p>
          )}
        </div>
      )}
    </>
  );
}

// Red error line under a field, linked to its input by id for screen readers
function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span className="error-text" id={id}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 1.667a8.333 8.333 0 100 16.666 8.333 8.333 0 000-16.666zm0 12.5a.833.833 0 110-1.667.833.833 0 010 1.667zm.833-3.334a.833.833 0 01-1.666 0V5.833a.833.833 0 011.666 0v5z" />
      </svg>
      {message}
    </span>
  );
}
