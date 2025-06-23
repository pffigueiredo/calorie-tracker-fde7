
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  UserProfile, 
  DailySummary, 
  FoodLogEntry, 
  CreateUserProfileInput,
  CreateFoodLogEntryInput 
} from '../../server/src/schema';

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [foodLogEntries, setFoodLogEntries] = useState<FoodLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [profileFormData, setProfileFormData] = useState<CreateUserProfileInput>({
    daily_calorie_target: 2000
  });
  const [logFormData, setLogFormData] = useState<CreateFoodLogEntryInput>({
    user_id: 1, // Fixed user ID for demo
    calories: 0,
    log_date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });

  // Load user profile and daily summary
  const loadUserData = useCallback(async () => {
    try {
      setError(null);
      // Load user profile
      const profile = await trpc.getUserProfile.query({ userId: 1 });
      setUserProfile(profile);

      // Load today's daily summary
      const summary = await trpc.getDailySummary.query({ 
        user_id: 1,
        log_date: new Date().toISOString().split('T')[0]
      });
      setDailySummary(summary);

      // Load recent food log entries
      const entries = await trpc.getFoodLogEntries.query({ user_id: 1 });
      setFoodLogEntries(entries);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Failed to load user data:', err);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newProfile = await trpc.createUserProfile.mutate(profileFormData);
      setUserProfile(newProfile);
      await loadUserData(); // Reload all data
    } catch (err) {
      setError('Failed to create profile');
      console.error('Failed to create profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogCalories = async (e: React.FormEvent) => {
    e.preventDefault();
    if (logFormData.calories <= 0) {
      setError('Please enter a valid calorie amount');
      return;
    }
    
    setIsLoading(true);
    try {
      const newEntry = await trpc.createFoodLogEntry.mutate(logFormData);
      setFoodLogEntries((prev: FoodLogEntry[]) => [newEntry, ...prev]);
      
      // Reset form
      setLogFormData((prev: CreateFoodLogEntryInput) => ({
        ...prev,
        calories: 0
      }));
      
      // Reload daily summary to update progress
      await loadUserData();
      setError(null);
    } catch (err) {
      setError('Failed to log calories');
      console.error('Failed to log calories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgressPercentage = () => {
    if (!dailySummary) return 0;
    return Math.min((dailySummary.total_calories / dailySummary.daily_target) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍎 Calorie Tracker</h1>
          <p className="text-gray-600">Track your daily calorie intake and reach your goals!</p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">❌ {error}</p>
            </CardContent>
          </Card>
        )}

        {/* User Profile Setup */}
        {!userProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🎯 Set Your Daily Calorie Target</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Calorie Target
                  </label>
                  <Input
                    type="number"
                    value={profileFormData.daily_calorie_target}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProfileFormData((prev: CreateUserProfileInput) => ({
                        ...prev,
                        daily_calorie_target: parseInt(e.target.value) || 0
                      }))
                    }
                    min="500"
                    max="5000"
                    step="50"
                    required
                    className="w-full"
                    placeholder="e.g., 2000"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? '⏳ Creating Profile...' : '✨ Create Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Daily Progress */}
        {userProfile && dailySummary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📊 Today's Progress</span>
                <Badge variant={dailySummary.remaining_calories >= 0 ? "default" : "destructive"}>
                  {dailySummary.remaining_calories >= 0 
                    ? `${dailySummary.remaining_calories} cal remaining` 
                    : `${Math.abs(dailySummary.remaining_calories)} cal over`
                  }
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {dailySummary.total_calories} / {dailySummary.daily_target}
                </div>
                <p className="text-gray-600">calories consumed today</p>
              </div>
              
              <Progress 
                value={calculateProgressPercentage()} 
                className="h-3"
              />
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>0 cal</span>
                <span className={`font-medium ${
                  dailySummary.remaining_calories < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {calculateProgressPercentage().toFixed(1)}%
                </span>
                <span>{dailySummary.daily_target} cal</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calorie Logging Form */}
        {userProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🍽️ Log Your Meal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogCalories} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calories
                    </label>
                    <Input
                      type="number"
                      value={logFormData.calories || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLogFormData((prev: CreateFoodLogEntryInput) => ({
                          ...prev,
                          calories: parseInt(e.target.value) || 0
                        }))
                      }
                      min="1"
                      max="2000"
                      required
                      placeholder="e.g., 350"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={logFormData.log_date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLogFormData((prev: CreateFoodLogEntryInput) => ({
                          ...prev,
                          log_date: e.target.value
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? '⏳ Logging...' : '➕ Log Calories'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Food Log Entries */}
        {foodLogEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {foodLogEntries.map((entry: FoodLogEntry, index: number) => (
                  <div key={entry.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{entry.calories} calories</p>
                          <p className="text-sm text-gray-500">
                            {entry.log_date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {entry.log_date.toLocaleDateString() === new Date().toLocaleDateString() 
                          ? 'Today' 
                          : entry.log_date.toLocaleDateString()
                        }
                      </Badge>
                    </div>
                    {index < foodLogEntries.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {userProfile && foodLogEntries.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No entries yet</h3>
              <p className="text-gray-500">Start tracking your calories by logging your first meal above!</p>
            </CardContent>
          </Card>
        )}

        {/* Note about stub data */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Note:</strong> This application is using stub data from the server handlers. 
              The backend handlers are placeholder implementations that return mock data. 
              In a production environment, these would be connected to a real database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
