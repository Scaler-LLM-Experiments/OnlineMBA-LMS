import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { 
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { LeaderboardEntry, LeaderboardTimeframe } from '../../types/studentsCorner';
import { apiService } from '../../services/api';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

interface LeaderboardProps {
  data?: LeaderboardEntry[];
  loading?: boolean;
  showFullLeaderboard?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  data: initialData, 
  loading: initialLoading = false,
  showFullLeaderboard = false 
}) => {
  const user = auth.currentUser;
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(initialData || []);
  const [loading, setLoading] = useState(initialLoading);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all');
  const [showOnlyMyBatch, setShowOnlyMyBatch] = useState(false);

  useEffect(() => {
    if (showFullLeaderboard) {
      loadLeaderboard();
    } else if (initialData) {
      setLeaderboardData(initialData);
    }
  }, [timeframe, showFullLeaderboard, initialData]);

  const loadLeaderboard = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await apiService.getStudentsCornerLeaderboard(user.email, timeframe);
      
      if (response.success && response.data) {
        setLeaderboardData(response.data);
      } else {
        toast.error(response.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200 text-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-muted/50 to-muted/30 border-muted text-foreground';
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-card border-border';
    }
  };

  const getDisplayData = () => {
    let filtered = leaderboardData;
    
    if (showOnlyMyBatch && user?.email) {
      // Find current user's batch
      const currentUser = leaderboardData.find(entry => entry.studentEmail === user.email);
      if (currentUser) {
        filtered = leaderboardData.filter(entry => entry.batch === currentUser.batch);
      }
    }
    
    return showFullLeaderboard ? filtered : filtered.slice(0, 5);
  };

  const renderTimeframeButtons = () => {
    const timeframes: { key: LeaderboardTimeframe; label: string; icon: React.ReactElement }[] = [
      { key: 'all', label: 'All Time', icon: <Trophy className="h-4 w-4" /> },
      { key: 'month', label: 'This Month', icon: <Calendar className="h-4 w-4" /> },
      { key: 'week', label: 'This Week', icon: <TrendingUp className="h-4 w-4" /> }
    ];

    return (
      <div className="flex gap-2 mb-4">
        {timeframes.map(({ key, label, icon }) => (
          <Button
            key={key}
            variant={timeframe === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe(key)}
            className="flex items-center gap-2"
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => {
    const isCurrentUser = entry.studentEmail === user?.email;
    const rankColor = getRankColor(entry.rank);

    return (
      <Card 
        key={entry.studentEmail} 
        className={`mb-3 transition-all duration-200 ${rankColor} ${
          isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-md'
        }`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/50 flex-shrink-0">
                {entry.rank <= 3 ? (
                  getRankIcon(entry.rank)
                ) : (
                  <span className="font-bold text-sm">#{entry.rank}</span>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <h4 className="font-semibold truncate text-sm">{entry.fullName}</h4>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      <Star className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs self-start px-1 py-0 text-foreground border-foreground/20">
                    {entry.batch}
                  </Badge>
                  <span>{entry.recentActivity} activities</span>
                </div>
              </div>
            </div>

            {/* Points */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-primary">
                {entry.totalPoints}
              </div>
              <div className="text-xs text-muted-foreground">
                points
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: showFullLeaderboard ? 10 : 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const displayData = getDisplayData();

  return (
    <Card className={showFullLeaderboard ? '' : 'h-full'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">
            {showFullLeaderboard ? 'Community Leaderboard' : 'Top Contributors'}
          </CardTitle>
        </div>
        
        {showFullLeaderboard && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyMyBatch(!showOnlyMyBatch)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {showOnlyMyBatch ? 'All Batches' : 'My Batch'}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {showFullLeaderboard && renderTimeframeButtons()}
        
        {loading ? (
          renderLoadingSkeleton()
        ) : displayData.length > 0 ? (
          <div className="space-y-0">
            {displayData.map(renderLeaderboardEntry)}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leaderboard Data</h3>
            <p className="text-muted-foreground">
              Be the first to contribute and earn points!
            </p>
          </div>
        )}

        {/* Show more button for compact view */}
        {!showFullLeaderboard && leaderboardData.length > 5 && (
          <div className="text-center mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              View Full Leaderboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;