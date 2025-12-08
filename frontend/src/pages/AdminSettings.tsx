import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface RelevanceWeights {
  keywordMatch: number;
  viewCount: number;
  likeRatio: number;
  recency: number;
  engagement: number;
}

export const AdminSettings = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [weights, setWeights] = useState<RelevanceWeights>({
    keywordMatch: 0.40,
    viewCount: 0.15,
    likeRatio: 0.15,
    recency: 0.15,
    engagement: 0.15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user?.is_admin) {
      toast.error('Admin access required');
      navigate('/');
    } else {
      loadWeights();
    }
  }, [user, navigate, toast]);

  const loadWeights = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/relevance-weights');
      setWeights(response.data.weights);
    } catch (error: any) {
      console.error('Failed to load weights:', error);
      toast.error(error.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key: keyof RelevanceWeights, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setWeights(prev => ({
        ...prev,
        [key]: numValue,
      }));
    }
  };

  const getTotalWeight = () => {
    return Object.values(weights).reduce((sum, w) => sum + w, 0);
  };

  const handleSave = async () => {
    const total = getTotalWeight();
    if (Math.abs(total - 1.0) > 0.01) {
      toast.error(`Weights must sum to 1.0 (current: ${total.toFixed(2)})`);
      return;
    }

    setSaving(true);
    try {
      await api.patch('/admin/relevance-weights', weights);
      toast.success('Relevance weights updated successfully!');
    } catch (error: any) {
      console.error('Failed to update weights:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights({
      keywordMatch: 0.40,
      viewCount: 0.15,
      likeRatio: 0.15,
      recency: 0.15,
      engagement: 0.15,
    });
    toast.info('Reset to default values');
  };

  const total = getTotalWeight();
  const isValid = Math.abs(total - 1.0) < 0.01;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-petflix-orange dark:border-petflix-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16">
      <div className="max-w-4xl mx-auto mb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
            Admin Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure search relevance algorithm weights
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-petflix-dark-gray rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
              Search Relevance Algorithm
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Adjust how search results are ranked. All weights must sum to exactly 1.0 (100%).
            </p>
            
            {/* Total Weight Indicator */}
            <div className={`p-4 rounded-lg mb-6 ${
              isValid 
                ? 'bg-green-100 dark:bg-green-900/20 border border-green-500' 
                : 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-charcoal dark:text-white">
                  Total Weight:
                </span>
                <span className={`text-xl font-bold ${
                  isValid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {total.toFixed(4)} / 1.0000
                </span>
              </div>
              {!isValid && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  ⚠️ Adjust weights so they sum to 1.0 before saving
                </p>
              )}
            </div>
          </div>

          {/* Weight Inputs */}
          <div className="space-y-6 mb-8">
            {/* Keyword Match */}
            <WeightInput
              label="Keyword Match"
              description="How well the search terms match video titles and descriptions"
              value={weights.keywordMatch}
              onChange={(value) => handleWeightChange('keywordMatch', value)}
              percentage={(weights.keywordMatch * 100).toFixed(0)}
            />

            {/* View Count */}
            <WeightInput
              label="View Count"
              description="Video popularity based on total views"
              value={weights.viewCount}
              onChange={(value) => handleWeightChange('viewCount', value)}
              percentage={(weights.viewCount * 100).toFixed(0)}
            />

            {/* Like Ratio */}
            <WeightInput
              label="Like Ratio"
              description="Video quality based on likes per view"
              value={weights.likeRatio}
              onChange={(value) => handleWeightChange('likeRatio', value)}
              percentage={(weights.likeRatio * 100).toFixed(0)}
            />

            {/* Recency */}
            <WeightInput
              label="Recency"
              description="How recently the video was shared (newer = higher)"
              value={weights.recency}
              onChange={(value) => handleWeightChange('recency', value)}
              percentage={(weights.recency * 100).toFixed(0)}
            />

            {/* Engagement */}
            <WeightInput
              label="Engagement"
              description="User interaction (likes + comments + shares)"
              value={weights.engagement}
              onChange={(value) => handleWeightChange('engagement', value)}
              percentage={(weights.engagement * 100).toFixed(0)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className={`flex-1 px-6 py-3 rounded-lg font-bold text-white transition-all ${
                isValid && !saving
                  ? 'bg-petflix-orange dark:bg-petflix-orange hover:opacity-90 hover:scale-105'
                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-bold text-charcoal dark:text-white border-2 border-charcoal dark:border-white hover:bg-charcoal hover:text-white dark:hover:bg-white dark:hover:text-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-charcoal dark:text-white mb-2">
              💡 Tips for tuning
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Higher <strong>Keyword Match</strong> = More relevant but fewer results</li>
              <li>• Higher <strong>View Count</strong> = Popular videos rise to the top</li>
              <li>• Higher <strong>Like Ratio</strong> = Quality over quantity</li>
              <li>• Higher <strong>Recency</strong> = Fresh content prioritized</li>
              <li>• Higher <strong>Engagement</strong> = Community favorites</li>
              <li>• Default weights (40%, 15%, 15%, 15%, 15%) work well for most cases</li>
            </ul>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-petflix-dark-gray rounded-lg shadow-lg p-8 mt-6">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Admin Tools
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/errors"
              className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-charcoal dark:text-white">
                    📊 Error Dashboard
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor application errors and performance issues
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Weight Input Component
interface WeightInputProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: string) => void;
  percentage: string;
}

const WeightInput = ({ label, description, value, onChange, percentage }: WeightInputProps) => {
  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-charcoal dark:text-white">
          {label}
        </label>
        <span className="text-xl font-bold text-petflix-orange dark:text-petflix-orange">
          {percentage}%
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {description}
      </p>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ADD8E6 0%, #ADD8E6 ${value * 100}%, #E5E7EB ${value * 100}%, #E5E7EB 100%)`,
          }}
        />
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-charcoal dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
        />
      </div>
    </div>
  );
};

export default AdminSettings;

