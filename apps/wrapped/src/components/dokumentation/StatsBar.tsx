import { motion } from 'motion/react';
import type { DocumentationStat } from './data';

export function StatsBar({ stats }: { stats: DocumentationStat[] }) {
  if (stats.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="border-y border-stone-200 bg-white"
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-light text-stone-900 font-mono">
                {stat.value}
              </div>
              <div className="text-sm text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
