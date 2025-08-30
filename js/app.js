// app.js - Main application logic and initialization

// Quiz state
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswers = [];
let answeredQuestions = [];
let shuffledQuizData = [];

// Initialize the quiz
function initQuiz() {
    // Reset quiz state
    currentQuestionIndex = 0;
    score = 0;

    // Shuffle the quiz data
    shuffledQuizData = [...quizData].sort(() => Math.random() - 0.5);

    // Initialize arrays for tracking answers and answered questions
    selectedAnswers = new Array(shuffledQuizData.length).fill(null);
    answeredQuestions = new Array(shuffledQuizData.length).fill(false);

    // Display total questions
    totalQuestionsElement.textContent = shuffledQuizData.length;

    // Display first question
    displayQuestion(currentQuestionIndex);
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    showStartScreen();
});