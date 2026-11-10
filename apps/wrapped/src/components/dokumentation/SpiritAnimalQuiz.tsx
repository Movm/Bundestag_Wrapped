import { useState } from 'react';
import { motion } from 'motion/react';
import { quizQuestions, calculateAnimal, type QuizResult } from './data';

export function SpiritAnimalQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleAnswer = (value: string) => {
    const question = quizQuestions[currentQuestion];
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setResult(calculateAnimal(newAnswers));
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-wr-card border border-track rounded-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-7xl mb-4"
        >
          {result.emoji}
        </motion.div>
        <h4 className="text-2xl font-bold text-on mb-1">{result.name}</h4>
        <p className="text-on-accent font-medium mb-4">{result.title}</p>
        <p className="text-on-muted mb-6">{result.reason}</p>
        <button
          onClick={resetQuiz}
          className="px-4 py-2 bg-wr-pink hover:bg-wr-pink text-wr-ink rounded-lg text-sm font-medium transition-colors"
        >
          Nochmal spielen
        </button>
      </motion.div>
    );
  }

  const question = quizQuestions[currentQuestion];

  return (
    <div className="bg-wr-card border border-track rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-on-muted">
          Frage {currentQuestion + 1} von {quizQuestions.length}
        </span>
        <div className="flex gap-1">
          {quizQuestions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i <= currentQuestion ? 'bg-wr-pink' : 'bg-wr-card'}`}
            />
          ))}
        </div>
      </div>
      <h4 className="text-lg font-medium text-on mb-4">{question.question}</h4>
      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleAnswer(option.value)}
            className="w-full text-left px-4 py-3 bg-wr-card border border-track rounded-lg hover:border-wr-pink hover:bg-bg-elevated transition-colors text-sm text-on-muted"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
