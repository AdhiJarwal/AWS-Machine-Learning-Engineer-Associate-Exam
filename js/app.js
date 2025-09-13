// app.js - Main application logic and initialization

// Quiz state
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswers = [];
let answeredQuestions = [];
let shuffledQuizData = [];
let incorrectAnswers = [];

// Initialize the quiz
function initQuiz() {
    // Reset quiz state
    currentQuestionIndex = 0;
    score = 0;

    // Shuffle the quiz data using Fisher-Yates algorithm
    shuffledQuizData = [...quizData];
    for (let i = shuffledQuizData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuizData[i], shuffledQuizData[j]] = [shuffledQuizData[j], shuffledQuizData[i]];
    }

    // Initialize arrays for tracking answers and answered questions
    selectedAnswers = new Array(shuffledQuizData.length).fill(null);
    answeredQuestions = new Array(shuffledQuizData.length).fill(false);
    incorrectAnswers = [];

    // Display total questions
    totalQuestionsElement.textContent = shuffledQuizData.length;

    // Display first question
    displayQuestion(currentQuestionIndex);
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    showStartScreen();
});