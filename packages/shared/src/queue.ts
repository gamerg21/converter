export type QueueJobPayload = {
  jobId: string;
  organizationId: string;
  inputFileId: string;
  sourceFormat: string;
  targetFormat: string;
};

type Listener = (payload: QueueJobPayload) => Promise<void> | void;

class InMemoryQueue {
  private listeners: Listener[] = [];
  private backlog: QueueJobPayload[] = [];

  subscribe(listener: Listener): void {
    this.listeners.push(listener);
    this.flush().catch((error) => console.error("Queue flush error", error));
  }

  async publish(payload: QueueJobPayload): Promise<void> {
    this.backlog.push(payload);
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (!this.listeners.length) return;
    while (this.backlog.length) {
      const payload = this.backlog.shift();
      if (!payload) return;
      await Promise.all(this.listeners.map((listener) => listener(payload)));
    }
  }
}

export const conversionQueue = new InMemoryQueue();
