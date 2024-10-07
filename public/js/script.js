const cardDays = document.querySelector(".days");
const cardHours = document.querySelector(".hours");
const cardMinutes = document.querySelector(".minutes");
const cardSeconds = document.querySelector(".seconds");

const nextYear = new Date().getFullYear() + 1;
const newYear = new Date(`January 01 ${nextYear} 00:00:00`);

function addzero(dado) {
    return dado < 10 ? `0${dado}` : dado;
}

function countdown() {
    const currentTime = new Date();
    const restTime = newYear - currentTime;

    const days = Math.floor(restTime / 1000 / 60 / 60 / 24);
    const hours = Math.floor((restTime / 1000 / 60 / 60) % 24);
    const minutes = Math.floor((restTime / 1000 / 60) % 60);
    const seconds = Math.floor((restTime / 1000) % 60);

    cardDays.innerHTML = addzero(days);
    cardHours.innerHTML = addzero(hours);
    cardMinutes.innerHTML = addzero(minutes);
    cardSeconds.innerHTML = addzero(seconds);
}


setInterval(countdown, 1000);
