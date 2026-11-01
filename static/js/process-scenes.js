/**
 * Process Scenes & Interactive Filling Beaker Controller
 * Handles 7-step scroll observation, stepper clicks, keyboard navigation,
 * media view toggling (GIF vs Schematic), Replay, Auto-Tour mode,
 * and the signature filling beaker liquid & color shift.
 */

document.addEventListener('DOMContentLoaded', () => {
  const scenes = document.querySelectorAll('.scene-block');
  const beakerFill = document.getElementById('beaker-liquid-fill');
  const beakerPercent = document.getElementById('beaker-percent-text');
  const beakerStageText = document.getElementById('beaker-stage-text');
  const dots = document.querySelectorAll('.step-dot');
  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');
  const playAllBtn = document.getElementById('play-all-btn');
  const playAllIcon = document.getElementById('play-all-icon');
  const playAllText = document.getElementById('play-all-text');
  const replayBtns = document.querySelectorAll('.replay-btn');
  const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');

  if (!scenes.length) return;

  let currentStepIndex = 1;
  const totalSteps = scenes.length;
  let autoTourInterval = null;
  let isAutoTourRunning = false;

  const stageNames = [
    "Stage 1: Measuring Ingredients",
    "Stage 2: Distilled H₂O Solvation",
    "Stage 3: Continuous Vortex Mixing",
    "Stage 4: Controlled Heating (50°C)",
    "Stage 5: Stabilization & Cooling",
    "Stage 6: Gravity Paper Filtration",
    "Stage 7: Finished Product Bottling"
  ];

  // Gradients for beaker filling: clear solvent -> intermediate mixing -> concentrated turquoise detergent
  const beakerTints = [
    "linear-gradient(180deg, rgba(235, 250, 252, 0.6) 0%, rgba(180, 235, 242, 0.7) 100%)", // Step 1: Clear
    "linear-gradient(180deg, rgba(200, 245, 250, 0.7) 0%, rgba(120, 220, 235, 0.75) 100%)", // Step 2: Solvation
    "linear-gradient(180deg, rgba(140, 230, 245, 0.75) 0%, rgba(62, 193, 211, 0.8) 100%)",  // Step 3: Mixing
    "linear-gradient(180deg, rgba(100, 215, 235, 0.8) 0%, rgba(35, 160, 185, 0.85) 100%)", // Step 4: Heating
    "linear-gradient(180deg, rgba(70, 200, 225, 0.85) 0%, rgba(20, 120, 145, 0.9) 100%)",   // Step 5: Cooling
    "linear-gradient(180deg, rgba(62, 193, 211, 0.9) 0%, rgba(15, 76, 92, 0.92) 100%)",    // Step 6: Clarified
    "linear-gradient(180deg, #3ec1d3 0%, #0f4c5c 100%)"                                      // Step 7: Final
  ];

  function updateBeaker(stepNum) {
    currentStepIndex = stepNum;
    const progressPercent = Math.round((stepNum / totalSteps) * 100);

    if (beakerFill) {
      beakerFill.style.height = `${progressPercent}%`;
      beakerFill.style.background = beakerTints[stepNum - 1] || beakerTints[0];
    }
    if (beakerPercent) {
      beakerPercent.textContent = `${progressPercent}%`;
    }
    if (beakerStageText) {
      beakerStageText.textContent = stageNames[stepNum - 1] || `Stage ${stepNum}`;
    }

    // Update dots
    dots.forEach(dot => {
      const dotStep = parseInt(dot.dataset.step, 10);
      dot.classList.toggle('active', dotStep === stepNum);
    });

    // Update scenes active class
    scenes.forEach(scene => {
      const sId = parseInt(scene.dataset.step, 10);
      scene.classList.toggle('active', sId === stepNum);
    });

    // Update stepper button states
    if (prevBtn) prevBtn.disabled = (stepNum === 1);
    if (nextBtn) nextBtn.disabled = (stepNum === totalSteps);
  }

  function scrollToStep(stepNum) {
    const targetScene = document.getElementById(`scene-step-${stepNum}`);
    if (targetScene) {
      const yOffset = -90; // sticky header buffer
      const y = targetScene.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    updateBeaker(stepNum);
  }

  // IntersectionObserver to sync beaker with scroll position
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stepNum = parseInt(entry.target.dataset.step, 10);
        updateBeaker(stepNum);
      }
    });
  }, {
    threshold: 0.45,
    rootMargin: "-10% 0px -20% 0px"
  });

  scenes.forEach(scene => observer.observe(scene));

  // Stepper controls
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopAutoTour();
      if (currentStepIndex > 1) {
        scrollToStep(currentStepIndex - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopAutoTour();
      if (currentStepIndex < totalSteps) {
        scrollToStep(currentStepIndex + 1);
      }
    });
  }

  // Dots controls
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoTour();
      const s = parseInt(dot.dataset.step, 10);
      scrollToStep(s);
    });
  });

  // Keyboard navigation (Left/Right arrows, PageUp/PageDown)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentStepIndex < totalSteps) {
        e.preventDefault();
        stopAutoTour();
        scrollToStep(currentStepIndex + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentStepIndex > 1) {
        e.preventDefault();
        stopAutoTour();
        scrollToStep(currentStepIndex - 1);
      }
    }
  });

  // Replay buttons: cleanly reload the animation for that stage
  replayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const gifImg = document.getElementById(`process-img-${targetId}`);
      if (gifImg) {
        const originalSrc = gifImg.src.split('?')[0];
        gifImg.src = `${originalSrc}?t=${Date.now()}`;
      }

      const canvasWrapper = document.getElementById(`schematic-view-${targetId}`);
      if (canvasWrapper) {
        const svg = canvasWrapper.querySelector('svg');
        if (svg) {
          const clone = svg.cloneNode(true);
          svg.replaceWith(clone);
        }
      }
    });
  });

  // View Mode Switcher: GIF Animation vs Schematic SVG
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const viewType = btn.dataset.view;
      const parentScene = document.getElementById(`scene-step-${targetId}`);

      if (!parentScene) return;

      // Update button active state
      parentScene.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const gifView = document.getElementById(`gif-view-${targetId}`);
      const schematicView = document.getElementById(`schematic-view-${targetId}`);

      if (viewType === 'gif') {
        if (gifView) gifView.style.display = 'block';
        if (schematicView) schematicView.style.display = 'none';
      } else {
        if (gifView) gifView.style.display = 'none';
        if (schematicView) schematicView.style.display = 'block';
      }
    });
  });

  // Auto Tour / Play All Controller
  function startAutoTour() {
    isAutoTourRunning = true;
    if (playAllBtn) playAllBtn.classList.add('tour-active');
    if (playAllIcon) playAllIcon.textContent = '⏸';
    if (playAllText) playAllText.textContent = 'Pause Tour';

    if (currentStepIndex >= totalSteps) {
      currentStepIndex = 1;
      scrollToStep(1);
    }

    autoTourInterval = setInterval(() => {
      if (currentStepIndex < totalSteps) {
        scrollToStep(currentStepIndex + 1);
      } else {
        stopAutoTour();
      }
    }, 4000); // 4 seconds per stage
  }

  function stopAutoTour() {
    if (autoTourInterval) {
      clearInterval(autoTourInterval);
      autoTourInterval = null;
    }
    isAutoTourRunning = false;
    if (playAllBtn) playAllBtn.classList.remove('tour-active');
    if (playAllIcon) playAllIcon.textContent = '▶';
    if (playAllText) playAllText.textContent = 'Auto Tour';
  }

  if (playAllBtn) {
    playAllBtn.addEventListener('click', () => {
      if (isAutoTourRunning) {
        stopAutoTour();
      } else {
        startAutoTour();
      }
    });
  }

  // Initial setup
  updateBeaker(1);
});
