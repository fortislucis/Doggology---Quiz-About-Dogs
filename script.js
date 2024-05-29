async function main(){
    //============
    // VARIABLES
    //============
    let breedsData;
    let questions = {};
    let score = 0;
    let questionIndex = 1;
    const ROUNDS = 5;
    const CHOICE_NUMBERS = 4;

    const ALL_BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';

    let confettiInterval;

    //===============
    // API FUNCTIONS
    //===============
    async function fetchAllBreeds(){
        try {
            const response = await fetch(ALL_BREEDS_URL);
            const breeds = await response.json();

            return breeds.message;
        } catch (error) {
            console.error('Failed to fetch all breeds: ', error);
        }
    }

    async function fetchImagesUrls(breed){
        try {
            const url = `https://dog.ceo/api/breed/${breed}/images`;
            const response = await fetch(url)   ;
            const images = await response.json();

            return images.message;
        } catch (error) {
            console.error('Failed to fetch images: ', error);
        }
    }

    //===============
    // MAIN FUNCTIONS
    //===============
    async function startQuiz(){
        const loadingDiv = document.getElementById('loadingDiv');
        const quizContainer = document.getElementById('quizContainer');
        loadingDiv.style.display = 'flex';
        quizContainer.style.display = 'none';
        breedsData = await fetchAllBreeds();
        breedsData = Object.keys(breedsData);

        await generateQuestions();
        quizContainer.style.display = 'flex';
        quizContainer.style.flexDirection = 'row';
        loadingDiv.style.display = 'none';
        renderQuestions();
    }

    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', async () => {
        await startQuiz();
    })

    async function restartQuiz(){
        const loadingDiv = document.getElementById('loadingDiv');
        const quizContainer = document.getElementById('quizContainer');
        loadingDiv.style.display = 'flex';
        quizContainer.style.display = 'none';

        await generateQuestions();
        quizContainer.style.display = 'flex';
        quizContainer.style.flexDirection = 'row';
        loadingDiv.style.display = 'none';
        renderQuestions();
    }

    function getRandomBreed(){
        return breedsData[Math.floor(Math.random()*breedsData.length)];
    }

    function getRandomBreedImage(images){
        return images[Math.floor(Math.random()*images.length)];
    }

    async function generateQuestions(){
        for(let i = 0; i < ROUNDS; i++){
            const answer = getRandomBreed();
            const answerImages = await fetchImagesUrls(answer);
            const answerImage = getRandomBreedImage(answerImages);
            const choices = generateChoices(answer, CHOICE_NUMBERS);

            questions[i+1] = {
                answer: answer,
                image: answerImage,
                choices: choices
            }
        }

        return questions;
    }

    function generateChoices(answer, number){
        const choices = [answer];
        
        for(let i = 1; i < number; i++){
            let choice = getRandomBreed();
            while (choice == answer) {
                choice = getRandomBreed();
            }
            choices.push(choice);
        }

        return shuffleArray(choices);
    }

    function renderQuestions(){
        const quizContainer = document.getElementById('quizContainer');

        let contents = ``;
        for(let i = 1; i < ROUNDS+1; i++){
            const question = questions[i];

            const content = `
            <div class='questionContainer'>
                <h2>Question ${i}</h2>
                <img src="${question.image}" alt="Dog Image" />
                <div id='buttonContainer'>
                    ${question.choices.map(choice => `<button class="choiceButton" data-answer="${question.answer}">${capitalizeFirstLetter(choice)}</button>`).join('')}
                </div>
            </div>
            `;

            contents += content;
        }

        quizContainer.innerHTML = `<button id='prevQuestionButton'>←</button>${contents}<button id='nextQuestionButton'>→</button>`;

        document.getElementById('prevQuestionButton').addEventListener('click', ()=>{
            showSlides(questionIndex-1);
        })
        document.getElementById('nextQuestionButton').addEventListener('click', ()=>{
            showSlides(questionIndex+1);
        })

        document.querySelectorAll('.choiceButton').forEach(button => {
            button.addEventListener('click', (event) => {
                const userAnswer = event.target.innerText.toLowerCase();
                const correctAnswer = event.target.getAttribute('data-answer');

                if (userAnswer === correctAnswer) {
                    score++;
                }

                showAnswer(correctAnswer); // Render next question
            });
        });

        showSlides(1);
    }

    function showSlides(n){
        if(n < 1){
            return;
        }

        questionIndex = n;
        const quizContainer = document.getElementById('quizContainer');
        const slides = document.getElementsByClassName('questionContainer');
        
        if(n === 1){
            document.getElementById('prevQuestionButton').style.visibility = 'hidden';
        } else{
            document.getElementById('prevQuestionButton').style.visibility = 'visible';
        }
    
        if(n > ROUNDS){
            quizContainer.innerHTML =
            `<h2>Your final score is ${score} out of ${ROUNDS}</h2>
            <button id="restartButton" class="bigButton">🐾Play Again🐾</button>
            `;
            quizContainer.style.flexDirection = 'column';

            const restartButton = document.getElementById('restartButton');
            restartButton.addEventListener('click', async () => {
                clearInterval(confettiInterval);
                confetti.reset();
                await restartQuiz();
            })

            showConfetti();

            return;
        }

        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }

        slides[n-1].style.display = "flex";
    }

    function showAnswer(correctAnswer){
        const slides = document.getElementsByClassName('questionContainer');
        slides[questionIndex-1].querySelectorAll('.choiceButton').forEach(button => {
            if (button.innerHTML.toLocaleLowerCase() === correctAnswer){
                button.className += ' correct';
            }else{
                button.className += ' incorrect';
            }

            button.style.disabled = true;
        })
    }

    function showConfetti(){
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        confettiInterval = setInterval(function() {
            let timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            let particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

    //===============
    // UTILITY
    //===============
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }

    function capitalizeFirstLetter(string){
        if (!string) return string;
        return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
        }
}

main();