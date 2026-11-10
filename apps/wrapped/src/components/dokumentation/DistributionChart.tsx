import { motion } from 'motion/react';
import { categories } from './data';

const TOTAL_BEITRAEGE = 4798;

export function DistributionChart() {
  return (
    <section className="border-t border-track">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-on-muted uppercase tracking-wider mb-4">
            Verteilung
          </h2>
          <h3 className="text-2xl font-heading text-on mb-8">
            Anteile der Kategorien
          </h3>
        </motion.div>

        <div className="space-y-3">
          {categories.map((cat, index) => {
            const percentage = (cat.count / TOTAL_BEITRAEGE) * 100;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="w-32 text-sm text-on-muted text-right">
                  {cat.name}
                </div>
                <div className="flex-1 h-8 bg-wr-card rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
                <div className="w-20 text-sm font-mono text-on-muted text-right">
                  {percentage.toFixed(1)}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
