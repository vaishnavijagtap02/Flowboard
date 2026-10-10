// src/lib/serverTiming.ts
// W3C Server-Timing standard header generator for backend observability and APM profiling.

export class ServerTiming {
  private timings: Array<{ name: string; duration: number; description?: string }> = [];
  private startTimes: Map<string, number> = new Map();

  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  stop(name: string, description?: string): number {
    const start = this.startTimes.get(name);
    if (start === undefined) return 0;
    const duration = Math.max(0, performance.now() - start);
    this.timings.push({ name, duration: Math.round(duration * 100) / 100, description });
    this.startTimes.delete(name);
    return duration;
  }

  add(name: string, durationMs: number, description?: string): void {
    this.timings.push({ name, duration: Math.round(durationMs * 100) / 100, description });
  }

  getHeaderValue(): string {
    return this.timings
      .map((t) => {
        let entry = `${t.name};dur=${t.duration.toFixed(2)}`;
        if (t.description) entry += `;desc="${t.description.replace(/"/g, "'")}"`;
        return entry;
      })
      .join(", ");
  }

  applyToHeaders(headers: Headers): void {
    const val = this.getHeaderValue();
    if (val) {
      headers.set("Server-Timing", val);
    }
  }
}
