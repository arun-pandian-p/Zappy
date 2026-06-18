type Priority = "low" | "medium" | "high";

interface QueueItem<T = any> {
  id: string;
  priority: Priority;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  feature: string;
  timestamp: number;
}

class AIQueueService {
  private queues: Map<Priority, QueueItem[]> = new Map([
    ["high", []],
    ["medium", []],
    ["low", []],
  ]);
  private processing = false;
  private concurrency = 2;
  private activeCount = 0;

  enqueue<T>(
    feature: string,
    execute: () => Promise<T>,
    priority: Priority = "medium"
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        id: `${feature}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        priority,
        execute,
        resolve,
        reject,
        feature,
        timestamp: Date.now(),
      };
      this.queues.get(priority)!.push(item);
      this.process();
    });
  }

  private process() {
    if (this.processing) return;
    this.processing = true;
    const tick = () => {
      if (this.activeCount >= this.concurrency) return;
      const item = this.dequeue();
      if (!item) {
        this.processing = false;
        return;
      }
      this.activeCount++;
      item.execute().then(item.resolve).catch(item.reject).finally(() => {
        this.activeCount--;
        tick();
      });
      tick();
    };
    tick();
  }

  private dequeue(): QueueItem | undefined {
    for (const priority of ["high", "medium", "low"] as Priority[]) {
      const q = this.queues.get(priority)!;
      if (q.length > 0) return q.shift();
    }
  }

  get queueLength(): number {
    return [...this.queues.values()].reduce((sum, q) => sum + q.length, 0);
  }

  get activeRequests(): number {
    return this.activeCount;
  }
}

export const aiQueue = new AIQueueService();
