import React from 'react';

const Landing = () => {
  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px' }}>Welcome to KLN Superapp</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        This is the centralized internal application for integrating report management across KOL, Ads, and E-commerce.
        Please use the sidebar to navigate to your authorized modules.
      </p>
    </div>
  );
};

export default Landing;
