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
const quizTitle = document.querySelector('.quiz-title');
const logo = document.getElementById('logo');
const countError = document.getElementById('count-error');
const currentQuestionEl = document.getElementById('current-question');
const totalQuestionsEl = document.getElementById('total-questions');
const playAgainBtn = document.getElementById('play-again-btn');

// State
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let totalQuestionsAvailable = 0;
let questionTimer;
let answerSelected = false;
let selectedQuestionCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Title animation (runs only once)
    quizTitle.addEventListener('animationend', () => {
        quizTitle.classList.remove('animate__animated', 'animate__fadeInDown');
    });
    
    // Logo click event
    logo.addEventListener('click', resetToStartScreen);
    
    // Play again button
    playAgainBtn.addEventListener('click', resetToStartScreen);
    
    // Load quiz info
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

function resetToStartScreen() {
    currentQuestionIndex = 0;
    score = 0;
    answerSelected = false;
    clearTimeout(questionTimer);
    
    quizScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // Reset input and error
    questionCountInput.value = Math.min(5, totalQuestionsAvailable);
    countError.textContent = '';
}

// Event Listeners
startBtn.addEventListener('click', startGame);

async function startGame() {
    const count = parseInt(questionCountInput.value, 10);
    
    // Validate input
    if (isNaN(count)) {
        countError.textContent = "Please enter a valid number";
        return;
    }
    
    if (count < 1) {
        countError.textContent = "Minimum 1 question required";
        return;
    }
    
    if (count > totalQuestionsAvailable) {
        countError.textContent = `Only ${totalQuestionsAvailable} questions available`;
        return;
    }
    
    try {
        const response = await fetch(`/api/questions?count=${count}`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        
        questions = await response.json();
        currentQuestionIndex = 0;
        score = 0;
        answerSelected = false;
        selectedQuestionCount = count;
        
        // Update question counter
        totalQuestionsEl.textContent = count;
        currentQuestionEl.textContent = "1";
        
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        displayQuestion();
    } catch (error) {
        countError.textContent = "Could not load questions. Please try again.";
        console.error("Error loading questions:", error);
    }
}

function displayQuestion() {
    // Reset state
    answerSelected = false;
    clearTimeout(questionTimer);
    feedbackEl.textContent = '';
    feedbackEl.className = '';
    
    // Update question counter
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    
    // Get current question
    const question = questions[currentQuestionIndex];
    questionPrompt.textContent = question.prompt;
    optionsContainer.innerHTML = '';
    
    // Create answer buttons
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.dataset.index = index;
        button.onclick = () => {
            if (!answerSelected) {
                selectAnswer(index);
            }
        };
        optionsContainer.appendChild(button);
    });

    // Start timer
    timerBar.classList.remove('shrinking');
    void timerBar.offsetWidth; // Trigger reflow
    timerBar.classList.add('shrinking');
    questionTimer = setTimeout(handleTimeUp, 5000);
}

function selectAnswer(selectedIndex) {
    answerSelected = true;
    clearTimeout(questionTimer);
    timerBar.classList.remove('shrinking');

    const question = questions[currentQuestionIndex];
    
    // Disable all buttons
    optionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        
        // Highlight correct answer
        if (parseInt(btn.dataset.index) === question.correctAnswerIndex) {
            btn.classList.add('correct-answer');
        }
    });

    if (selectedIndex === question.correctAnswerIndex) {
        score++;
        feedbackEl.textContent = "Correct! 👍";
        feedbackEl.classList.add('correct');
        optionsContainer.children[selectedIndex].classList.add('correct');
    } else {
        feedbackEl.textContent = `Wrong! 👎 Correct answer: ${question.options[question.correctAnswerIndex]}`;
        feedbackEl.classList.add('wrong');
        optionsContainer.children[selectedIndex].classList.add('wrong');
    }
    
    moveToNextQuestion();
}

function handleTimeUp() {
    if (answerSelected) return;
    
    answerSelected = true;
    feedbackEl.textContent = "Time's Up! ⌛";
    feedbackEl.classList.add('wrong');
    
    // Highlight correct answer
    const question = questions[currentQuestionIndex];
    optionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        if (parseInt(btn.dataset.index) === question.correctAnswerIndex) {
            btn.classList.add('correct-answer');
        }
    });
    
    moveToNextQuestion();
}

function moveToNextQuestion() {
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
    scoreEl.textContent = `${score} out of ${selectedQuestionCount}`;
}