import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const ShareVideo = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingVideoId, setExistingVideoId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const navigate = useNavigate();

  const extractVideoId = (url: string): string | null => {
    // Match youtube.com/watch?v=VIDEO_ID
    const longMatch = url.match(/[?&]v=([^&]+)/);
    if (longMatch) return longMatch[1];
    
    // Match youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  };

  const handlePreview = () => {
    // Auto-add https:// if missing
    let url = youtubeUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      setYoutubeUrl(url);
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL. Use format: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID');
      return;
    }

    setError('');
    setPreview({
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Auto-add https:// if missing
      let url = youtubeUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const response = await api.post('/videos', {
        youtubeUrl: url,
        title: customTitle || undefined,
        description: customDescription || undefined,
      });

      // Backend returns { message, video: { id, ... } }
      const videoId = response.data.video?.id || response.data.id;
      
      if (!videoId) {
        throw new Error('No video ID returned from server');
      }

      // Redirect to the video page
      navigate(`/video/${videoId}`);
    } catch (err: any) {
      console.error('Share video error:', err);
      
      // Handle 409 (duplicate video) - show error with link to existing video
      if (err.response?.status === 409 && err.response?.data?.video_id) {
        const videoId = err.response.data.video_id;
        setExistingVideoId(videoId);
        setError(
          err.response?.data?.message || 'You have already shared this video on Petflix.'
        );
        return;
      }
      
      // Clear existing video ID for other errors
      setExistingVideoId(null);
      
      // Handle other errors
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to share video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16 pb-8 sm:pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal dark:text-white mb-2 flex items-center gap-3">
          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Share a Pet Video
        </h1>
        <p className="text-gray-700 dark:text-gray-400 mb-8">
          Share your favorite pet videos from YouTube with the Petflix community
        </p>

        {error && (
          <div className="bg-red-600/90 text-white px-6 py-4 rounded-lg mb-6">
            <p className="font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Error sharing video:
            </p>
            <p className="text-sm mb-3">{error}</p>
            {existingVideoId && (
              <button
                onClick={() => navigate(`/video/${existingVideoId}`)}
                className="bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded transition"
              >
                View Existing Video →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube URL Input */}
          <div className="bg-gray-50 dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <label className="block text-charcoal dark:text-white font-bold mb-3">
              YouTube URL <span className="text-red-600 dark:text-petflix-orange">*</span>
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setPreview(null);
                }}
                className="flex-1 px-5 py-3 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 dark:border-gray-700 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                placeholder="youtube.com/watch?v=... or youtu.be/... (https:// optional)"
                required
              />
              <Button
                type="button"
                onClick={handlePreview}
                className="px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-gray dark:hover:bg-petflix-orange text-white dark:text-white font-medium"
              >
                Preview
              </Button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-400 mt-2">
              Paste a YouTube video link (e.g., youtube.com/watch?v=dQw4w9WgXcQ)
            </p>
          </div>

          {/* Video Preview */}
          {preview && (
            <div className="bg-gray-50 dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-charcoal dark:text-white font-bold mb-4">Preview</h3>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <img 
                  src={preview.thumbnail} 
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default thumbnail if maxresdefault doesn't exist
                    e.currentTarget.src = `https://img.youtube.com/vi/${preview.videoId}/hqdefault.jpg`;
                  }}
                />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-400 mt-3">
                Video ID: <code className="bg-gray-200 dark:bg-petflix-gray text-charcoal dark:text-white px-2 py-1 rounded">{preview.videoId}</code>
              </p>
            </div>
          )}

          {/* Optional Custom Title */}
          <div className="bg-gray-50 dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <label className="block text-charcoal dark:text-white font-bold mb-3">
              Custom Title <span className="text-gray-600 dark:text-gray-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-5 py-3 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 dark:border-gray-700 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
              placeholder="Leave empty to use YouTube's title"
              maxLength={100}
            />
            <p className="text-sm text-gray-700 dark:text-gray-400 mt-2">
              Override the video title. If left empty, we'll use the title from YouTube.
            </p>
          </div>

          {/* Optional Custom Description */}
          <div className="bg-gray-50 dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <label className="block text-charcoal dark:text-white font-bold mb-3">
              Custom Description <span className="text-gray-600 dark:text-gray-400 font-normal">(Optional)</span>
            </label>
            <Textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full px-5 py-3 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 dark:border-gray-700 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange resize-none"
              placeholder="Add your own description or leave empty to use YouTube's"
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-700 dark:text-gray-400 mt-2">
              Tell the community why you love this video!
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading || !youtubeUrl}
              className="flex-1 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold py-4 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sharing Video...'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Share with Petflix
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/feed')}
              variant="outline"
              className="px-8 py-4 bg-gray-300 hover:bg-gray-400 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 bg-gray-50 dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-charcoal dark:text-white font-bold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Tips for Sharing
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-400 text-sm">
            <li>• Find a cute pet video on YouTube</li>
            <li>• Copy the URL from your browser's address bar</li>
            <li>• Paste it above and click "Preview" to check it</li>
            <li>• Add your own title/description to personalize it</li>
            <li>• Click "Share with Petflix" to post it!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

