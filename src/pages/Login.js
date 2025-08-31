import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import Button from '../components/Button';
import Card from '../components/Card';
import { FiMail, FiLock, FiEye, FiEyeOff, FiGithub } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, error, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <motion.div
          className="login-background-shapes"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <motion.div
        className="login-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="login-header">
          <motion.div
            className="login-logo"
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="logo-icon">⚖️</div>
          </motion.div>
          <h1 className="login-title">SimplyLegal</h1>
          <p className="login-subtitle">
            AI-powered legal document analysis and risk assessment
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="login-card" elevation="large">
            <div className="login-card-header">
              <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
              <p>
                {isSignUp 
                  ? 'Start analyzing your legal documents' 
                  : 'Welcome back to your legal workspace'
                }
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
                fullWidth
                className="login-submit-btn"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="login-divider">
              <span>or</span>
            </div>

            <Button
              variant="outline"
              size="large"
              onClick={handleGoogleSignIn}
              loading={loading}
              fullWidth
              className="google-signin-btn"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              Continue with Google
            </Button>

            <div className="login-footer">
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  className="toggle-auth-mode"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="login-features">
          <div className="feature">
            <div className="feature-icon">📄</div>
            <h3>Document Upload</h3>
            <p>Upload PDFs and images for instant analysis</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>Get plain-English summaries and risk assessments</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Smart Insights</h3>
            <p>Actionable checklists and Q&A with citations</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 