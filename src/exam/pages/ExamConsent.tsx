/**
 * Exam Consent Page
 * Request permissions: Fullscreen, Webcam, Microphone, Screen Share
 * Apple-inspired sleek design with smooth animations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Monitor,
  Video,
  Mic,
  Maximize,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  AlertTriangle,
  Loader,
  Smartphone,
  Laptop,
  Lock
} from 'lucide-react';
import { getExamById, isExamLive, validateExamSession, type Exam } from '../services/examApi';
import { isDeviceAllowed, getDeviceName, getDeviceInfo } from '../utils/deviceDetection';
import { getStoredSession, generateDeviceFingerprint } from '../utils/examSession';

interface Permission {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: 'pending' | 'granted' | 'denied';
  required: boolean;
}

const ExamConsent: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [deviceAllowed, setDeviceAllowed] = useState<boolean>(true);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [examExpired, setExamExpired] = useState(false);
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [sessionError, setSessionError] = useState<string>('');

  useEffect(() => {
    if (examId) {
      validateSession();
    }
  }, [examId]);

  const validateSession = async () => {
    try {
      // Check if we have a stored session
      const storedSession = getStoredSession(examId!);

      if (!storedSession) {
        // No session found - redirect to password entry
        console.log('No session found, redirecting to verify page');
        navigate(`/exams/${examId}/verify`, { replace: true });
        return;
      }

      // Validate session with backend
      const fingerprint = generateDeviceFingerprint();
      const response = await validateExamSession(
        examId!,
        storedSession.sessionToken,
        fingerprint.deviceHash
      );

      if (!response.success || !response.valid) {
        if (response.expired) {
          setSessionError('Your session has expired. Please verify with the exam password again.');
        } else if (response.invalidDevice) {
          setSessionError('This exam session was started on a different device. Please use the original device to continue.');
        } else if (response.sessionNotFound) {
          setSessionError('Session not found. Please verify with the exam password again.');
        } else {
          setSessionError(response.message || 'Invalid session. Please verify with the exam password again.');
        }
        setSessionInvalid(true);
        setLoading(false);
        return;
      }

      // Session is valid, load exam data
      loadExam();
    } catch (err) {
      console.error('Session validation error:', err);
      // On error, redirect to password entry
      navigate(`/exams/${examId}/verify`, { replace: true });
    }
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await getExamById(examId!);
      if (response.success && response.data) {
        const examData = response.data;
        const normalized = {
          ...examData,
          examId: examData['Exam ID'] || examData.examId,
          examTitle: examData['Exam Title'] || examData.examTitle,
          deviceAllowed: examData['Device Allowed'] || examData.deviceAllowed || 'Laptop/Computer',
          settings: examData.settings
        };
        setExam(normalized);

        // Check if exam has expired
        if (!isExamLive(normalized)) {
          setExamExpired(true);
          setLoading(false);
          return;
        }

        // Check device compatibility
        const examDeviceAllowed = normalized.deviceAllowed;
        const currentDeviceInfo = getDeviceInfo();
        setDeviceInfo(currentDeviceInfo);

        const isAllowed = isDeviceAllowed(examDeviceAllowed);
        setDeviceAllowed(isAllowed);

        if (isAllowed) {
          initializePermissions(normalized);
        }
      }
    } catch (err) {
      console.error('Error loading exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializePermissions = (examData: Exam) => {
    const proctoring = examData.settings?.proctoring;

    const perms: Permission[] = [
      {
        id: 'fullscreen',
        name: 'Fullscreen Mode',
        icon: <Maximize className="w-6 h-6" />,
        description: 'Enter fullscreen mode to prevent distractions',
        status: 'pending',
        required: proctoring?.fullscreenMandatory !== false
      },
      {
        id: 'webcam',
        name: 'Webcam Access',
        icon: <Video className="w-6 h-6" />,
        description: 'Enable webcam for proctoring and identity verification',
        status: 'pending',
        required: proctoring?.webcamRequired !== false
      },
      {
        id: 'microphone',
        name: 'Microphone Access',
        icon: <Mic className="w-6 h-6" />,
        description: 'Enable microphone for audio proctoring',
        status: 'pending',
        required: false
      },
      {
        id: 'screenshare',
        name: 'Screen Sharing',
        icon: <Monitor className="w-6 h-6" />,
        description: 'Share your screen for comprehensive proctoring',
        status: 'pending',
        required: proctoring?.enforceScreensharing !== false
      }
    ];

    setPermissions(perms);
  };

  const requestFullscreen = async (): Promise<boolean> => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Fullscreen error:', error);
      return false;
    }
  };

  const requestMediaPermissions = async (): Promise<{ webcam: boolean; microphone: boolean }> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Store stream for later use
      (window as any).examMediaStream = stream;

      return { webcam: true, microphone: true };
    } catch (error) {
      console.error('Media permissions error:', error);
      return { webcam: false, microphone: false };
    }
  };

  const requestScreenShare = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Store stream for later use
      (window as any).examScreenStream = stream;

      // Monitor the track - if it ends before exam starts, we need to know
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        console.log('🖥️ Screen share track captured:', {
          label: tracks[0].label,
          readyState: tracks[0].readyState
        });

        tracks[0].addEventListener('ended', () => {
          console.log('⚠️ Screen share track ended in consent page');
          // Clear the stream reference so ExamAttempt knows it's invalid
          (window as any).examScreenStream = null;
        });
      }

      // Re-enter fullscreen after screen share (screen share prompt exits fullscreen)
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fsError) {
        console.warn('Could not re-enter fullscreen after screen share:', fsError);
      }

      return true;
    } catch (error) {
      console.error('Screen share error:', error);
      return false;
    }
  };

  const handleRequestPermissions = async () => {
    setRequesting(true);

    // Request permissions one by one
    for (const perm of permissions) {
      if (perm.id === 'fullscreen') {
        const granted = await requestFullscreen();
        updatePermissionStatus('fullscreen', granted ? 'granted' : 'denied');
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (perm.id === 'webcam' || perm.id === 'microphone') {
        const { webcam, microphone } = await requestMediaPermissions();
        updatePermissionStatus('webcam', webcam ? 'granted' : 'denied');
        updatePermissionStatus('microphone', microphone ? 'granted' : 'denied');
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (perm.id === 'screenshare') {
        const granted = await requestScreenShare();
        updatePermissionStatus('screenshare', granted ? 'granted' : 'denied');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setRequesting(false);

    // Check if all required permissions are granted
    const allRequiredGranted = permissions
      .filter(p => p.required)
      .every(p => p.status === 'granted');

    if (allRequiredGranted) {
      // Navigate to exam attempt page
      setTimeout(() => {
        // Check if it's a practice exam
        const isPractice = (exam as any)['Is Practice'] === 'Yes' || (exam as any).isPractice === true;
        const route = isPractice ? `/exams/${examId}/practice` : `/exams/${examId}/attempt`;
        navigate(route);
      }, 1000);
    }
  };

  const updatePermissionStatus = (id: string, status: 'granted' | 'denied') => {
    setPermissions(prev =>
      prev.map(p => (p.id === id ? { ...p, status } : p))
    );
  };

  const allRequiredGranted = permissions
    .filter(p => p.required)
    .every(p => p.status === 'granted');

  const hasAnyGranted = permissions.some(p => p.status === 'granted');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Session Invalid - Show Error Page
  if (sessionInvalid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-center mb-2">
                Session Invalid
              </h1>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                {sessionError}
              </p>

              <button
                onClick={() => navigate(`/exams/${examId}/verify`, { replace: true })}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-2xl transition-all duration-300"
              >
                Verify Password
              </button>

              <button
                onClick={() => navigate('/exams')}
                className="w-full py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam Expired - Show Error Page
  if (examExpired && exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900/50 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-600 to-slate-700 p-8 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">
                Exam Has Ended
              </h1>
              <p className="text-center text-gray-200">
                {exam.examTitle || 'Exam'}
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                This exam is no longer available. The exam period has ended and submissions are closed.
              </p>

              <button
                onClick={() => navigate('/exams')}
                className="w-full py-4 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-2xl transition-all duration-300"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Device Not Allowed - Show Error Page
  if (!deviceAllowed && exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">
                Device Not Allowed
              </h1>
              <p className="text-center text-red-100">
                {exam.examTitle || 'Exam'}
              </p>
            </div>

            {/* Error Content */}
            <div className="p-8 space-y-6">
              {/* Current Device Info */}
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-6">
                <div className="flex items-center gap-4 mb-4">
                  {deviceInfo?.deviceType === 'Laptop/Computer' ? (
                    <Laptop className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Smartphone className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Your Current Device
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getDeviceName()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Device Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{deviceInfo?.deviceType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Operating System:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{deviceInfo?.os}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Browser:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{deviceInfo?.browser}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Screen Size:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {deviceInfo?.screenWidth} × {deviceInfo?.screenHeight}
                    </p>
                  </div>
                </div>
              </div>

              {/* Required Device Info */}
              <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6">
                <div className="flex items-center gap-4 mb-3">
                  {exam.deviceAllowed === 'Laptop/Computer' ? (
                    <Laptop className="w-10 h-10 text-green-600 dark:text-green-400" />
                  ) : (
                    <Smartphone className="w-10 h-10 text-green-600 dark:text-green-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Required Device
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To take this exam
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {exam.deviceAllowed === 'Laptop/Computer'
                    ? 'Laptop or Computer (Windows/Mac/Linux)'
                    : 'Mobile Phone or Tablet'}
                </p>
              </div>

              {/* Error Message */}
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                      Access Denied
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      This exam requires a {exam.deviceAllowed === 'Laptop/Computer' ? 'laptop or computer' : 'mobile phone or tablet'} to access.
                      Please switch to an appropriate device and try again.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 pt-0">
              <button
                onClick={() => navigate('/exams')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 flex items-center justify-center p-4">
      {/* Logo */}
      <div className="absolute top-[-14px] left-4">
        <div className="w-[170px] h-[170px] rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/173/061/original/Copy_of_Logo-Color.png?1767809951"
            alt="Exam Portal Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="w-full max-w-xl">
        {/* Main Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-center mb-1">
              Exam Permissions Required
            </h1>
            <p className="text-center text-green-100 text-sm">
              {exam?.examTitle || 'Exam'}
            </p>
          </div>

          {/* Permissions List */}
          <div className="p-4 space-y-2">
            {permissions.map((perm, index) => (
              <div
                key={perm.id}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  perm.status === 'granted'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : perm.status === 'denied'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      perm.status === 'granted'
                        ? 'bg-green-500 text-white'
                        : perm.status === 'denied'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {perm.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {perm.name}
                      </h3>
                      {perm.required && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {perm.description}
                    </p>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {perm.status === 'granted' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : perm.status === 'denied' ? (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning */}
          {!hasAnyGranted && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-300 mb-0.5">
                    Important Notice
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    All required permissions must be granted to proceed with the exam.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 pt-0 space-y-2">
            <button
              onClick={handleRequestPermissions}
              disabled={requesting || allRequiredGranted}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requesting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Requesting Permissions...
                </>
              ) : allRequiredGranted ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  All Permissions Granted
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Grant Permissions
                </>
              )}
            </button>

            {allRequiredGranted && (
              <button
                onClick={() => {
                  const isPractice = (exam as any)['Is Practice'] === 'Yes' || (exam as any).isPractice === true;
                  const route = isPractice ? `/exams/${examId}/practice` : `/exams/${examId}/attempt`;
                  navigate(route);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 animate-pulse"
              >
                <span>Proceed to Exam</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => navigate('/exams')}
              className="w-full py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Device Info Footer */}
        {deviceInfo && (
          <div className="mt-6 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              {deviceInfo.deviceType === 'Laptop/Computer' ? (
                <Laptop className="w-4 h-4" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              <span>
                Your Device: <strong>{getDeviceName()}</strong> • {deviceInfo.browser}
              </span>
            </div>
          </div>
        )}

        {/* Privacy Footer Info */}
        <div className="mt-4 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            Your privacy is important. Camera and screen recordings are used solely for exam proctoring and will be reviewed only if violations are detected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamConsent;
