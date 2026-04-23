'use client';
import { useEffect, useRef, useState } from 'react';

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

interface StatConfig {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
  separator?: string;
}

const stats: StatConfig[] = [
  { target: 2400, suffix: '+', label: "ZZP'ers", separator: '.' },
  { target: 1.2, prefix: '€', suffix: 'M+', label: 'gefactureerd', decimals: 1 },
  { target: 12000, suffix: '+', label: 'uren geregistreerd', separator: '.' },
  { target: 98, suffix: '%', label: 'tevredenheid' },
];

function formatNumber(value: number, config: StatConfig): string {
  const { prefix = '', suffix = '', decimals = 0, separator } = config;

  let formatted: string;
  if (decimals > 0) {
    formatted = value.toFixed(decimals).replace('.', ',');
  } else {
    const rounded = Math.round(value);
    if (separator) {
      formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    } else {
      formatted = rounded.toString();
    }
  }

  return `${prefix}${formatted}${suffix}`;
}

function AnimatedCounter({ config }: { config: StatConfig }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2000;
          const start = performance.now();

          function animate(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);
            setDisplayValue(eased * config.target);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated, config.target]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-bold tracking-tight">
        {formatNumber(displayValue, config)}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
    </div>
  );
}

export default function StatCounters() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto mt-16">
      {stats.map((stat) => (
        <AnimatedCounter key={stat.label} config={stat} />
      ))}
    </div>
  );
}
