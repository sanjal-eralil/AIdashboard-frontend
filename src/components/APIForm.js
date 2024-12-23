import React, { useState } from 'react';

const APIForm = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      display: 'block',
      fontSize: '1.5rem',
      fontWeight: 1000,
      color: '#374151',
      marginBottom: '0.5rem'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical'
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    },
    error: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      padding: '12px',
      borderRadius: '4px',
      marginTop: '15px'
    },
    resultContainer: {
      marginTop: '20px'
    },
    resultTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#1a1a1a'
    },
    resultContent: {
      backgroundColor: '#f5f5f5',
      padding: '15px',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontFamily: 'monospace',
      fontSize: '14px'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      
      const response = await fetch('https://394e-4-227-155-222.ngrok-free.app/chat/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to fetch response: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="prompt" style={styles.label}>
            Enter your prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={styles.textarea}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {result && (
        <div style={styles.resultContainer}>
          <h2 style={styles.resultTitle}>Response:</h2>
          <pre style={styles.resultContent}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default APIForm;