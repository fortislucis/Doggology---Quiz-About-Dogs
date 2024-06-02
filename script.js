class Quiz {
    constructor() {
        this.randomBreedsData = [];
        this.difficultyBreedsData = [];
        this.questions = [];
        this.difficulty = null;
        this.score = 0;
        this.highScore = {
            'easy': null,
            'medium': null,
            'hard': null,
            'random': null
        };
        this.lives = 3;
        this.questionIndex = 0;
        this.CHOICE_NUMBERS = 4;
        this.ALL_BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';
        this.DIFFICULTY_BREEDS_URL = 'assets/difficulties.json';
        this.confettiInterval = null;

        this.difficultyDiv = document.getElementById('difficultyDiv');
        this.difficultyButtons = document.getElementsByClassName('difficultyButton');
        this.quizContainer = document.getElementById('quizContainer');
        this.loadingDiv = document.getElementById('loadingDiv');

        for(let i = 0; i < this.difficultyButtons.length; i++){
            this.difficultyButtons[i].addEventListener('click', () => {
                this.startQuiz(this.difficultyButtons[i].innerText.toLowerCase());
            })
        }
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

    async fetchDifficultyBreeds(){
        try {
            const response = await fetch(this.DIFFICULTY_BREEDS_URL);
            const breeds = await response.json();
            return breeds;
        } catch (error) {
            console.error('Failed to fetch "difficulty.json": ', error);
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

    isLocalStorageAvailable(){
        try {
            return typeof window.localStorage !== 'undefined';
        } catch (error) {
            return false;
        }
    }

    saveBreedData(breedList){
        localStorage.setItem('breedList', JSON.stringify(breedList));
    }

    loadBreedData(){
        return JSON.parse(localStorage.getItem('breedList'));
    }

    saveHighScore(score){
        localStorage.setItem('highScore', JSON.stringify(score));
    }

    loadHighScore(){
        const highScore = JSON.parse(localStorage.getItem('highScore'));
        if(highScore){
            return highScore;
        } else{
            return this.highScore;
        }
    }

    async init(){
        // initialize random breed data
        if(this.randomBreedsData.length == 0){
            if((this.isLocalStorageAvailable() && this.loadBreedData() == null) || !this.isLocalStorageAvailable()){
                this.randomBreedsData = await this.fetchAllBreeds();
                this.randomBreedsData = Object.keys(this.randomBreedsData);

                if(this.isLocalStorageAvailable){
                    this.saveBreedData(this.randomBreedsData);
                }
            } else if(this.isLocalStorageAvailable() && this.loadBreedData()){
                this.randomBreedsData = this.loadBreedData();
            }
        }

        // initialize difficulty breed data
        if(this.difficultyBreedsData.length == 0){
            this.difficultyBreedsData = await this.fetchDifficultyBreeds();
        }

        // get previous high score
        if(this.isLocalStorageAvailable()){
            this.highScore = this.loadHighScore();
        }
    }

    async startQuiz(difficulty) {
        this.difficulty = difficulty;
        this.difficultyDiv.togglePopover();

        // show loading screen and hide quiz container
        this.loadingDiv.style.display = 'flex';
        this.quizContainer.style.display = 'none';

        await this.init();

        // show questions
        await this.generateQuestion();
        this.quizContainer.style.display = 'flex';
        this.quizContainer.style.flexDirection = 'row';
        this.loadingDiv.style.display = 'none';
        this.renderQuestions();
    }

    restartQuiz() {
        this.lives = 3;
        this.score = 0;
        this.questions = [];
        this.questionIndex = 0;
        this.difficultyDiv.togglePopover();
    }

    getRandomBreed(breedList) {
        return breedList[Math.floor(Math.random() * breedList.length)];
    }

    getRandomBreedImage(images) {
        return images[Math.floor(Math.random() * images.length)];
    }

    async generateQuestion() {
        let breedList;
        switch (this.difficulty) {
            case 'random':
                breedList = this.randomBreedsData;
                break;
            case 'easy':
                breedList = this.difficultyBreedsData['easy'];
                break;
            case 'medium':
                breedList = this.difficultyBreedsData['medium'];
                break;
            case 'hard':
                breedList = this.difficultyBreedsData['hard'];
                break;
        }

        const answer = this.getRandomBreed(breedList);
        const answerImages = await this.fetchImagesUrls(answer);
        const answerImage = this.getRandomBreedImage(answerImages);
        const choices = this.generateChoices(answer, breedList, this.CHOICE_NUMBERS);
        let question = {
            answer: answer,
            image: answerImage,
            choices: choices
        };
        const contents = `
            <div class='questionContainer'>
                <div class='questionTitleContainer'>
                    <h2>Question ${this.questions.length + 1}</h2>
                    <h4>Lives: ${this.lives}</h4>
                </div>
                <img src="${question.image}" alt="Dog Image" />
                <div id='buttonContainer'>
                    ${question.choices.map(choice => `<button class="choiceButton" data-answer="${question.answer}">${this.capitalizeFirstLetter(choice)}</button>`).join('')}
                </div>
            </div>
            `;
        question['contents'] = contents;

        this.questions.push(question);
    }

    generateChoices(answer, breedList, number) {
        const choices = [answer];

        for (let i = 1; i < number; i++) {
            let choice = this.getRandomBreed(breedList);
            while (choice == answer || choices.includes(choice)) {
                choice = this.getRandomBreed(breedList);
            }
            choices.push(choice);
        }

        return this.shuffleArray(choices);
    }

    renderQuestions() {
        let contents = '';
        for (let i = 0; i < this.questions.length; i++) {
            contents += this.questions[i].contents;
        }

        this.quizContainer.innerHTML = `<button id='prevQuestionButton'>←</button>${contents}<button id='nextQuestionButton'>→</button>`;

        document.getElementById('prevQuestionButton').addEventListener('click', () => this.showSlides(this.questionIndex - 1));
        document.getElementById('nextQuestionButton').addEventListener('click', () => this.showSlides(this.questionIndex + 1));

        document.querySelectorAll('.choiceButton').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userAnswer = event.target.innerText.toLowerCase();
                const correctAnswer = event.target.getAttribute('data-answer');

                if (userAnswer === correctAnswer) {
                    this.score++;
                } else{
                    this.lives--;
                }

                await this.showAnswer(correctAnswer);
                await this.generateQuestion(this.difficulty);
                this.questionIndex += 1;
                this.renderQuestions();
            });
        });

        this.showSlides(this.questionIndex);
    }

    showSlides(n) {
        if (n < 0 || n >= this.questions.length) {
            return;
        }

        this.questionIndex = n;
        const slides = document.getElementsByClassName('questionContainer');

        if (n === 0) {
            document.getElementById('prevQuestionButton').style.visibility = 'hidden';
        } else {
            document.getElementById('prevQuestionButton').style.visibility = 'visible';
        }

        if (n === this.questions.length - 1) {
            document.getElementById('nextQuestionButton').style.visibility = 'hidden';
        } else {
            document.getElementById('nextQuestionButton').style.visibility = 'visible';
        }

        if (this.lives <= 0) {
            let highScore;
            if(this.highScore[this.difficulty] !== null){
                highScore = `<h3>Your high score in ${this.difficulty} mode is ${this.highScore[this.difficulty]}.</h3>`;
            } else{
                highScore = '<h3></h3>';
            }
            this.quizContainer.innerHTML =
                `<h2>Your final score is ${this.score}!</h2>
                ${highScore}
            <button id="restartButton" class="bigButton">🐾Play Again🐾</button>
            `;
            this.quizContainer.style.flexDirection = 'column';

            if(this.highScore[this.difficulty] == null || this.score > this.highScore[this.difficulty]){
                this.highScore[this.difficulty] = this.score;
                
                if(this.isLocalStorageAvailable()){
                    this.saveHighScore(this.highScore);
                }
            }

            document.getElementById('restartButton').addEventListener('click', async () => {
                clearInterval(this.confettiInterval);
                confetti.reset();
                this.restartQuiz();
            });

            this.showConfetti();
            return;
        }

        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = 'none';
        }

        slides[n].style.display = 'flex';
    }

    async showAnswer(correctAnswer) {
        const slides = document.getElementsByClassName('questionContainer');
        slides[this.questionIndex].querySelectorAll('.choiceButton').forEach(button => {
            if (button.innerHTML.toLowerCase() === correctAnswer) {
                button.className += ' correct';
            } else {
                button.className += ' incorrect';
            }

            button.disabled = true;
        });

        this.questions[this.questionIndex]['contents'] = slides[this.questionIndex].outerHTML;

        await this.delay(400);
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
}

document.addEventListener('DOMContentLoaded', () => {
    new Quiz();
});
