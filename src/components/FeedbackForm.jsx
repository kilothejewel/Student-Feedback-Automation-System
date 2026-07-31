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

    // Grab the webhook URL from environment variables
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

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
      <div className="feedback-header">
        <h1 className="feedback-title">Share Your Experience</h1>
        <p className="feedback-subtitle">
          Your feedback goes directly into our automated pipeline to help us improve our courses.
        </p>
      </div>

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
