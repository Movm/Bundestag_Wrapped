import { motion } from 'motion/react';
import {
  spiritAnimalDistribution,
  slidesOverview,
} from './data';
import { InfoIcon } from './ui';
import { SpiritAnimalQuiz } from './SpiritAnimalQuiz';

export function SpeakerWrappedSection() {
  return (
    <section className="border-t border-stone-200 bg-white" id="speaker-wrapped">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.98, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-4">
            Individual Wrapped
          </h2>
          <h3 className="text-2xl font-serif text-stone-900 mb-6">
            Personalisierte Abgeordneten-Statistiken
          </h3>
          <p className="text-stone-600 leading-relaxed mb-8">
            Jeder Abgeordnete erhält unter <code className="px-1.5 py-0.5 bg-stone-100 rounded text-xs">/wrapped/[slug]</code> eine
            personalisierte "Bundestag Wrapped"-Erfahrung mit Statistiken, Rankings, Signature Words und einem Spirit Animal.
          </p>
        </motion.div>

        {/* Slides Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-stone-900 mb-4">Die 6 Slides</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {slidesOverview.map((slide) => (
              <div key={slide.num} className="flex items-center gap-3 bg-stone-50 rounded-lg p-3">
                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-mono">
                  {slide.num}
                </div>
                <div>
                  <span className="font-medium text-stone-900 text-sm">{slide.name}</span>
                  <span className="text-stone-500 text-sm ml-2">– {slide.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Spirit Animal Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.01, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-stone-900 mb-2">Welches Bundestag-Tier bist du?</h4>
          <p className="text-sm text-stone-600 mb-4">
            Beantworte 4 kurze Fragen und finde heraus, welches Spirit Animal du im Bundestag wärst!
          </p>
          <SpiritAnimalQuiz />
        </motion.div>

        {/* Spirit Animals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.02, duration: 0.6 }}
          className="mb-12"
        >
          <h4 className="font-medium text-stone-900 mb-2">Spirit Animals</h4>
          <p className="text-sm text-stone-600 mb-6">
            Jeder Abgeordnete erhält ein "Bundestag-Tier" basierend auf dem Redeverhalten.
            Alle Charakterisierungen sind <strong>positiv</strong>.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-800">
              <InfoIcon />
              <span className="text-sm font-medium">AfD-Abgeordnete erhalten keine Spirit Animals.</span>
            </div>
          </div>

          {/* Distribution */}
          <h5 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-3">
            Verteilung
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {spiritAnimalDistribution.map((item) => (
              <div key={item.name} className="bg-stone-50 rounded-lg p-3 text-center">
                <div className="text-2xl">{item.emoji}</div>
                <div className="text-sm font-medium text-stone-900">{item.name}</div>
                <div className="text-xs text-stone-500">{item.pct}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
