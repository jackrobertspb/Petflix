import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector or route
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Petflix!',
    description: 'Discover, share, and engage with the best pet videos from YouTube. Let\'s get you started!',
    position: 'center'
  },
  {
    title: 'Search for Videos',
    description: 'Use the search bar to find pet videos by keywords. Try searching for "cute cats" or "funny dogs"!',
    target: '/search',
    position: 'bottom'
  },
  {
    title: 'Share Your Favorites',
    description: 'Found a video you love? Share it with the Petflix community so others can enjoy it too!',
    target: '/share',
    position: 'bottom'
  },
  {
    title: 'Follow Other Users',
    description: 'Follow pet lovers whose taste you appreciate. Their shared videos will appear in your feed!',
    target: '/feed',
    position: 'bottom'
  },
  {
    title: 'Engage with Comments',
    description: 'Watch videos, leave comments, and join the conversation. Connect with fellow pet enthusiasts!',
    target: '/feed',
    position: 'bottom'
  }
];

export const OnboardingTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Routes where tutorial should NOT show (auth pages, etc.)
  const excludedRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];

  useEffect(() => {
    // Only show tutorial if:
    // 1. User is logged in
    // 2. Not on excluded routes (auth pages)
    // 3. Tutorial hasn't been completed before
    const tutorialShown = localStorage.getItem('petflix_tutorial_shown');
    const isExcludedRoute = excludedRoutes.some(route => location.pathname.startsWith(route));
    
    if (user && !tutorialShown && !isExcludedRoute) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
  }, [user, location.pathname]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('petflix_tutorial_shown', 'true');
    setShowTutorial(false);
  };

  const handleNavigate = (target?: string) => {
    if (target && target.startsWith('/')) {
      navigate(target);
    }
  };

  if (!showTutorial) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 w-[500px] h-[350px] border border-gray-200 dark:border-transparent relative flex flex-col">
        {/* Progress Bar */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-petflix-gray rounded-full h-2">
            <div
              className="bg-petflix-orange dark:bg-petflix-orange h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content - Flexible area */}
        <div className="text-center mb-8 flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-4 flex items-center justify-center gap-3">
            {isFirstStep && (
              <svg className="w-9 h-9 text-charcoal dark:text-white" fill="currentColor" viewBox="0 0 512 512">
                <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
              </svg>
            )}
            {step.title}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="flex gap-3 justify-between flex-shrink-0">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`px-6 py-3 font-medium rounded-lg transition ${
              isFirstStep
                ? 'bg-gray-400 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white'
            }`}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white font-bold rounded-lg transition"
          >
            {isLastStep ? 'Get Started!' : 'Next →'}
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6 flex-shrink-0">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-petflix-orange dark:bg-petflix-orange w-8'
                  : 'bg-gray-300 dark:bg-petflix-gray'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

