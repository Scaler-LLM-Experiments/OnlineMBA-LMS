import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if email domain is correct - allow both domains
      if (!user.email?.endsWith('@scaler.com') && !user.email?.endsWith('@ssb.scaler.com')) {
        await auth.signOut();
        toast.error('Please use your @scaler.com or @ssb.scaler.com email address');
        setIsLoading(false);
        return;
      }

      // Check if student exists in Student Login sheet
      const loadingToast = toast.loading('Verifying student registration...');
      console.log('Checking profile for:', user.email);
      const profileResult = await apiService.getStudentProfile(user.email);
      console.log('Login profile result:', profileResult);
      console.log('Login profile data:', profileResult.data);
      console.log('Login isAdmin flag:', profileResult.data?.isAdmin);
      toast.dismiss(loadingToast);

      if (!profileResult.success || !profileResult.data) {
        await auth.signOut();
        toast.error(`Student not found: ${profileResult.error || 'Please contact administrator'}`);
        console.error('Login failed:', profileResult);
        setIsLoading(false);
        return;
      }

      // Store user profile in localStorage for AuthContext
      const userData = {
        studentId: profileResult.data.email.split('@')[0],
        email: profileResult.data.email,
        name: profileResult.data.fullName,
        batch: profileResult.data.batch,
        isAdmin: profileResult.data.isAdmin || false,
      };
      console.log('Login: Storing user data:', userData);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success(`Welcome, ${profileResult.data.fullName || user.displayName}!`);

      // User will be redirected by the auth state listener in App.tsx
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Typewriter effect - runs once only
  useEffect(() => {
    const timer = setTimeout(() => {
      setTypewriterComplete(true);
    }, 4000); // Complete after 4 seconds

    return () => clearTimeout(timer);
  }, []);

  // Generate minimal stars
  const generateStars = () => {
    const stars = [];
    const starCount = 25; // Much fewer stars
    
    for (let i = 0; i < starCount; i++) {
      const size = Math.random() > 0.8 ? 'star-large' : 'star-medium';
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = 3 + Math.random() * 3;
      const delay = Math.random() * 5;
      
      stars.push(
        <div
          key={`star-${i}`}
          className={`star ${size}`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            '--duration': `${duration}s`,
            animationDelay: `${delay}s`
          } as React.CSSProperties}
        />
      );
    }
    return stars;
  };

  // Generate upward shooting star
  const generateShootingStars = () => {
    return (
      <div
        key="shooting-star-upward"
        className="shooting-star-upward"
        style={{
          bottom: '-100px',
          left: '-100px',
          animationDelay: '5s'
        }}
      />
    );
  };

  return (
    <div className="cosmic-bg min-h-screen relative overflow-hidden">
      {/* INTERACTIVE STAR FIELD */}
      <div className="star-field">
        {generateStars()}
        {generateShootingStars()}
      </div>

      {/* CLEAN SOLAR SYSTEM */}
      <div className="solar-system">
        {/* Central Sun */}
        <div className="sun"></div>
        
        {/* Orbital Paths (visible rings) */}
        <div className="orbit orbit-1"></div>
        <div className="orbit orbit-2"></div>
        <div className="orbit orbit-3"></div>
        <div className="orbit orbit-4"></div>
        <div className="orbit orbit-5"></div>
        <div className="orbit orbit-6"></div>
        <div className="orbit orbit-7"></div>
        <div className="orbit orbit-8"></div>
        <div className="orbit orbit-9"></div>
        
        {/* Planets with Moons and Features */}
        <div className="planet planet-1"></div>
        <div className="planet planet-2"></div>
        <div className="planet planet-3"></div>
        <div className="planet planet-4"></div>
        <div className="planet planet-5">
          {/* Jupiter's Moons */}
          <div className="jupiter-moon-1"></div>
          <div className="jupiter-moon-2"></div>
          <div className="jupiter-moon-3"></div>
          <div className="jupiter-moon-4"></div>
        </div>
        <div className="planet planet-6">
          {/* Saturn's additional outer ring */}
          <div className="saturn-outer-ring"></div>
        </div>
        <div className="planet planet-7"></div>
        <div className="planet planet-8"></div>
        <div className="planet planet-9"></div>
      </div>
      
      {/* Geometric Background Elements */}
      <div className="geometric"></div>
      <div className="geometric"></div>
      <div className="geometric"></div>
      
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Side - Epic Branding */}
          <div className="text-center lg:text-left space-y-10">
            {/* Ultra Minimal Logo */}
            <div className="flex justify-center lg:justify-start">
              <div style={{ animation: 'logoFloat 12s ease-in-out infinite' }}>
                <img 
                  src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234" 
                  alt="Scaler School of Business" 
                  className="h-20 w-auto"
                />
              </div>
            </div>
            
            {/* Clean Static Heading */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-8 leading-tight text-glow">
                Step Into The
                <br />
                <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent">
                  Future of Learning
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl">
                <span className={`inline-block overflow-hidden whitespace-nowrap ${!typewriterComplete ? 'border-r-2 border-green-400' : ''}`}
                      style={!typewriterComplete ? { animation: 'typewriter 4s steps(40, end) forwards' } : {}}>
                  Your gateway to next-generation academic excellence.
                </span>
                <br />
                <span className="text-green-400 font-semibold"> Powered by innovation.</span>
              </p>
            </div>
            

          </div>
          
          {/* Right Side - Clean Login Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="ultimate-glass rounded-3xl p-6 sm:p-10 w-full max-w-lg relative overflow-hidden">
              {/* Minimal Scanning Line Effect */}
              <div className="scan-line"></div>
              
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Welcome Back</h2>
                <p className="text-gray-300 text-lg sm:text-xl">Access your academic universe</p>
                <div className="w-20 h-1 bg-gradient-to-r from-green-400 to-yellow-400 mx-auto mt-4 rounded-full"></div>
              </div>
              
              {/* Clean Google Login Button */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="epic-button ripple w-full text-white font-bold py-6 px-8 rounded-2xl flex items-center justify-center space-x-4 text-xl mb-10 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {/* Animated Google Icon */}
                <div className="relative">
                  {isLoading ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-8 h-8 transition-transform group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </div>
                <span>{isLoading ? 'Launching...' : 'Launch into Portal'}</span>
                {!isLoading && <div className="text-2xl transition-transform group-hover:translate-x-2">🚀</div>}
              </button>
              
              {/* Security Badge */}
              <div className="hologram rounded-2xl p-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center status-glow">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Secure SSB Access</p>
                    <p className="text-gray-300 text-sm">Use your @ssb.scaler.com account</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      
      {/* Version Info */}
      <div className="absolute bottom-8 right-8 ultimate-glass rounded-xl px-4 py-2">
        <span className="text-gray-300 text-sm">Portal v2.0 ⚡</span>
      </div>
    </div>
  );
};

export default Login;