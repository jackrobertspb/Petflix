import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const ShareRedirect = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      if (!shareCode) {
        navigate('/');
        return;
      }

      try {
        // Backend endpoint redirects to frontend video page
        // We'll call it and let it redirect, or extract video_id if it returns JSON
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
        const response = await fetch(`${apiUrl}/videos/share/${shareCode}`, {
          method: 'GET',
          redirect: 'manual' // Don't follow redirect automatically
        });
        
        if (response.status === 302 || response.status === 301) {
          // Backend redirected - extract location header
          const location = response.headers.get('Location');
          if (location) {
            // Extract video ID from redirect URL
            const videoIdMatch = location.match(/\/video\/([^/?]+)/);
            if (videoIdMatch) {
              navigate(`/video/${videoIdMatch[1]}`);
            } else {
              // If location is full URL, navigate to it
              window.location.href = location;
            }
          } else {
            navigate('/');
          }
        } else if (response.ok) {
          // Backend returned JSON instead of redirect
          const data = await response.json();
          if (data.video_id) {
            navigate(`/video/${data.video_id}`);
          } else {
            navigate('/');
          }
        } else {
          // Error response
          navigate('/');
        }
      } catch (error: any) {
        console.error('Share redirect error:', error);
        navigate('/');
      }
    };

    redirect();
  }, [shareCode, navigate]);

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-lightblue dark:border-petflix-orange border-t-transparent"></div>
        <p className="mt-4 text-charcoal dark:text-white">Redirecting to video...</p>
      </div>
    </div>
  );
};

