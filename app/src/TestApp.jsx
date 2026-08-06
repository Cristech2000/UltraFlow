import React from 'react';

function TestApp() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#2563eb', fontSize: '48px' }}>UltraFlow</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>If you can see this, React is working!</p>
      <p style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
        Current URL: {window.location.href}
      </p>
    </div>
  );
}

export default TestApp;