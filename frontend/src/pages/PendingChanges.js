import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, X, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PendingChanges = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchChanges();
  }, []);

  const fetchChanges = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pending-changes`);
      setChanges(response.data);
    } catch (error) {
      toast.error('Failed to fetch pending changes');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (changeId, status) => {
    setReviewing(true);
    try {
      await axios.post(`${API_BASE}/pending-changes/${changeId}/review`, {
        status,
        comments: reviewComments,
      });
      toast.success(`Change ${status} successfully`);
      setDialogOpen(false);
      setReviewComments('');
      setSelectedChange(null);
      fetchChanges();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${status} change`);
    } finally {
      setReviewing(false);
    }
  };

  const openReviewDialog = (change) => {
    setSelectedChange(change);
    setDialogOpen(true);
  };

  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Pending Changes</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Review and approve changes submitted through the maker-checker workflow
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : changes.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Pending Changes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                All changes have been reviewed. New submissions will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <Card
                key={change.id}
                className="card-hover border-slate-200 dark:border-slate-800"
                data-testid={`pending-change-${change.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-slate-900 dark:text-white">
                          {change.entity_type.charAt(0).toUpperCase() + change.entity_type.slice(1)} Change
                        </CardTitle>
                        <Badge className={cn('capitalize', getChangeTypeColor(change.change_type))}>
                          {change.change_type}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Maker:</span> {change.maker_username}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(change.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReviewDialog(change)}
                        data-testid={`review-button-${change.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Change Details</h4>
                    <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
                      {JSON.stringify(change.new_data, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Change</DialogTitle>
              <DialogDescription>
                Review the details and approve or reject this change request.
              </DialogDescription>
            </DialogHeader>
            {selectedChange && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Change Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Type:</span>
                      <Badge className={cn('capitalize', getChangeTypeColor(selectedChange.change_type))}>
                        {selectedChange.change_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Entity:</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize">
                        {selectedChange.entity_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Maker:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedChange.maker_username}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedChange.old_data && (
                  <div>
                    <Label className="text-slate-900 dark:text-white">Old Data</Label>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 mt-2">
                      <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
                        {JSON.stringify(selectedChange.old_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-slate-900 dark:text-white">New Data</Label>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 mt-2">
                    <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedChange.new_data, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder="Add your review comments..."
                    className="mt-2"
                    rows={3}
                    data-testid="review-comments-input"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReview(selectedChange.id, 'approved')}
                    disabled={reviewing}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    data-testid="approve-button"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedChange.id, 'rejected')}
                    disabled={reviewing}
                    variant="destructive"
                    className="flex-1"
                    data-testid="reject-button"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default PendingChanges;
