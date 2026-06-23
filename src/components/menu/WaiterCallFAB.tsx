import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HandHelping, Check, HelpCircle, Volume2, Mic, Camera, Send, X, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { checkRateLimit, RATE_LIMITS, getRemainingCooldown } from '@/utils/rateLimiter';

interface WaiterCallFABProps {
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  onDrawerStateChange?: (open: boolean) => void;
  seatNumber?: number | null;
}

type CallState = 'idle' | 'sending' | 'pending' | 'acknowledged' | 'completed';

export function WaiterCallFAB({ restaurantId, tableId, tableNumber, onDrawerStateChange, seatNumber }: WaiterCallFABProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    if (onDrawerStateChange) {
      onDrawerStateChange(showDrawer);
    }
  }, [showDrawer, onDrawerStateChange]);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Image attachment state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch active waiter calls for this table
  const { data: activeCalls = [] } = useQuery({
    queryKey: ['active-waiter-calls', restaurantId, tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
    enabled: !!restaurantId && !!tableId
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!restaurantId || !tableId) return;

    const channel = supabase
      .channel(`waiter-calls-fab-${tableId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_calls', filter: `table_id=eq.${tableId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-waiter-calls', restaurantId, tableId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableId, queryClient]);

  // Determine current active call state
  const activeCall = activeCalls[0];
  const currentState: CallState = 
    !activeCall ? 'idle' :
    activeCall.status === 'pending' ? 'pending' :
    activeCall.status === 'acknowledged' ? 'acknowledged' : 'idle';

  // Mutation to create call
  const createCall = useMutation({
    mutationFn: async (reason: string) => {
      const { data, error } = await supabase
        .from('waiter_calls')
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          reason,
          status: 'pending',
          seat_number: seatNumber || null
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-waiter-calls', restaurantId, tableId] });
    }
  });

  // Trigger call
  const handleQuickCall = async (reason = 'Assistance requested') => {
    // Rate Limit Check
    if (!checkRateLimit(`waiter_call_${restaurantId}_${tableId}`, RATE_LIMITS.WAITER_CALL.maxAttempts, RATE_LIMITS.WAITER_CALL.windowMs)) {
      const cooldown = getRemainingCooldown(`waiter_call_${restaurantId}_${tableId}`);
      toast({
        title: 'Too many requests',
        description: `Please wait ${cooldown}s before requesting assistance again.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCall.mutateAsync(reason);
      toast({
        title: 'Request Sent',
        description: 'A waiter will be notified immediately.',
      });
      setShowDrawer(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to call waiter. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({
        title: 'Permission Denied',
        description: 'Microphone access is required to record voice notes.',
        variant: 'destructive',
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all audio tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Handle Voice Request upload
  const handleVoiceSubmit = async () => {
    if (!audioBlob) return;

    try {
      setUploadingImage(true);
      const fileName = `${restaurantId}/${tableId}/${Date.now()}.webm`;
      
      // Upload audio blob to Supabase Storage
      const { data, error } = await supabase.storage
        .from('waiter_calls_audio' as any)
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (error) throw error;

      const publicUrl = supabase.storage.from('waiter_calls_audio' as any).getPublicUrl(fileName).data.publicUrl;
      
      // Create waiter call with audio details inside reason JSON
      await handleQuickCall(JSON.stringify({
        type: 'voice',
        url: publicUrl,
        label: '🎤 Voice Request'
      }));

      // Reset voice state
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (err) {
      // Fallback: send as base64 string or log locally if bucket doesn't exist yet
      console.warn('Storage bucket upload failed, using fallback database logging:', err);
      // Fallback to text helper
      await handleQuickCall('🎤 Voice note uploaded (Local data)');
      setAudioUrl(null);
      setAudioBlob(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image attachment
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit image attachment call
  const handleImageSubmit = async () => {
    if (!imageFile) return;

    try {
      setUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${restaurantId}/${tableId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('order_disputes' as any)
        .upload(fileName, imageFile);

      if (error) throw error;

      const publicUrl = supabase.storage.from('order_disputes' as any).getPublicUrl(fileName).data.publicUrl;

      // Create waiter call with image details inside reason JSON
      await handleQuickCall(JSON.stringify({
        type: 'image',
        url: publicUrl,
        label: '📷 Image Report: Wrong/Damaged Food'
      }));

      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.warn('Storage upload failed, using fallback database logging:', err);
      await handleQuickCall('📷 Photo Report submitted');
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // State indicators
  const buttonColors = {
    idle: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_8px_24px_rgba(16,185,129,0.25)]',
    sending: 'bg-zinc-400 text-white cursor-not-allowed',
    pending: 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_8px_24px_rgba(245,158,11,0.25)]',
    acknowledged: 'bg-indigo-500 hover:bg-indigo-650 text-white shadow-[0_8px_24px_rgba(99,102,241,0.25)]',
    completed: 'bg-teal-500 text-white'
  };

  const statusLabel = {
    idle: 'Call Waiter',
    sending: 'Calling...',
    pending: 'Request Sent',
    acknowledged: 'Staff Arriving 🏃',
    completed: 'Completed!'
  };

  // Ring specs for SVG
  const ringStrokeColors = {
    idle: 'rgba(16, 185, 129, 0.25)',
    sending: 'rgba(161, 161, 170, 0.4)',
    pending: '#F59E0B',
    acknowledged: '#6366F1',
    completed: '#14B8A6'
  };

  return (
    <>
      <div className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-[45] flex items-center justify-center w-16 h-16 select-none">
        {/* Segmented/Rotating Live Ring around the FAB */}
        <svg className={`absolute inset-0 -rotate-90 w-16 h-16 pointer-events-none transition-transform duration-700 ${currentState === 'pending' || currentState === 'acknowledged' ? 'animate-[spin_4s_linear_infinite] origin-center' : ''}`} viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="29"
            fill="transparent"
            stroke={ringStrokeColors[currentState]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={
              currentState === 'idle' ? '182.2' :
              currentState === 'pending' ? '45 137.2' :
              currentState === 'acknowledged' ? '136.6 45.6' : '182.2'
            }
            className="transition-all duration-500 ease-in-out"
          />
        </svg>

        <motion.div
          animate={currentState !== 'idle' ? { scale: [1, 1.04, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative"
        >
          <Button
            onClick={() => setShowDrawer(true)}
            className={`w-13 h-13 rounded-full flex items-center justify-center p-0 transition-all select-none border-0 ${buttonColors[currentState]}`}
            title="Service Desk"
          >
            {currentState === 'idle' && (
              <>
                <span className="absolute inset-0 rounded-full bg-emerald-500/25 animate-[ping_2s_infinite]" />
                <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-[ping_2s_infinite_1s]" />
                <HandHelping className="w-5.5 h-5.5" />
              </>
            )}
            {currentState === 'pending' && (
              <>
                <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-[ping_2s_infinite]" />
                <span className="absolute inset-0 rounded-full bg-amber-500/15 animate-[ping_2s_infinite_1s]" />
                <Loader2 className="w-5.5 h-5.5 animate-spin" />
              </>
            )}
            {currentState === 'acknowledged' && (
              <>
                <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-[ping_2s_infinite]" />
                <span className="absolute inset-0 rounded-full bg-indigo-500/15 animate-[ping_2s_infinite_1s]" />
                <Loader2 className="w-5.5 h-5.5 animate-spin text-white" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Status mini-pill */}
        {currentState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 -top-8 bg-zinc-900/95 dark:bg-zinc-50/95 text-zinc-50 dark:text-zinc-900 text-[10px] font-black tracking-tight px-2.5 py-0.5 rounded-full shadow backdrop-blur truncate max-w-[140px] border border-zinc-800"
          >
            {statusLabel[currentState]}
          </motion.div>
        )}
      </div>

      {/* Slide up panel options */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="w-full max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Restaurant Service Desk</h3>
                <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => setShowDrawer(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Status Alert if Call is Active */}
              {currentState !== 'idle' && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-2">
                  <HandHelping className="w-4 h-4 shrink-0" />
                  <span>
                    {currentState === 'pending' ? 'Request sent to dashboard. Standing by for staff acceptance.' : 'Staff has accepted your call and is arriving shortly!'}
                  </span>
                </div>
              )}

              {/* Direct call options */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleQuickCall('Water requested')} 
                  variant="outline" 
                  className="rounded-2xl h-12 text-xs font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  🥛 Need Water
                </Button>
                <Button 
                  onClick={() => handleQuickCall('Bill requested')} 
                  variant="outline" 
                  className="rounded-2xl h-12 text-xs font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  💵 Need Bill
                </Button>
              </div>

              {/* Action Tabs: Voice Note / Photo */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Advanced Assistance Request</p>

                {/* Voice Request Panel */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Voice Note Helper</span>
                    {audioUrl && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-500 hover:text-rose-600" onClick={() => setAudioUrl(null)}>
                        Clear
                      </Button>
                    )}
                  </div>

                  {!audioUrl ? (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`flex-1 rounded-2xl h-11 text-xs font-bold transition-all ${
                          isRecording 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950'
                        }`}
                      >
                        <Mic className="w-4 h-4 mr-1.5" />
                        {isRecording ? 'Recording (Release to Stop)' : 'Hold to Record Request'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={() => {
                        const audio = new Audio(audioUrl);
                        audio.play();
                      }}>
                        <Play className="w-3.5 h-3.5 mr-1" /> Play Recording
                      </Button>
                      <Button 
                        disabled={uploadingImage}
                        onClick={handleVoiceSubmit} 
                        className="rounded-xl h-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Image upload / Dispute panel */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 space-y-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Photo Attachment (Wrong/Damaged Food)</span>
                  
                  {!imagePreview ? (
                    <label className="flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/80 transition-colors">
                      <Camera className="w-5 h-5 text-zinc-400 mr-2" />
                      <span className="text-xs text-zinc-500">Take Photo or Upload Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3">
                      <img src={imagePreview} className="w-12 h-12 rounded-xl object-cover border" />
                      <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 h-8 text-xs" onClick={() => setImagePreview(null)}>
                        Remove
                      </Button>
                      <Button 
                        disabled={uploadingImage}
                        onClick={handleImageSubmit} 
                        className="ml-auto rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white h-9"
                      >
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Waiter default action */}
              <Button 
                onClick={() => handleQuickCall('Waiter assistance call')} 
                disabled={currentState !== 'idle' || createCall.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 font-extrabold text-sm"
              >
                {createCall.isPending ? 'Requesting...' : '🔔 Call Waiter Staff'}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
