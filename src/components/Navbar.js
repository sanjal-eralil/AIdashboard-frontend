import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="content-wrapper">
          <img 
            src="data:image/png;base64,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"
            alt="dCults Logo" 
            className="logo"
          />
          <div className="title-container">
            <h1 className="title">AI Dashboard</h1>
            <span className="tagline">Get Intelligent Visualisations</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: linear-gradient(120deg, #ffffff, #f8f9fa);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 20px 0;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .content-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .logo {
          width: 100px;
          height: 100px;
          transition: transform 0.4s ease;
        }

        .logo:hover {
          transform: scale(1.08);
        }

        .title-container {
          text-align: center;
        }

        .title {
          font-size: 48px;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
          letter-spacing: 1px;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .tagline {
          font-size: 20px;
          background: linear-gradient(120deg, #ff6b35, #ff8c66);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 500;
          margin-top: 8px;
          display: block;
          letter-spacing: 0.5px;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            flex-direction: column;
            gap: 16px;
          }

          .logo {
            width: 200px;
            height: 80px;
          }

          .title {
            font-size: 36px;
          }

          .tagline {
            font-size: 16px;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;