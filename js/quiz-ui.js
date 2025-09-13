
const startScreen = document.getElementById('start-screen');
const quizContainer = document.getElementById('quiz-container');
const resultsScreen = document.getElementById('results-screen');
const reviewScreen = document.getElementById('review-screen');
const startButton = document.getElementById('start-new-btn');
const resumeButton = document.getElementById('resume-btn');
const quizHomeButton = document.getElementById('quiz-home-btn');
const retakeButton = document.getElementById('retake-btn');
const submitButton = document.getElementById('submit-btn');
const reviewIncorrectButton = document.getElementById('review-incorrect-btn');
const backToResultsButton = document.getElementById('back-to-results-btn');
const homeButton = document.getElementById('home-btn');

const questionContainer = document.getElementById('question-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const feedbackContainer = document.getElementById('feedback');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');

const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('quiz-total-questions');
const progressBar = document.getElementById('progress');
const timerElement = document.getElementById('timer');

const finalScoreElement = document.getElementById('final-score');
const finalTimeElement = document.getElementById('final-time');
const correctCountElement = document.getElementById('correct-count');
const incorrectCountElement = document.getElementById('incorrect-count');
const percentageElement = document.getElementById('percentage');

const pauseButton = document.getElementById('pause-btn');

// Quiz variables
let currentQuestionIndex = 0;
let shuffledQuizData = [];
let selectedAnswers = [];
let answeredQuestions = [];
let score = 0;
let incorrectAnswers = [];
let quizSaved = false;

// Timer variables
let timerInterval;
let seconds = 0;
let minutes = 0;
let hours = 0;

// Pause variable
let isPaused = false;

// UI Functions
function showStartScreen() {
    startScreen.style.display = 'block';
    quizContainer.style.display = 'none';
    resultsScreen.style.display = 'none';
    reviewScreen.style.display = 'none';
}

function showQuizScreen() {
    startScreen.style.display = 'none';
    quizContainer.style.display = 'block';
    resultsScreen.style.display = 'none';
    reviewScreen.style.display = 'none';

    // Start the timer
    startTimer();
}

function showResultsScreen() {
    startScreen.style.display = 'none';
    quizContainer.style.display = 'none';
    resultsScreen.style.display = 'block';
    reviewScreen.style.display = 'none';

    // Stop the timer
    stopTimer();

    // Calculate results - count answered questions and use existing score
    const answeredCount = answeredQuestions.filter(answered => answered).length;
    const correct = score;
    const incorrect = answeredCount - correct;
    const unanswered = shuffledQuizData.length - answeredCount;
    
    // Recalculate incorrectAnswers based on current state
    incorrectAnswers = [];
    for (let i = 0; i < answeredQuestions.length; i++) {
        if (answeredQuestions[i]) {
            const question = shuffledQuizData[i];
            const isMultiSelect = Array.isArray(question.rightAnswer);
            let isIncorrect = false;

            if (isMultiSelect) {
                if (selectedAnswers[i] && Array.isArray(selectedAnswers[i])) {
                    const selectedOptions = selectedAnswers[i].map(index => question.options[index]);
                    const allCorrectSelected = question.rightAnswer.every(correctOpt =>
                        selectedOptions.includes(correctOpt));
                    const noIncorrectSelected = selectedOptions.every(selectedOpt =>
                        question.rightAnswer.includes(selectedOpt));
                    isIncorrect = !(allCorrectSelected && noIncorrectSelected);
                } else {
                    isIncorrect = true; // No selection means incorrect
                }
            } else {
                isIncorrect = selectedAnswers[i] === null ||
                    question.options[selectedAnswers[i]] !== question.rightAnswer;
            }

            if (isIncorrect) {
                incorrectAnswers.push({
                    questionIndex: i,
                    question: question,
                    selectedAnswer: isMultiSelect ? 
                        (selectedAnswers[i] && Array.isArray(selectedAnswers[i]) ? 
                            selectedAnswers[i].map(index => question.options[index]) : []) : 
                        (selectedAnswers[i] !== null ? question.options[selectedAnswers[i]] : null),
                    correctAnswer: question.rightAnswer
                });
            }
        }
    }

    const total = shuffledQuizData.length;
    const percentage = Math.round((correct / total) * 100);

    // Update results display
    finalScoreElement.textContent = `${correct}/${total}`;
    finalTimeElement.textContent = timerElement.textContent;
    document.getElementById('attempted-count').textContent = `Attempted: ${answeredCount}`;
    correctCountElement.textContent = `Correct Answers: ${correct}`;
    incorrectCountElement.textContent = `Incorrect Answers: ${incorrect}`;
    document.getElementById('unattempted-count').textContent = `Unattempted: ${unanswered}`;
    percentageElement.textContent = `Percentage: ${percentage}%`;
    
    // Draw pie chart
    drawPieChart(correct, incorrect, unanswered);
    
    // Update legend
    updateChartLegend(correct, incorrect, unanswered, total);
    
    // Save quiz statistics - only save once per quiz completion
    if (quizSaved) {
        console.log('Quiz already saved, skipping duplicate');
        return;
    }
    
    const stats = JSON.parse(localStorage.getItem('aws-quiz-stats') || '{}');
    
    stats.attempts = (stats.attempts || 0) + 1;
    stats.bestScore = Math.max(stats.bestScore || 0, correct);
    const now = new Date();
    stats.lastAttempt = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    quizSaved = true;
    
    // Add to history
    if (!stats.history) stats.history = [];
    const currentPercentage = Math.round((correct / total) * 100);
    stats.history.push({
        date: stats.lastAttempt,
        score: correct,
        total: total,
        percentage: currentPercentage
    });
    
    localStorage.setItem('aws-quiz-stats', JSON.stringify(stats));
    console.log('Saved stats:', stats);
}

function initQuiz() {
    // Check for saved progress
    const savedProgress = localStorage.getItem('aws-quiz-progress');
    if (savedProgress && confirm('Resume previous quiz session?')) {
        const progress = JSON.parse(savedProgress);
        currentQuestionIndex = progress.currentQuestionIndex || 0;
        selectedAnswers = progress.selectedAnswers || [];
        answeredQuestions = progress.answeredQuestions || [];
        score = progress.score || 0;
        seconds = progress.seconds || 0;
        minutes = progress.minutes || 0;
        hours = progress.hours || 0;
        incorrectAnswers = [];
        
        // Use saved shuffled data to maintain question order
        shuffledQuizData = progress.shuffledQuizData || [];
        
        console.log('Resumed - Score:', score, 'Answered:', answeredQuestions.filter(a => a).length);
    } else {
        // Reset variables
        currentQuestionIndex = 0;
        selectedAnswers = [];
        answeredQuestions = [];
        score = 0;
        incorrectAnswers = [];
        quizSaved = false;
        localStorage.removeItem('aws-quiz-progress');
        
        // Get quiz data and shuffle only for new quiz
        if (typeof quizData !== 'undefined') {
            // Clone the quiz data
            shuffledQuizData = JSON.parse(JSON.stringify(quizData));
            // Shuffle the quiz data
            shuffleArray(shuffledQuizData);
        } else {
            console.error('Quiz data not found! Make sure quiz-data.js is loaded.');
            return;
        }
    }

    // Initialize arrays only if not resuming
    if (selectedAnswers.length === 0) {
        for (let i = 0; i < shuffledQuizData.length; i++) {
            const isMultiSelect = Array.isArray(shuffledQuizData[i].rightAnswer);
            selectedAnswers.push(isMultiSelect ? [] : null);
            answeredQuestions.push(false);
        }
    } else {
        // Ensure arrays are the right length when resuming
        while (selectedAnswers.length < shuffledQuizData.length) {
            const isMultiSelect = Array.isArray(shuffledQuizData[selectedAnswers.length].rightAnswer);
            selectedAnswers.push(isMultiSelect ? [] : null);
            answeredQuestions.push(false);
        }
    }

    // Set total questions display
    if (totalQuestionsElement) {
        totalQuestionsElement.textContent = shuffledQuizData.length;
    }

    // Display current question (0 for new quiz, saved index for resumed quiz)
    displayQuestion(currentQuestionIndex);

    // Reset and show quiz container
    pauseButton.textContent = "⏸️";
    isPaused = false;
}

function displayQuestion(index) {
    const question = shuffledQuizData[index];

    // Update current question number
    if (currentQuestionElement) {
        currentQuestionElement.textContent = index + 1;
    }

    // Update progress bar
    if (progressBar) {
        progressBar.style.width = `${((index + 1) / shuffledQuizData.length) * 100}%`;
    }

    // Display question text with status indicator
    questionText.textContent = question.question;
    
    // Add status indicator
    const statusIndicator = document.createElement('span');
    statusIndicator.className = `question-status ${answeredQuestions[index] ? 'answered' : 'unanswered'}`;
    statusIndicator.title = answeredQuestions[index] ? 'Question answered' : 'Question not answered';
    questionText.appendChild(statusIndicator);

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Determine if this is a multi-select question
    const isMultiSelect = Array.isArray(question.rightAnswer);

    // Clear any existing multi-select indicator
    const existingIndicator = questionContainer.querySelector('.multi-select-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Add multi-select indicator if needed
    if (isMultiSelect) {
        const indicator = document.createElement('div');
        indicator.className = 'multi-select-indicator';
        questionContainer.appendChild(indicator);
    }

    // Display options
    question.options.forEach((option, optionIndex) => {
        const optionElement = document.createElement('li');
        optionElement.textContent = option;
        optionElement.className = 'option';

        // If this is a multi-select question, add checkbox indicator
        if (isMultiSelect) {
            // Initialize selectedAnswers[index] as array for multi-select questions
            if (!Array.isArray(selectedAnswers[index])) {
                selectedAnswers[index] = [];
            }

            // Add checkbox appearance
            if (!answeredQuestions[index]) {
                const checkbox = document.createElement('span');
                checkbox.className = 'checkbox';
                checkbox.innerHTML = selectedAnswers[index].includes(optionIndex) ? '☑' : '☐';
                optionElement.prepend(checkbox);
            }
        }

        // Check if this option was previously selected
        if (!isMultiSelect && selectedAnswers[index] === optionIndex) {
            optionElement.classList.add('selected');
        } else if (isMultiSelect && Array.isArray(selectedAnswers[index]) &&
            selectedAnswers[index].includes(optionIndex)) {
            optionElement.classList.add('selected');
        }

        // Only show indicators if question was actually submitted (not just selected)
        // For resumed quizzes, we need to check if the question was truly answered and submitted

        // Add event listener to option
        optionElement.addEventListener('click', () => {
            // If question already answered, don't allow changes
            if (answeredQuestions[index]) {
                return;
            }

            if (isMultiSelect) {
                // Toggle selection for multi-select
                if (selectedAnswers[index].includes(optionIndex)) {
                    // Remove from selection
                    selectedAnswers[index] = selectedAnswers[index].filter(i => i !== optionIndex);
                    optionElement.classList.remove('selected');

                    // Update checkbox
                    const checkbox = optionElement.querySelector('.checkbox');
                    if (checkbox) checkbox.innerHTML = '☐';
                } else {
                    // Add to selection
                    selectedAnswers[index].push(optionIndex);
                    optionElement.classList.add('selected');

                    // Update checkbox
                    const checkbox = optionElement.querySelector('.checkbox');
                    if (checkbox) checkbox.innerHTML = '☑';
                }
            } else {
                // Single select behavior - scope to current question only
                optionsContainer.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionElement.classList.add('selected');
                selectedAnswers[index] = optionIndex;
            }

            // Enable submit answer button if we have a selection
            const submitAnswerBtn = document.getElementById('submit-answer-btn');
            if (submitAnswerBtn) {
                submitAnswerBtn.disabled =
                    (isMultiSelect && selectedAnswers[index].length === 0) ||
                    (!isMultiSelect && selectedAnswers[index] === null);
            }
        });

        optionsContainer.appendChild(optionElement);
    });

    // Show feedback if question was answered and submitted
    if (answeredQuestions[index]) {
        showFeedback(index);
        
        // Show correct/incorrect indicators only for submitted questions
        setTimeout(() => {
            const options = optionsContainer.querySelectorAll('.option');
            options.forEach((opt, optIndex) => {
                if (isMultiSelect) {
                    if (question.rightAnswer.includes(question.options[optIndex])) {
                        opt.classList.add('correct');
                    } else if (selectedAnswers[index] && selectedAnswers[index].includes(optIndex)) {
                        opt.classList.add('incorrect');
                    }
                } else {
                    if (question.options[optIndex] === question.rightAnswer) {
                        opt.classList.add('correct');
                    } else if (selectedAnswers[index] === optIndex) {
                        opt.classList.add('incorrect');
                    }
                }
            });
        }, 0);
    } else {
        hideFeedback();

        const existingSubmitContainer = document.querySelector('.submit-answer-container');
        if (existingSubmitContainer) {
            existingSubmitContainer.remove();
        }

        // Add "submit answer" button for this question
        const submitAnswerContainer = document.createElement('div');
        submitAnswerContainer.className = 'submit-answer-container';

        const submitAnswerBtn = document.createElement('button');
        submitAnswerBtn.id = 'submit-answer-btn';
        submitAnswerBtn.textContent = 'Submit Answer';

        // Initialize button state based on selections
        if (isMultiSelect) {
            submitAnswerBtn.disabled = selectedAnswers[index].length === 0;
        } else {
            submitAnswerBtn.disabled = selectedAnswers[index] === null;
        }

        submitAnswerBtn.addEventListener('click', () => {
            if (isMultiSelect) {
                checkMultiAnswer(index, selectedAnswers[index]);
            } else {
                checkAnswer(index, selectedAnswers[index]);
            }
        });

        submitAnswerContainer.appendChild(submitAnswerBtn);
        questionContainer.appendChild(submitAnswerContainer);
    }

    // Show/hide submit button on last question
    if (index === shuffledQuizData.length - 1) {
        nextButton.style.display = 'none';
        submitButton.style.display = 'block';
        submitButton.disabled = false; // Always enable submit button on last question
    } else {
        nextButton.style.display = 'block';
        submitButton.style.display = 'none';
    }

    // Update button states
    updateButtonStates();
}

function checkAnswer(questionIndex, selectedOptionIndex) {
    const question = shuffledQuizData[questionIndex];
    const selectedOption = question.options[selectedOptionIndex];
    const correct = selectedOption === question.rightAnswer;

    // Mark this question as answered
    answeredQuestions[questionIndex] = true;

    // Update score if answer is correct
    if (correct) {
        score++;
    }

    // Save progress
    saveProgress();

    // Highlight correct and incorrect options
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((option, index) => {
        if (index === selectedOptionIndex) {
            if (correct) {
                option.classList.add('correct');
            } else {
                option.classList.add('incorrect');
            }
        } else if (question.options[index] === question.rightAnswer) {
            option.classList.add('correct');
        }
    });

    // Show feedback
    showFeedback(questionIndex);

    // Remove submit answer button
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    if (submitAnswerBtn) {
        submitAnswerBtn.parentNode.remove();
    }

    // Update button states
    updateButtonStates();
}

function checkMultiAnswer(questionIndex, selectedOptionIndices) {
    const question = shuffledQuizData[questionIndex];
    const selectedOptions = selectedOptionIndices.map(index => question.options[index]);

    // Check if all correct answers are selected and no incorrect answers are selected
    const allCorrectSelected = question.rightAnswer.every(correctOpt =>
        selectedOptions.includes(correctOpt));
    const noIncorrectSelected = selectedOptions.every(selectedOpt =>
        question.rightAnswer.includes(selectedOpt));

    const correct = allCorrectSelected && noIncorrectSelected;

    // Mark this question as answered
    answeredQuestions[questionIndex] = true;

    // Update score if answer is correct
    if (correct) {
        score++;
    }

    // Save progress
    saveProgress();

    // Highlight correct and incorrect options
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((option, index) => {
        const optionText = question.options[index];
        if (question.rightAnswer.includes(optionText)) {
            option.classList.add('correct');
        } else if (selectedOptions.includes(optionText)) {
            option.classList.add('incorrect');
        }
    });

    // Show feedback
    showFeedback(questionIndex);

    // Remove submit answer button
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    if (submitAnswerBtn) {
        submitAnswerBtn.parentNode.remove();
    }

    // Update button states
    updateButtonStates();
}

function showFeedback(questionIndex) {
    const question = shuffledQuizData[questionIndex];
    const isMultiSelect = Array.isArray(question.rightAnswer);

    let correct;

    if (isMultiSelect) {
        const selectedOptions = selectedAnswers[questionIndex].map(index => question.options[index]);
        const allCorrectSelected = question.rightAnswer.every(correctOpt =>
            selectedOptions.includes(correctOpt));
        const noIncorrectSelected = selectedOptions.every(selectedOpt =>
            question.rightAnswer.includes(selectedOpt));

        correct = allCorrectSelected && noIncorrectSelected;
    } else {
        const selectedOptionIndex = selectedAnswers[questionIndex];
        const selectedOption = question.options[selectedOptionIndex];
        correct = selectedOption === question.rightAnswer;
    }

    if (correct) {
        feedbackContainer.textContent = "Correct! You nailed it!";
        feedbackContainer.className = "feedback correct";
    } else {
        feedbackContainer.textContent = "Incorrect, better luck next time.";
        feedbackContainer.className = "feedback incorrect";
    }

    feedbackContainer.style.display = "block";
}

function hideFeedback() {
    feedbackContainer.style.display = "none";
}

function updateButtonStates() {
    prevButton.disabled = currentQuestionIndex === 0;

    // If we're paused, disable navigation buttons
    if (isPaused) {
        prevButton.disabled = true;
        nextButton.disabled = true;
        return;
    }

    // Allow free navigation - users can skip questions
    nextButton.disabled = currentQuestionIndex >= shuffledQuizData.length - 1;

    // Keep submit button enabled on last question
    if (currentQuestionIndex === shuffledQuizData.length - 1) {
        submitButton.disabled = false;
    }
}

function allQuestionsAnswered() {
    // Check if all questions have been answered
    return answeredQuestions.every(answered => answered === true);
}

function getUnansweredCount() {
    return answeredQuestions.filter(answered => !answered).length;
}

function startTimer() {
    // Clear any existing timer first
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Reset timer variables
    seconds = 0;
    minutes = 0;
    hours = 0;

    // Update timer display
    updateTimerDisplay();

    // Start timer interval
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    seconds++;

    if (seconds === 60) {
        seconds = 0;
        minutes++;

        if (minutes === 60) {
            minutes = 0;
            hours++;
        }
    }

    updateTimerDisplay();
}

function updateTimerDisplay() {
    timerElement.textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

function togglePause() {
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pause-overlay');

    if (isPaused) {
        // Pause the timer
        clearInterval(timerInterval);
        pauseButton.textContent = "▶️";

        // Disable all interactive elements
        const currentOptions = optionsContainer.querySelectorAll('.option');
        currentOptions.forEach(opt => {
            opt.style.pointerEvents = 'none';
        });

        prevButton.disabled = true;
        nextButton.disabled = true;
        const submitAnswerBtn = document.getElementById('submit-answer-btn');
        if (submitAnswerBtn) submitAnswerBtn.disabled = true;
        submitButton.disabled = true;

        // Show pause overlay
        const pauseOverlayDiv = document.createElement('div');
        pauseOverlayDiv.id = 'pause-overlay';
        pauseOverlayDiv.className = 'pause-overlay';
        pauseOverlayDiv.innerHTML = `
            <div class="pause-message">
                Quiz Paused
                <button id="close-pause-btn" class="close-pause-btn">Resume</button>
            </div>
        `;
        document.body.appendChild(pauseOverlayDiv);

        // Add event listener to the close button
        const closePauseButton = document.getElementById('close-pause-btn');
        if (closePauseButton) {
            closePauseButton.addEventListener('click', togglePause); // Clicking close will toggle back to resume
        }

    } else {
        // Resume the timer
        timerInterval = setInterval(updateTimer, 1000);
        pauseButton.textContent = "⏸️";

        // Re-enable interactive elements
        const currentOptions = optionsContainer.querySelectorAll('.option');
        currentOptions.forEach(opt => {
            opt.style.pointerEvents = 'auto';
        });

        // Restore button states
        updateButtonStates();

        // Remove pause overlay
        if (pauseOverlay) pauseOverlay.remove();
    }
}

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Setup event listeners
function setupEventListeners() {
    // Add null checks for safety
    if (!startButton || !retakeButton || !submitButton || !prevButton || !nextButton || !pauseButton) {
        console.error('Required DOM elements not found');
        return;
    }

    // Start new quiz button
    startButton.addEventListener('click', () => {
        const savedProgress = localStorage.getItem('aws-quiz-progress');
        if (savedProgress && confirm('There is an existing quiz in progress. Starting a new quiz will lose all current progress. Continue?')) {
            localStorage.removeItem('aws-quiz-progress');
        } else if (savedProgress) {
            return; // User cancelled
        }
        showQuizScreen();
        initQuiz();
    });

    // Resume quiz button
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            showQuizScreen();
            initQuiz();
        });
    }

    // Quiz home button
    if (quizHomeButton) {
        quizHomeButton.addEventListener('click', () => {
            saveProgress();
            loadUserStats();
            showStartScreen();
        });
    }

    // Retake button
    retakeButton.addEventListener('click', () => {
        showQuizScreen();
        initQuiz();
    });

    // Review incorrect answers button
    if (reviewIncorrectButton) {
        reviewIncorrectButton.addEventListener('click', () => {
            showReviewScreen();
        });
    }

    // Back to results button
    if (backToResultsButton) {
        backToResultsButton.addEventListener('click', () => {
            showResultsScreen();
        });
    }

    // Home button
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            // Reset timer
            stopTimer();
            seconds = 0;
            minutes = 0;
            hours = 0;
            updateTimerDisplay();
            
            // Clear any saved progress
            clearProgress();
            
            // Reload stats and show start screen
            loadUserStats();
            showStartScreen();
        });
    }

    // Submit button
    submitButton.addEventListener('click', () => {
        const unansweredCount = getUnansweredCount();
        if (unansweredCount === 0) {
            clearProgress();
            showResultsScreen();
        } else {
            if (confirm(`You have ${unansweredCount} unanswered question(s). Submit anyway? Unanswered questions will be marked as incorrect.`)) {
                clearProgress();
                showResultsScreen();
            }
        }
    });

    // Navigation buttons - simplified without redundant checks
    prevButton.addEventListener('click', () => {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    });

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    });

    // Pause button
    pauseButton.addEventListener('click', togglePause);

    // Reset button
    const resetButton = document.getElementById('reset-btn');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the quiz? All progress will be lost.')) {
                clearProgress();
                showStartScreen();
            }
        });
    }
}

// Load user statistics from localStorage
function loadUserStats() {
    const stats = JSON.parse(localStorage.getItem('aws-quiz-stats') || '{}');
    const savedProgress = localStorage.getItem('aws-quiz-progress');
    console.log('Loading stats:', stats); // Debug log
    
    // Show/hide resume button based on saved progress
    if (resumeButton) {
        if (savedProgress) {
            resumeButton.style.display = 'inline-block';
        } else {
            resumeButton.style.display = 'none';
        }
    }
    
    const totalQuestions = shuffledQuizData.length || quizData.length || 3;
    
    // Calculate success rate as average of all attempts
    let successRate = 0;
    if (stats.history && stats.history.length > 0) {
        const totalPercentage = stats.history.reduce((sum, attempt) => sum + attempt.percentage, 0);
        successRate = Math.round(totalPercentage / stats.history.length);
    }
    const successRateElement = document.getElementById('success-rate');
    if (successRateElement) {
        successRateElement.textContent = `${successRate}%`;
        console.log('Set success rate to:', successRate + '%'); // Debug log
    }
    
    if (stats.attempts > 0) {
        const progressTracking = document.getElementById('progress-tracking');
        if (progressTracking) {
            progressTracking.style.display = 'block';
            
            const bestScoreElement = document.getElementById('best-score');
            const attemptCountElement = document.getElementById('attempt-count');
            const lastAttemptElement = document.getElementById('last-attempt');
            const improvementElement = document.getElementById('improvement-suggestion');
            
            if (bestScoreElement) bestScoreElement.textContent = `${stats.bestScore || 0}/${totalQuestions}`;
            if (attemptCountElement) attemptCountElement.textContent = stats.attempts;
            if (lastAttemptElement) lastAttemptElement.textContent = stats.lastAttempt || 'Never';
            
            // Improvement suggestion
            if (improvementElement) {
                let suggestion = '';
                if (successRate < 50) suggestion = 'Focus on AWS ML fundamentals and SageMaker basics';
                else if (successRate < 70) suggestion = 'Review advanced ML concepts and AWS best practices';
                else if (successRate < 85) suggestion = 'Practice edge cases and optimization scenarios';
                else suggestion = 'Excellent! Keep practicing to maintain your skills';
                
                improvementElement.textContent = suggestion;
            }
        }
    }
    
    // Show quiz history
    const historySection = document.getElementById('quiz-history');
    const historyContainer = document.getElementById('history-container');
    if (stats.history && stats.history.length > 0 && historySection && historyContainer) {
        historySection.style.display = 'block';
        historyContainer.innerHTML = '';
        
        stats.history.slice(-5).reverse().forEach((attempt, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-date">${attempt.date}</div>
                <div class="history-score">${attempt.score}/${attempt.total} (${attempt.percentage}%)</div>
            `;
            historyContainer.appendChild(historyItem);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initSettings();
    loadUserStats();
    showStartScreen();
});
// Save progress function
function saveProgress() {
    const progress = {
        currentQuestionIndex,
        selectedAnswers,
        answeredQuestions,
        score,
        seconds,
        minutes,
        hours,
        shuffledQuizData
    };
    localStorage.setItem('aws-quiz-progress', JSON.stringify(progress));
}

// Clear progress function
function clearProgress() {
    localStorage.removeItem('aws-quiz-progress');
}

// Pie chart function
function drawPieChart(correct, incorrect, unanswered) {
    const canvas = document.getElementById('pie-chart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const total = correct + incorrect + unanswered;
    if (total === 0) return;
    
    // Calculate angles and percentages
    const correctAngle = (correct / total) * 2 * Math.PI;
    const incorrectAngle = (incorrect / total) * 2 * Math.PI;
    const unansweredAngle = (unanswered / total) * 2 * Math.PI;
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw correct slice (green)
    if (correct > 0) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + correctAngle);
        ctx.closePath();
        ctx.fillStyle = '#28a745';
        ctx.fill();
        
        // Add percentage text
        const midAngle = currentAngle + correctAngle / 2;
        const textX = centerX + Math.cos(midAngle) * (radius * 0.7);
        const textY = centerY + Math.sin(midAngle) * (radius * 0.7);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const correctPercent = Math.round((correct / total) * 100);
        if (correctPercent > 5) ctx.fillText(`${correctPercent}%`, textX, textY);
        
        currentAngle += correctAngle;
    }
    
    // Draw incorrect slice (red)
    if (incorrect > 0) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + incorrectAngle);
        ctx.closePath();
        ctx.fillStyle = '#dc3545';
        ctx.fill();
        
        // Add percentage text
        const midAngle = currentAngle + incorrectAngle / 2;
        const textX = centerX + Math.cos(midAngle) * (radius * 0.7);
        const textY = centerY + Math.sin(midAngle) * (radius * 0.7);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const incorrectPercent = Math.round((incorrect / total) * 100);
        if (incorrectPercent > 5) ctx.fillText(`${incorrectPercent}%`, textX, textY);
        
        currentAngle += incorrectAngle;
    }
    
    // Draw unanswered slice (gray)
    if (unanswered > 0) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + unansweredAngle);
        ctx.closePath();
        ctx.fillStyle = '#6c757d';
        ctx.fill();
        
        // Add percentage text
        const midAngle = currentAngle + unansweredAngle / 2;
        const textX = centerX + Math.cos(midAngle) * (radius * 0.7);
        const textY = centerY + Math.sin(midAngle) * (radius * 0.7);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const unansweredPercent = Math.round((unanswered / total) * 100);
        if (unansweredPercent > 5) ctx.fillText(`${unansweredPercent}%`, textX, textY);
    }
    
    // Add border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Update chart legend
function updateChartLegend(correct, incorrect, unanswered, total) {
    const correctPercent = Math.round((correct / total) * 100);
    const incorrectPercent = Math.round((incorrect / total) * 100);
    const unansweredPercent = Math.round((unanswered / total) * 100);
    
    document.getElementById('correct-legend').textContent = `Correct: ${correctPercent}% (${correct})`;
    document.getElementById('incorrect-legend').textContent = `Incorrect: ${incorrectPercent}% (${incorrect})`;
    document.getElementById('unanswered-legend').textContent = `Unanswered: ${unansweredPercent}% (${unanswered})`;
}

function showReviewScreen() {
    startScreen.style.display = 'none';
    quizContainer.style.display = 'none';
    resultsScreen.style.display = 'none';
    reviewScreen.style.display = 'block';

    displayIncorrectQuestions();
}

function displayIncorrectQuestions() {
    const container = document.getElementById('incorrect-questions-container');
    container.innerHTML = '';

    if (incorrectAnswers.length === 0) {
        container.innerHTML = '<p class="no-incorrect">🎉 Great job! You got all questions correct!</p>';
        return;
    }

    incorrectAnswers.forEach((item, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'incorrect-question-item';
        
        const isMultiSelect = Array.isArray(item.correctAnswer);
        
        questionDiv.innerHTML = `
            <div class="question-number">Question ${item.questionIndex + 1}</div>
            <div class="question-text-review">${item.question.question}</div>
            
            <div class="answer-section">
                <div class="your-answer">
                    <strong>Your Answer:</strong>
                    <span class="incorrect-answer">${
                        isMultiSelect ? 
                            (Array.isArray(item.selectedAnswer) ? item.selectedAnswer.join(', ') : 'No answer selected') :
                            (item.selectedAnswer || 'No answer selected')
                    }</span>
                </div>
                
                <div class="correct-answer">
                    <strong>Correct Answer:</strong>
                    <span class="right-answer">${
                        isMultiSelect ? 
                            item.correctAnswer.join(', ') :
                            item.correctAnswer
                    }</span>
                </div>
            </div>
        `;
        
        container.appendChild(questionDiv);
    });
}
// Settings functionality
function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsContent = document.getElementById('settings-content');
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');

    if (!settingsBtn || !settingsContent || !themeSelect || !fontSizeSelect) return;

    // Toggle settings panel
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = settingsContent.style.display !== 'none';
        settingsContent.style.display = isVisible ? 'none' : 'block';
    });

    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsBtn.contains(e.target) && !settingsContent.contains(e.target)) {
            settingsContent.style.display = 'none';
        }
    });

    // Prevent closing when clicking inside settings content
    settingsContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Theme change
    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.setAttribute('data-theme', theme);
    });

    // Font size change
    fontSizeSelect.addEventListener('change', (e) => {
        const fontSize = e.target.value;
        if (fontSize === 'small') {
            document.body.style.fontSize = '14px';
            document.body.style.setProperty('--base-font-size', '14px');
        } else if (fontSize === 'large') {
            document.body.style.fontSize = '18px';
            document.body.style.setProperty('--base-font-size', '18px');
        } else {
            document.body.style.fontSize = '16px';
            document.body.style.setProperty('--base-font-size', '16px');
        }
    });

    // Reset progress button
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset ALL progress? This will clear your success rate, attempts, and best score. This action cannot be undone.')) {
                localStorage.removeItem('aws-quiz-stats');
                localStorage.removeItem('aws-quiz-progress');
                alert('All progress has been reset!');
                location.reload();
            }
        });
    }
}

