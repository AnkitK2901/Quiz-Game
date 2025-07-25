// UI Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const questionCountInput = document.getElementById('question-count');
const totalQuestionsDisplay = document.getElementById('total-questions-display');
const questionPrompt = document.getElementById('question-prompt');
const optionsContainer = document.getElementById('options-container');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const timerBar = document.getElementById('timer-bar');

// State
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let totalQuestionsAvailable = 0;
let questionTimer; // This will hold the reference to our timer

// On page load, fetch info from the server
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/info');
        const data = await response.json();
        totalQuestionsAvailable = data.totalQuestions;
        totalQuestionsDisplay.textContent = totalQuestionsAvailable;
        questionCountInput.max = totalQuestionsAvailable;
    } catch (error) {
        totalQuestionsDisplay.textContent = "N/A";
        console.error("Could not fetch quiz info:", error);
    }
});

// Event Listeners
startBtn.addEventListener('click', startGame);

async function startGame() {
    const count = parseInt(questionCountInput.value, 10);
    if (isNaN(count) || count < 1 || count > totalQuestionsAvailable) {
        alert(`Invalid selection. Please choose a number between 1 and ${totalQuestionsAvailable}.`);
        return;
    }
    const response = await fetch(`/api/questions?count=${count}`);
    if (!response.ok) {
        alert("Error: Could not fetch questions from the server.");
        return;
    }
    questions = await response.json();
    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    displayQuestion();
}

function displayQuestion() {
    // Reset from previous question
    feedbackEl.textContent = '';
    feedbackEl.className = '';

    // Get the current question
    const question = questions[currentQuestionIndex];
    questionPrompt.textContent = question.prompt;
    optionsContainer.innerHTML = '';
    
    // Create answer buttons
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(button);
    });

    // --- TIMER LOGIC ---
    // Restart the CSS animation for the timer bar
    timerBar.classList.remove('shrinking');
    void timerBar.offsetWidth; // Trigger a reflow to restart animation
    timerBar.classList.add('shrinking');

    // Set a 5-second timer. If it finishes, the user runs out of time.
    questionTimer = setTimeout(handleTimeUp, 5000);
}

function selectAnswer(selectedIndex) {
    clearTimeout(questionTimer); // Stop the timer since an answer was selected
    timerBar.classList.remove('shrinking'); // Stop the bar animation

    const question = questions[currentQuestionIndex];
    if (selectedIndex === question.correctAnswerIndex) {
        score++;
        feedbackEl.textContent = "Correct! 👍";
        feedbackEl.className = 'correct';
    } else {
        feedbackEl.textContent = `Wrong! 👎 The correct answer was: ${question.options[question.correctAnswerIndex]}`;
        feedbackEl.className = 'wrong';
    }
    
    moveToNextQuestion();
}

function handleTimeUp() {
    feedbackEl.textContent = "Time's Up! ⌛";
    feedbackEl.className = 'wrong';
    moveToNextQuestion();
}

function moveToNextQuestion() {
    // Disable all answer buttons to prevent further clicks
    optionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    
    // Wait 1.5 seconds before showing the next question or results
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    scoreEl.textContent = `${score} out of ${questions.length}`;
}