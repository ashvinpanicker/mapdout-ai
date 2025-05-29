import React, { useState } from 'react';

const ContactForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    const formData = {
      name,
      email,
      message,
    };

    try {
      const response = await fetch('/api/submit-form-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setLoading(false);

      if (response.ok) {
        const result = await response.json();
        setFeedback({ type: 'success', message: result.message || 'Form submitted successfully!' });
        setName('');
        setEmail('');
        setMessage('');
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        setFeedback({ type: 'error', message: `Error: ${response.status} ${errorResult.message || response.statusText}` });
      }
    } catch (error) {
      setLoading(false);
      setFeedback({ type: 'error', message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="message" style={{ display: 'block', marginBottom: '5px' }}>Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {feedback && (
        <div style={{ marginTop: '20px', padding: '10px', borderRadius: '4px', backgroundColor: feedback.type === 'success' ? '#d4edda' : '#f8d7da', color: feedback.type === 'success' ? '#155724' : '#721c24' }}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default ContactForm;