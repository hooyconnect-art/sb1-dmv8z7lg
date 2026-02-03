'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Check } from 'lucide-react';

interface WaitingListButtonProps {
  listingId: string;
}

export function WaitingListButton({ listingId }: WaitingListButtonProps) {
  const { user } = useAuth();
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkWaitlistStatus();
    }
  }, [user, listingId]);

  const checkWaitlistStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('waiting_list')
      .select('id')
      .eq('listing_id', listingId)
      .eq('guest_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    setIsOnWaitlist(!!data);
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      toast.error('Please login to join the waiting list');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('waiting_list')
      .insert({
        listing_id: listingId,
        guest_id: user.id,
        status: 'pending',
      });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('You are already on the waiting list');
      } else {
        toast.error('Failed to join waiting list');
      }
    } else {
      toast.success('Added to waiting list! We will notify you when available.');
      setIsOnWaitlist(true);
    }
  };

  if (isOnWaitlist) {
    return (
      <Button
        disabled
        className="w-full flex items-center gap-2"
        variant="outline"
      >
        <Check className="h-4 w-4" />
        On Waiting List
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoinWaitlist}
      disabled={loading}
      className="w-full flex items-center gap-2"
      variant="secondary"
    >
      <Bell className="h-4 w-4" />
      {loading ? 'Joining...' : 'Join Waiting List'}
    </Button>
  );
}
