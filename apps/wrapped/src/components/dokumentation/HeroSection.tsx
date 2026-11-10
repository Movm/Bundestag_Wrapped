import { motion } from 'motion/react';

export function HeroSection({ wahlperioden }: { wahlperioden?: number[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto px-6 pt-16 pb-12"
    >
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="ds-eyebrow ds-eyebrow--contrast">
          Algorithmus
        </span>
        <span className="text-on-muted">•</span>
        {wahlperioden && wahlperioden.length > 0 && (
          <span className="text-on-muted text-sm">Wahlperiode {wahlperioden.join(', ')}</span>
        )}
      </div>
      <h1 className="ds-display ds-display--lg mb-6">
        Klassifikation von<br />
        <span className="text-display-accent break-words">Bundestagsreden</span>
      </h1>
      <p className="text-lg text-on-muted leading-relaxed max-w-[65ch]">
        Dokumentation des Algorithmus zur automatischen Kategorisierung
        parlamentarischer Beiträge aus den Plenarprotokollen des Deutschen Bundestages.
      </p>
    </motion.section>
  );
}
