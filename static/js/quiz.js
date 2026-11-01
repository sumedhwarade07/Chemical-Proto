/**
 * Quiz and FAQ Interactive Runner
 * Strictly loads sanitized questions from /api/quiz (no answers in payload)
 * Validates responses securely against /api/score
 */

document.addEventListener('DOMContentLoaded', () => {
  initQuiz();
  initFaqAccordion();
});

function initQuiz() {
  const container = document.getElementById('quiz-container');
  const activeView = document.getElementById('quiz-active-view');
  const scoreView = document.getElementById('quiz-score-view');
  const counterEl = document.getElementById('quiz-counter');
  const questionTitle = document.getElementById('quiz-question-text');
  const optionsContainer = document.getElementById('quiz-options-container');
  const progressBar = document.getElementById('quiz-progress');
  const explanationBox = document.getElementById('quiz-explanation');
  const explanationHeader = document.getElementById('explanation-header');
  const explanationText = document.getElementById('explanation-text');
  const nextBtn = document.getElementById('quiz-next-btn');
  const retryBtn = document.getElementById('quiz-retry-btn');

  if (!container || !activeView) return;

  let questions = [];
  let currentIndex = 0;
  let userResponses = {}; // { q1: index, q2: index, ... }
  let userScore = 0;

  async function loadQuizData() {
    try {
      questionTitle.textContent = 'Loading questions from laboratory server...';
      const response = await fetch('/api/quiz');
      if (!response.ok) throw new Error('Failed to fetch quiz');
      const data = await response.json();
      questions = data.questions || [];

      if (questions.length === 0) {
        questionTitle.textContent = 'No questions available at this time.';
        return;
      }

      currentIndex = 0;
      userResponses = {};
      userScore = 0;
      renderQuestion();
    } catch (err) {
      questionTitle.textContent = 'Error connecting to quiz server. Please try refreshing.';
      console.error(err);
    }
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    if (!q) return;

    // Reset view states
    explanationBox.classList.remove('visible');
    nextBtn.disabled = true;

    // Counter & Progress
    const stepNum = currentIndex + 1;
    counterEl.textContent = `Question ${stepNum < 10 ? '0' : ''}${stepNum} / ${questions.length}`;
    progressBar.style.width = `${((currentIndex) / questions.length) * 100}%`;

    questionTitle.textContent = q.q;
    optionsContainer.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.dataset.index = idx;
      btn.innerHTML = `
        <span class="quiz-option-letter">${letters[idx] || (idx + 1)}</span>
        <span>${optText}</span>
      `;

      btn.addEventListener('click', () => handleOptionSelect(q.id, idx, btn));
      optionsContainer.appendChild(btn);
    });

    if (currentIndex === questions.length - 1) {
      nextBtn.textContent = 'Complete & View Score';
    } else {
      nextBtn.textContent = 'Next Question →';
    }
  }

  async function handleOptionSelect(qId, selectedIdx, clickedBtn) {
    // Disable all options once clicked
    const allBtns = optionsContainer.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);
    clickedBtn.classList.add('selected');

    userResponses[qId] = selectedIdx;

    // Securely query /api/score for this question
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { [qId]: selectedIdx } })
      });
      const data = await res.json();
      const qResult = data.results && data.results.find(r => r.id === qId);

      if (qResult) {
        if (qResult.correct) {
          clickedBtn.classList.add('correct');
          explanationHeader.textContent = '✓ Correct Answer!';
          explanationHeader.style.color = 'var(--success)';
        } else {
          clickedBtn.classList.add('incorrect');
          explanationHeader.textContent = `✗ Incorrect. Correct: ${qResult.correct_option}`;
          explanationHeader.style.color = 'var(--alert)';

          // Highlight correct button
          allBtns.forEach(b => {
            if (parseInt(b.dataset.index, 10) === qResult.correct_index) {
              b.classList.add('correct');
            }
          });
        }

        explanationText.textContent = qResult.explanation;
        explanationBox.classList.add('visible');
      }
    } catch (e) {
      console.error('Error verifying answer with server:', e);
    }

    nextBtn.disabled = false;
  }

  nextBtn.addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  });

  async function finishQuiz() {
    progressBar.style.width = '100%';
    try {
      // Final comprehensive score verification from server
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userResponses })
      });
      const data = await res.json();

      activeView.style.display = 'none';
      scoreView.classList.add('visible');

      const score = data.score || 0;
      const total = data.total || questions.length;
      const percentage = data.percentage || 0;

      document.getElementById('final-score-val').textContent = score;

      const ratingEl = document.getElementById('final-score-rating');
      const msgEl = document.getElementById('final-score-message');

      if (percentage >= 90) {
        ratingEl.textContent = '🏆 Outstanding Lab Mastery!';
        msgEl.textContent = `Exemplary performance! You scored ${percentage}% (${score}/${total}). You have thoroughly grasped all liquid detergent synthesis and safety principles.`;
      } else if (percentage >= 70) {
        ratingEl.textContent = '✨ Great Laboratory Knowledge!';
        msgEl.textContent = `Good job! You scored ${percentage}% (${score}/${total}). You have a solid grasp of builders, hydrotropes, and neutralization.`;
      } else {
        ratingEl.textContent = '🧪 Chemistry Review Recommended';
        msgEl.textContent = `You scored ${percentage}% (${score}/${total}). We recommend reviewing the Ingredients and Process scenes before attempting again.`;
      }
    } catch (e) {
      console.error('Failed to submit final score:', e);
    }
  }

  retryBtn?.addEventListener('click', () => {
    scoreView.classList.remove('visible');
    activeView.style.display = 'block';
    loadQuizData();
  });

  loadQuizData();
}

function initFaqAccordion() {
  const items = document.querySelectorAll('#faq-container .faq-item');

  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const body = item.querySelector('.faq-body');

    trigger?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close other open accordions for tidy view
      items.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          other.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
          const otherBody = other.querySelector('.faq-body');
          if (otherBody) otherBody.style.maxHeight = null;
        }
      });

      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = `${body.scrollHeight + 30}px`;
      } else {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        body.style.maxHeight = null;
      }
    });
  });
}
