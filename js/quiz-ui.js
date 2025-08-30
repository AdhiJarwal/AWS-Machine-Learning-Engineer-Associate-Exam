
const startScreen = document.getElementById('start-screen');
const quizContainer = document.getElementById('quiz-container');
const resultsScreen = document.getElementById('results-screen');
const startButton = document.getElementById('start-btn');
const retakeButton = document.getElementById('retake-btn');
const submitButton = document.getElementById('submit-btn');

const questionContainer = document.getElementById('question-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const feedbackContainer = document.getElementById('feedback');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');

const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');
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
}

function showQuizScreen() {
    startScreen.style.display = 'none';
    quizContainer.style.display = 'block';
    resultsScreen.style.display = 'none';

    // Start the timer
    startTimer();
}

function showResultsScreen() {
    startScreen.style.display = 'none';
    quizContainer.style.display = 'none';
    resultsScreen.style.display = 'block';

    // Stop the timer
    stopTimer();

    // Calculate results
    let incorrect = 0;

    for (let i = 0; i < answeredQuestions.length; i++) {
        if (answeredQuestions[i]) {
            const question = shuffledQuizData[i];
            const isMultiSelect = Array.isArray(question.rightAnswer);

            if (isMultiSelect) {
                const selectedOptions = selectedAnswers[i].map(index => question.options[index]);
                const allCorrectSelected = question.rightAnswer.every(correctOpt =>
                    selectedOptions.includes(correctOpt));
                const noIncorrectSelected = selectedOptions.every(selectedOpt =>
                    question.rightAnswer.includes(selectedOpt));

                if (!(allCorrectSelected && noIncorrectSelected)) {
                    incorrect++;
                }
            } else {
                if (selectedAnswers[i] !== null &&
                    question.options[selectedAnswers[i]] !== question.rightAnswer) {
                    incorrect++;
                }
            }
        }
    }

    const correct = score;
    const total = shuffledQuizData.length;
    const percentage = Math.round((correct / total) * 100);

    // Update results display
    finalScoreElement.textContent = `${correct}/${total}`;
    finalTimeElement.textContent = timerElement.textContent;
    correctCountElement.textContent = `Correct Answers: ${correct}`;
    incorrectCountElement.textContent = `Incorrect Answers: ${incorrect}`;
    percentageElement.textContent = `Percentage: ${percentage}%`;
}

function initQuiz() {
    // Reset variables
    currentQuestionIndex = 0;
    selectedAnswers = [];
    answeredQuestions = [];
    score = 0;

    // Get quiz data
    // We'll assume shuffledQuizData comes from quiz-data.js
    if (typeof quizData !== 'undefined') {
        // Clone the quiz data
        shuffledQuizData = JSON.parse(JSON.stringify(quizData));

        // Shuffle the quiz data
        shuffleArray(shuffledQuizData);
    } else {
        console.error('Quiz data not found! Make sure quiz-data.js is loaded.');
        return;
    }

    // Initialize arrays
    for (let i = 0; i < shuffledQuizData.length; i++) {
        const isMultiSelect = Array.isArray(shuffledQuizData[i].rightAnswer);
        selectedAnswers.push(isMultiSelect ? [] : null);
        answeredQuestions.push(false);
    }

    // Set total questions display
    totalQuestionsElement.textContent = shuffledQuizData.length;

    // Display first question
    displayQuestion(0);

    // Reset and show quiz container
    pauseButton.textContent = "⏸️";
    isPaused = false;
}

function displayQuestion(index) {
    const question = shuffledQuizData[index];

    // Update current question number
    currentQuestionElement.textContent = index + 1;

    // Update progress bar
    progressBar.style.width = `${((index + 1) / shuffledQuizData.length) * 100}%`;

    // Display question text
    questionText.textContent = question.question;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Determine if this is a multi-select question
    const isMultiSelect = Array.isArray(question.rightAnswer);

    // Add multi-select indicator if needed
    if (isMultiSelect && !answeredQuestions[index]) {
        const indicator = document.createElement('div');
        indicator.className = 'multi-select-indicator';
        questionText.appendChild(indicator);
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

        // If question was answered, show correct/incorrect indicators
        if (answeredQuestions[index]) {
            if (isMultiSelect) {
                if (question.rightAnswer.includes(option)) {
                    optionElement.classList.add('correct');
                } else if (selectedAnswers[index].map(i => question.options[i]).includes(option)) {
                    optionElement.classList.add('incorrect');
                }
            } else {
                if (option === question.rightAnswer) {
                    optionElement.classList.add('correct');
                } else if (selectedAnswers[index] === optionIndex) {
                    optionElement.classList.add('incorrect');
                }
            }
        }

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
                // Single select behavior
                document.querySelectorAll('.option').forEach(opt => {
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

    // Show feedback if question was answered
    if (answeredQuestions[index]) {
        showFeedback(index);
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
        submitButton.disabled = !allQuestionsAnswered();
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

    // Highlight correct and incorrect options
    const options = document.querySelectorAll('.option');
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

    // Enable submit button on last question if all questions are answered
    if (questionIndex === shuffledQuizData.length - 1) {
        submitButton.disabled = !allQuestionsAnswered();
    }
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

    // Highlight correct and incorrect options
    const options = document.querySelectorAll('.option');
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

    // Enable submit button on last question if all questions are answered
    if (questionIndex === shuffledQuizData.length - 1) {
        submitButton.disabled = !allQuestionsAnswered();
    }
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
        feedbackContainer.textContent = "Correct! Well done.";
        feedbackContainer.className = "feedback correct";
    } else {
        if (isMultiSelect) {
            feedbackContainer.textContent = `Incorrect. The correct answers are: ${question.rightAnswer.join(" and ")}`;
        } else {
            feedbackContainer.textContent = `Incorrect. The correct answer is: ${question.rightAnswer}`;
        }
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

    nextButton.disabled = !answeredQuestions[currentQuestionIndex] &&
        currentQuestionIndex < shuffledQuizData.length - 1;

    // Enable submit button on last question if all questions are answered
    if (currentQuestionIndex === shuffledQuizData.length - 1) {
        submitButton.disabled = !allQuestionsAnswered();
    }
}

function allQuestionsAnswered() {
    // Check if all questions have been answered
    return answeredQuestions.every(answered => answered === true);
}

function startTimer() {
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
        document.querySelectorAll('.option').forEach(opt => {
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
        document.querySelectorAll('.option').forEach(opt => {
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
    // Start button
    startButton.addEventListener('click', () => {
        showQuizScreen();
        initQuiz();
    });

    // Retake button
    retakeButton.addEventListener('click', () => {
        showQuizScreen();
        initQuiz();
    });

    // Submit button
    submitButton.addEventListener('click', () => {
        showResultsScreen();
    });

    // Navigation buttons
    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < shuffledQuizData.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        }
    });

    // Pause button
    pauseButton.addEventListener('click', togglePause);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showStartScreen();
});