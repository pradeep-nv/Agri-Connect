import React, { useRef, useState, useEffect } from 'react';
import './Authentication.scss';
import { useNavigate } from 'react-router-dom';
import newRequest from '../../utils/newRequest';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Material Icons
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import SparklesIcon from '@mui/icons-material/AutoAwesomeOutlined';
import logo from '../../assets/logo.png';

const Authentication = ({ setUserRole }) => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [role, setRole] = useState('farmer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await newRequest.get('/api/auth/validate-token', {
          withCredentials: true
        });
        if (response.data && response.data.role) {
          toast.success(response.data.message);
          setUserRole(response.data.role);
          navigate(response.data.role === 'farmer' ? '/farmer_home' : '/expert_home');
        }
      } catch (error) {
        // Proceed to login/signup
      }
    };
    checkToken();
  }, [setUserRole, navigate]);

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    if (containerRef.current) {
      containerRef.current.classList.toggle('active');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await newRequest.post('/api/auth/signup', {
        name,
        email,
        password,
        role,
      }, { withCredentials: true });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      toast.success(response.data.message || "Registration successful!");
      setUserRole(role);
      navigate(role === 'farmer' ? '/farmer_home' : '/expert_home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await newRequest.post('/api/auth/signin', {
        email,
        password,
        role,
      }, { withCredentials: true });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      toast.success(response.data.message || "Welcome back!");
      setUserRole(role);
      navigate(role === 'farmer' ? '/farmer_home' : '/expert_home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPageWrapper">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar draggable />
      
      {/* Background Animated Floating Blobs */}
      <div className="bgBlob blob1"></div>
      <div className="bgBlob blob2"></div>

      <div ref={containerRef} className={`authContainer ${isSignUpMode ? 'active' : ''}`}>
        
        {/* Left Side: Form Section */}
        <div className="formSection">
          
          {/* Sign Up Form */}
          <div className="formBox sign-up-form">
            <div className="brandBadge">
              <img src={logo} alt="AgriConnect" className="brandLogo" />
              <span className="brandName">AgriConnect</span>
            </div>
            <h2>Create Account</h2>
            <p className="subtitle">Join thousands of smart farmers and agronomists</p>

            <form onSubmit={handleSignup}>
              {/* Role Switcher Pills */}
              <div className="roleSelector">
                <button
                  type="button"
                  className={`roleTab ${role === 'farmer' ? 'selected' : ''}`}
                  onClick={() => setRole('farmer')}
                >
                  <AgricultureOutlinedIcon className="roleIcon" />
                  <span>Farmer</span>
                </button>
                <button
                  type="button"
                  className={`roleTab ${role === 'expert' ? 'selected' : ''}`}
                  onClick={() => setRole('expert')}
                >
                  <PsychologyOutlinedIcon className="roleIcon" />
                  <span>Agri Expert</span>
                </button>
              </div>

              <div className="inputGroup">
                <PersonOutlineIcon className="inputIcon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="inputGroup">
                <EmailOutlinedIcon className="inputIcon" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="inputGroup">
                <LockOutlinedIcon className="inputIcon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eyeBtn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </button>
              </div>

              <button type="submit" className="submitBtn" disabled={loading}>
                <span>{loading ? "Registering..." : "Create Account"}</span>
                <ArrowForwardOutlinedIcon className="btnArrow" />
              </button>
            </form>

            <div className="mobileToggle">
              <span>Already registered? </span>
              <button type="button" onClick={toggleMode} className="inlineLink">Sign In</button>
            </div>
          </div>

          {/* Sign In Form */}
          <div className="formBox sign-in-form">
            <div className="brandBadge">
              <img src={logo} alt="AgriConnect" className="brandLogo" />
              <span className="brandName">AgriConnect</span>
            </div>
            <h2>Welcome Back!</h2>
            <p className="subtitle">Sign in to access your farm telemetry & expert advice</p>

            <form onSubmit={handleSignin}>
              {/* Role Switcher Pills */}
              <div className="roleSelector">
                <button
                  type="button"
                  className={`roleTab ${role === 'farmer' ? 'selected' : ''}`}
                  onClick={() => setRole('farmer')}
                >
                  <AgricultureOutlinedIcon className="roleIcon" />
                  <span>Farmer</span>
                </button>
                <button
                  type="button"
                  className={`roleTab ${role === 'expert' ? 'selected' : ''}`}
                  onClick={() => setRole('expert')}
                >
                  <PsychologyOutlinedIcon className="roleIcon" />
                  <span>Agri Expert</span>
                </button>
              </div>

              <div className="inputGroup">
                <EmailOutlinedIcon className="inputIcon" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="inputGroup">
                <LockOutlinedIcon className="inputIcon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eyeBtn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </button>
              </div>

              <button type="submit" className="submitBtn" disabled={loading}>
                <span>{loading ? "Signing In..." : "Sign In"}</span>
                <ArrowForwardOutlinedIcon className="btnArrow" />
              </button>
            </form>

            <div className="mobileToggle">
              <span>Need an account? </span>
              <button type="button" onClick={toggleMode} className="inlineLink">Sign Up</button>
            </div>
          </div>

        </div>

        {/* Right Side: Animated Hero Banner Panel */}
        <div className="bannerSection">
          <div className="bannerOverlay"></div>
          
          {/* Banner content shown when Sign In is active */}
          <div className="bannerContent bannerRight">
            <div className="aiPill">
              <SparklesIcon style={{ fontSize: 15 }} />
              <span>Smart Agritech Network</span>
            </div>
            <h1>New to AgriConnect?</h1>
            <p>Register today to unlock AI disease diagnostics, live market prices, microclimate alerts, and expert agronomist booking.</p>
            
            <div className="featureChips">
              <div className="chip">🌱 Soil Telemetry</div>
              <div className="chip">📈 Live Market Rates</div>
              <div className="chip">🧑‍🌾 Expert Consults</div>
            </div>

            <div className="bannerToggleGroup">
              <span className="togglePrompt">Don't have an account yet?</span>
              <button type="button" className="bannerToggleBtn" onClick={toggleMode}>
                <span>Create Account</span>
                <ArrowForwardOutlinedIcon style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          {/* Banner content shown when Sign Up is active */}
          <div className="bannerContent bannerLeft">
            <div className="aiPill">
              <SparklesIcon style={{ fontSize: 15 }} />
              <span>Welcome Back Partner</span>
            </div>
            <h1>Already Registered?</h1>
            <p>Sign in to check your crop vigor telemetry, manage task schedules, and connect with your dedicated agronomists.</p>
            
            <div className="featureChips">
              <div className="chip">📚 Expert Insights</div>
              <div className="chip">📹 Video Calls</div>
              <div className="chip">⚡ Direct Alerts</div>
            </div>

            <div className="bannerToggleGroup">
              <span className="togglePrompt">Already have an account?</span>
              <button type="button" className="bannerToggleBtn" onClick={toggleMode}>
                <span>Sign In</span>
                <ArrowForwardOutlinedIcon style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Authentication;
