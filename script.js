class Quiz {
    constructor() {
        this.breedsData = [];
        this.questions = {};
        this.score = 0;
        this.questionIndex = 1;
        this.ROUNDS = 5;
        this.CHOICE_NUMBERS = 4;
        this.ALL_BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';
        this.confettiInterval = null;

        this.startButton = document.getElementById('startButton');
        this.quizContainer = document.getElementById('quizContainer');
        this.loadingDiv = document.getElementById('loadingDiv');

        this.startButton.addEventListener('click', () => this.startQuiz());
    }

    async fetchAllBreeds() {
        try {
            const response = await fetch(this.ALL_BREEDS_URL);
            const breeds = await response.json();
            return breeds.message;
        } catch (error) {
            console.error('Failed to fetch all breeds: ', error);
        }
    }

    async fetchImagesUrls(breed) {
        try {
            const url = `https://dog.ceo/api/breed/${breed}/images`;
            const response = await fetch(url);
            const images = await response.json();
            return images.message;
        } catch (error) {
            console.error('Failed to fetch images: ', error);
        }
    }

    async startQuiz() {
        this.loadingDiv.style.display = 'flex';
        this.quizContainer.style.display = 'none';
        this.breedsData = await this.fetchAllBreeds();
        this.breedsData = Object.keys(this.breedsData);

        await this.generateQuestions();
        this.quizContainer.style.display = 'flex';
        this.quizContainer.style.flexDirection = 'row';
        this.loadingDiv.style.display = 'none';
        this.renderQuestions();
    }

    async restartQuiz() {
        this.score = 0;
        this.loadingDiv.style.display = 'flex';
        this.quizContainer.style.display = 'none';

        await this.generateQuestions();
        this.quizContainer.style.display = 'flex';
        this.quizContainer.style.flexDirection = 'row';
        this.loadingDiv.style.display = 'none';
        this.renderQuestions();
    }

    getRandomBreed() {
        return this.breedsData[Math.floor(Math.random() * this.breedsData.length)];
    }

    getRandomBreedImage(images) {
        return images[Math.floor(Math.random() * images.length)];
    }

    async generateQuestions() {
        for (let i = 0; i < this.ROUNDS; i++) {
            const answer = this.getRandomBreed();
            const answerImages = await this.fetchImagesUrls(answer);
            const answerImage = this.getRandomBreedImage(answerImages);
            const choices = this.generateChoices(answer, this.CHOICE_NUMBERS);

            this.questions[i + 1] = {
                answer: answer,
                image: answerImage,
                choices: choices
            };
        }
    }

    generateChoices(answer, number) {
        const choices = [answer];

        for (let i = 1; i < number; i++) {
            let choice = this.getRandomBreed();
            while (choice == answer) {
                choice = this.getRandomBreed();
            }
            choices.push(choice);
        }

        return this.shuffleArray(choices);
    }

    renderQuestions() {
        let contents = '';
        for (let i = 1; i < this.ROUNDS + 1; i++) {
            const question = this.questions[i];

            const content = `
            <div class='questionContainer'>
                <h2>Question ${i}</h2>
                <img src="${question.image}" alt="Dog Image" />
                <div id='buttonContainer'>
                    ${question.choices.map(choice => `<button class="choiceButton" data-answer="${question.answer}">${this.capitalizeFirstLetter(choice)}</button>`).join('')}
                </div>
            </div>
            `;

            contents += content;
        }

        this.quizContainer.innerHTML = `<button id='prevQuestionButton'>←</button>${contents}<button id='nextQuestionButton'>→</button>`;

        document.getElementById('prevQuestionButton').addEventListener('click', () => this.showSlides(this.questionIndex - 1));
        document.getElementById('nextQuestionButton').addEventListener('click', () => this.showSlides(this.questionIndex + 1));

        document.querySelectorAll('.choiceButton').forEach(button => {
            button.addEventListener('click', (event) => {
                const userAnswer = event.target.innerText.toLowerCase();
                const correctAnswer = event.target.getAttribute('data-answer');

                if (userAnswer === correctAnswer) {
                    this.score++;
                }

                this.showAnswer(correctAnswer);
            });
        });

        this.showSlides(1);
    }

    showSlides(n) {
        if (n < 1) {
            return;
        }

        this.questionIndex = n;
        const slides = document.getElementsByClassName('questionContainer');

        if (n === 1) {
            document.getElementById('prevQuestionButton').style.visibility = 'hidden';
        } else {
            document.getElementById('prevQuestionButton').style.visibility = 'visible';
        }

        if (n > this.ROUNDS) {
            this.quizContainer.innerHTML =
                `<h2>Your final score is ${this.score} out of ${this.ROUNDS}</h2>
            <button id="restartButton" class="bigButton">🐾Play Again🐾</button>
            `;
            this.quizContainer.style.flexDirection = 'column';

            document.getElementById('restartButton').addEventListener('click', async () => {
                clearInterval(this.confettiInterval);
                confetti.reset();
                await this.restartQuiz();
            });

            this.showConfetti();
            return;
        }

        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = 'none';
        }

        slides[n - 1].style.display = 'flex';
    }

    showAnswer(correctAnswer) {
        const slides = document.getElementsByClassName('questionContainer');
        slides[this.questionIndex - 1].querySelectorAll('.choiceButton').forEach(button => {
            if (button.innerHTML.toLowerCase() === correctAnswer) {
                button.className += ' correct';
            } else {
                button.className += ' incorrect';
            }

            button.disabled = true;
        });
    }

    showConfetti() {
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        this.confettiInterval = setInterval(() => {
            let timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(this.confettiInterval);
            }

            let particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: this.randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: this.randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }

    capitalizeFirstLetter(string) {
        if (!string) return string;
        return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
    }

    randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Quiz();
});
