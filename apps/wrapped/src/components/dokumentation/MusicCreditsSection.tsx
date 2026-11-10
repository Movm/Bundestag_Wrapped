import { motion } from 'motion/react';
import { Music } from 'lucide-react';
import { EDITION_MUSIC, THEME_IDS, TRACKS, type ThemeType } from '@/shared/theme-music';

/** Every track with the editions that play it (music.json, otherwise the 2025 mapping). */
const editionsByTrack = new Map<ThemeType, string[]>();
for (const [editionId, music] of Object.entries(EDITION_MUSIC).sort()) {
  for (const track of new Set<ThemeType>([music.default, ...Object.values(music.sections)])) {
    editionsByTrack.set(track, [...(editionsByTrack.get(track) ?? []), editionId]);
  }
}
const tracks = THEME_IDS.map(id => ({ id, ...TRACKS[id], editions: editionsByTrack.get(id) ?? ['2025'] }));

export function MusicCreditsSection() {
  return (
    <section className="border-t border-stone-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          <h2 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-4">
            Musik-Credits
          </h2>
          <h3 className="text-2xl font-serif text-stone-900 mb-6">
            Hintergrundmusik
          </h3>

          <div className="bg-stone-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-stone-600 leading-relaxed">
              Alle Musiktitel stehen unter Creative-Commons-Lizenzen. Lizenz und Quelle stehen bei jedem Titel; wir spielen jeweils einen Ausschnitt.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 pr-4 font-medium text-stone-500">Titel</th>
                  <th className="text-left py-2 pr-4 font-medium text-stone-500">Künstler</th>
                  <th className="text-left py-2 pr-4 font-medium text-stone-500">Lizenz</th>
                  <th className="text-left py-2 font-medium text-stone-500">Ausgabe</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map(track => (
                  <tr key={track.id} className="border-b border-stone-100">
                    <td className="py-2 pr-4 text-stone-900 flex items-center gap-2">
                      <Music size={14} className="text-pink-400 flex-shrink-0" />
                      {track.title}
                    </td>
                    <td className="py-2 pr-4 text-stone-600">
                      {track.artist}
                      {'source' in track && <> · <a href={track.source.url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 underline">{track.source.name}</a></>}
                    </td>
                    <td className="py-2 pr-4">
                      <a href={track.license.url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 underline whitespace-nowrap">{track.license.name}</a>
                    </td>
                    <td className="py-2 text-stone-500">{track.editions.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          <h3 className="text-2xl font-serif text-stone-900 mt-12 mb-6">
            Soundeffekte
          </h3>

          <div className="bg-stone-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-stone-600 leading-relaxed">
              Die Soundeffekte stammen von{' '}
              <a
                href="https://freesound.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-700 underline"
              >
                Freesound.org
              </a>
              .
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-pink-400">•</span>
              <div>
                <a
                  href="https://freesound.org/people/nckn/sounds/256112/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 underline"
                >
                  pleasant-done-notification.wav
                </a>{' '}
                <span className="text-stone-600">
                  von{' '}
                  <a
                    href="https://freesound.org/people/nckn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 underline"
                  >
                    nckn
                  </a>{' '}
                  – Lizenz:{' '}
                  <a
                    href="https://creativecommons.org/licenses/by-nc/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 underline"
                  >
                    CC BY-NC 4.0
                  </a>
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-400">•</span>
              <div>
                <a
                  href="https://freesound.org/people/The-Sacha-Rush/sounds/472506/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 underline"
                >
                  appearance-effect.wav
                </a>{' '}
                <span className="text-stone-600">
                  von{' '}
                  <a
                    href="https://freesound.org/people/The-Sacha-Rush/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 underline"
                  >
                    The-Sacha-Rush
                  </a>{' '}
                  – Lizenz:{' '}
                  <a
                    href="https://creativecommons.org/publicdomain/zero/1.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 underline"
                  >
                    CC0 1.0
                  </a>
                </span>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
