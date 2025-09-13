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
    if (totalQuestionsElement) {
        totalQuestionsElement.textContent = shuffledQuizData.length;
    }

    // Display first question
    displayQuestion(currentQuestionIndex);
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadUserStats();
    showStartScreen();
});

// Load user statistics from localStorage
function loadUserStats() {
    const stats = JSON.parse(localStorage.getItem('aws-quiz-stats') || '{}');
    
    const successRate = stats.attempts > 0 ? Math.round((stats.bestScore || 0) / quizData.length * 100) : 0;
    const successRateElement = document.getElementById('success-rate');
    if (successRateElement) {
        successRateElement.textContent = `${successRate}%`;
    }
    
    if (stats.attempts > 0) {
        const progressTracking = document.getElementById('progress-tracking');
        if (progressTracking) {
            progressTracking.style.display = 'block';
            
            const bestScoreElement = document.getElementById('best-score');
            const attemptCountElement = document.getElementById('attempt-count');
            const lastAttemptElement = document.getElementById('last-attempt');
            const improvementElement = document.getElementById('improvement-suggestion');
            
            if (bestScoreElement) bestScoreElement.textContent = `${stats.bestScore || 0}/${quizData.length}`;
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
}

// Save quiz results to localStorage
function saveQuizStats(score, totalQuestions) {
    const stats = JSON.parse(localStorage.getItem('aws-quiz-stats') || '{}');
    
    stats.attempts = (stats.attempts || 0) + 1;
    stats.bestScore = Math.max(stats.bestScore || 0, score);
    stats.lastAttempt = new Date().toLocaleDateString();
    
    localStorage.setItem('aws-quiz-stats', JSON.stringify(stats));
    console.log('Saved stats:', stats); // Debug log
}