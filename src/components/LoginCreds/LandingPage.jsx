import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

import dashboardPreview from '../../assets/Screenshot 2026-06-11 225600.png';
import secondPreview from '../../assets/Screenshot 2026-06-18 134537.png';
import reportPreview from '../../assets/cropped report.png';

export default function LandingPage() {
  const navigate = useNavigate();

  // Hook for scrolling animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.1 }
    );

    const hiddenElements = document.querySelectorAll('.hidden-animate');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-icon">E</span>
          <span className="logo-text">E-Tracker</span>
        </div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#blog">Blog</a></li>
        </ul>
        <div className="nav-actions">
          <span className="pro-badge">E-Tracker Pro</span>
          <button className="btn-signup" onClick={() => navigate('/login')}>
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content hidden-animate fade-left">
          <h1 className="hero-title">
            SIMPLIFY YOUR<br />SPENDING<br />EFFORTLESSLY.
          </h1>
          <p className="hero-subtitle">
            E-Tracker streamlines expense tracking<br />for professionals and teams.
          </p>
          <button className="btn-get-started" onClick={() => navigate('/login')}>
            GET STARTED FOR FREE <span className="icon-e">E</span>
          </button>
        </div>

        {/* Right Side: Floating Browser Mockup */}
        <div className="hero-visual hidden-animate fade-right">
          <div className="browser-mockup">
            <div className="browser-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>

            <div className="mockup-image-container">
              <img src={secondPreview} alt="Dashboard Preview" className="responsive-img" />
              <div className="mockup-subcontainer">
                <img src={dashboardPreview} alt="Dashboard Detail" className="responsive-img" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="feature-card hidden-animate fade-up" style={{ transitionDelay: '100ms' }}>
          <div className="feature-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/3209/3209265.png" alt="Receipt" width="64" />
          </div>
          <h3>SMART RECEIPT SCANNING</h3>
          <p>Smart receipt scanning for seamless expense records.</p>
        </div>
        <div className="feature-card hidden-animate fade-up" style={{ transitionDelay: '200ms' }}>
          <div className="feature-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/4021/4021708.png" alt="Bank" width="64" />
          </div>
          <h3>SECURE BANK LINKING</h3>
          <p>Custom designed cards and secured bank links.</p>
        </div>
        <div className="feature-card hidden-animate fade-up" style={{ transitionDelay: '300ms' }}>
          <div className="feature-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Analytics" width="64" />
          </div>
          <h3>IN-DEPTH ANALYTICS</h3>
          <p>Analytics complexity handled with clear data visuals.</p>
        </div>
      </section>

      {/* Bottom Interface Preview & Testimonials */}
      <section className="bottom-preview-section hidden-animate fade-up">
        <div className="tablet-mockup">
          <div className="report-container">
            <img src={reportPreview} alt="Report Preview" className="responsive-img" />
          </div>
        </div>

        <div className="testimonials-overlay">
          <div className="testimonial-card hidden-animate fade-right" style={{ transitionDelay: '200ms' }}>
            <img src="https://i.pravatar.cc/150?img=11" alt="User" className="user-avatar" />
            <div className="test-text">
              <h4>Professional Marketers</h4>
              <p>"Professional Marketers are connected to marketing ROI, tracking costs with real-time teams."</p>
            </div>
          </div>

          <div className="testimonial-card hidden-animate fade-left" style={{ transitionDelay: '400ms' }}>
            <img src="https://i.pravatar.cc/150?img=12" alt="User" className="user-avatar" />
            <div className="test-text">
              <h4>Freelance Designers</h4>
              <p>"Freelance Designers find ease with tracking online and maintaining outstanding attendance for clients."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <span className="footer-logo">E</span>
          <p><b>E-Tracker - Expense Tracker App</b><br />© copyright Co., Inc. All rights reserved.</p>
        </div>
        <div className="footer-socials">
          <span>𝕏</span>
          <span>in</span>
          <span>IG</span>
        </div>
      </footer>
    </div>
  );
}