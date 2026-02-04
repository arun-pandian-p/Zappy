import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSoundOptions {
  volume?: number;
  loop?: boolean;
}

export const useSound = (soundUrl: string, options: UseSoundOptions = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('sound-muted');
    return saved === 'true';
  });

  useEffect(() => {
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = options.volume ?? 0.7;
    audioRef.current.loop = options.loop ?? false;

    audioRef.current.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl, options.volume, options.loop]);

  const play = useCallback(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay was prevented, ignore
      });
      setIsPlaying(true);
    }
  }, [isMuted]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem('sound-muted', String(newValue));
      return newValue;
    });
  }, []);

  return { play, stop, isPlaying, isMuted, toggleMute };
};

// Pre-defined sound URLs using base64 encoded sounds for reliability
export const SOUNDS = {
  NEW_ORDER: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4GML+v0dR8Nwd4pr/YeT0AAACQo6e+cTkWKHJ2rPONPhYAaJyzveZ8NAgAcoq42epnGABul6S5vncRAABniqm+nnU3Hn+n0NCGOh0Af6DIyGklBi+Xr8KTPAAAfZCpw5w3FRdvoNTSkDoLAGeBqL+KOxELeJnM0HwnBACCj6i4kToYDnh9rMZ+JgAAe5Gjtq5sIxJyg7fViSsAAHKIpbOaZSESc4W5xnkdAAB0i6O4l1okFHiHu8NuFgAAd42gupVWJBZ7ir67aRAAAHqPnLqVUyMWfYu8t2MLAACAkJq5lVAdF4GNu7FfBwAAg5GXuJVMHhmElLevUwMAAIaSlraTSxsajJq2qkr+/wCJk5SzkkodHJGftatA+v4AipSTs5BHHB6Xo7OlOPj/AImVk7KPRRoeo6mtnjD3AAKHl5KxjEQZIKqtppkq9gAEhZiRsItCGCKxsKGUIvUABISakLCJQBcks7SclB30AAaDm46viD0WJre3mZAV9AEIgZyNrop7FimKkY+FGhQZY39vfWkpHx5bYmFXQS0mOmFubm9TJikodIOSlVgbFyR2mLOxdh0LF2ORvMeCJQAAZJC+0n0hAABbkLzOfywAAGCMu8t7JgAAX4u5xnUhAABkhLfAdBwAAGaBs7puGAAAaX+wrWwVAABue6yoaRIAAHF5qKRnEQAAdXenjWMQAAB4d6aIXw4AAHt3pIRdCwAAfHajgVoJAAB+dqF+WAgAAH93oHtWBwAAf3efd1QGAAB/d593UwYAAH93n3dTBgAAf3efd1MGAAB/d593UwYAAH93n3dTBgAAf3efd1MGAAB/d593UwYAAH93n3dTBg==',
  WAITER_CALL: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2+teRx4GML+v0dR8Nwd4pr/YeT0AAACQo6e+cTkWKHJ2rPONPhYAaJyzveZ8NAgAcoq42epnGABul6S5vncRAABniqm+nnU3Hn+n0NCGOh0Af6DIyGklBi+Xr8KTPAAAfZCpw5w3FRdvoNTSkDoLAGeBqL+KOxELeJnM0HwnBACCj6i4kToYDnh9rMZ+JgAAe5Gjtq5sIxJyg7fViSsAAHKIpbOaZSESc4W5xnkdAAB0i6O4l1okFHiHu8NuFgAAd42gupVWJBZ7ir67aRAAAHqPnLqVUyMWfYu8t2MLAACAkJq5lVAdF4GNu7FfBwAAg5GXuJVMHhmElLevUwMAAIaSlraTSxsajJq2qkr+/wCJk5SzkkodHJGftatA+v4AipSTsZBHHB6Xo7OlOPj/AImVk7KPRRoeo6mtnjD3AAKHl5KxjEQZIKqtppkq9gAEhZiRsItCGCKxsKGUIvUABISakLCJQBcks7SclB30AAaDm46viD0WJre3mZAV9AEIgZyNrop7FimKkY+FGhQZY39vfWkpHx5bYmFXQS0mOmFubm9TJikodIOSlVgbFyR2mLOxdh0LF2ORvMeCJQAAZJC+0n0hAABbkLzOfywAAGCMu8t7JgAAX4u5xnUhAABkhLfAdBwAAGaBs7puGAAAaX+wrWwVAABue6yoaRIAAHF5qKRnEQAAdXenjWMQAAB4d6aIXw4AAHt3pIRdCwAAfHajgVoJAAB+dqF+WAgAAH93oHtWBwAAf3efd1QGAAB/d593UwYAAH93n3dTBgAAf3efd1MGAAB/d593UwYAAH93n3dTBgAAf3efd1MGAAB/d593UwYAAH93n3dTBg==',
  ORDER_READY: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2+teRx4GML+v0dR8Nwd4pr/YeT0AAACQo6e+cTkWKHJ2rPONPhYAaJyzveZ8NAgAcoq42epnGABul6S5vncRAABniqm+nnU3Hn+n0NCGOh0Af6DIyGklBi+Xr8KTPAAAfZCpw5w3FRdvoNTSkDoLAGeBqL+KOxELeJnM0HwnBACCj6i4kToYDnh9rMZ+JgAAe5Gjtq5sIxJyg7fViSsAAHKIpbOaZSESc4W5xnkdAAB0i6O4l1okFHiHu8NuFgAAd42gupVWJBZ7ir67aRAAAHqPnLqVUyMWfYu8t2MLAACAkJq5lVAdF4GNu7FfBwAAg5GXuJVMHhmElLevUwMAAIaSlraTSxsajJq2qkr+/wCJk5SzkkodHJGftatA+v4AipSTsZBHHB6Xo7OlOPj/AImVk7KPRRoeo6mtnjD3AAKHl5KxjEQZIKqtppkq9gAEhZiRsItCGCKxsKGUIvUABISakLCJQBcks7SclB30AAaDm46viD0WJre3mZAV9AEIgZyNrop7FimKkY+FGhQZY39vfWkpHx5bYmFXQS0mOmFubm9TJikodIOSlVgbFyR2mLOxdh0LF2ORvMeCJQAAZJC+0n0hAABbkLzOfywAAGCMu8t7JgAAX4u5xnUhAABkhLfAdBwAAGaBs7puGAAAaX+wrWwVAABue6yoaRIAAHF5qKRnEQAAdXenjWMQAAB4d6aIXw4AAHt3pIRdCwAAfHajgVoJAAB+dqF+WAgAAH93oHtWBwAAf3efd1QGAAB/d593UwYAAH93n3dTBgAAf3efd1MGAAB/d593UwYAAH93n3dTBgAAf3efd1MGAAB/d593UwYAAH93n3dTBg==',
};

export default useSound;
