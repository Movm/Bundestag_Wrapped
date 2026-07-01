import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

export function ComingSoonSection() {
  return (
    <section className="border-t border-stone-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-2xl font-serif text-stone-900 mb-3">
            Mehr kommt bald
          </h2>
          <p className="text-stone-600 max-w-md leading-relaxed">
            Die ausführliche Dokumentation zur Methodik, Datenverarbeitung und
            technischen Umsetzung wird in Kürze hier veröffentlicht.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
