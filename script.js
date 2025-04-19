document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const statusMessage = document.getElementById('status-message');
    const restartButton = document.getElementById('restart-button');
    const musicToggle = document.getElementById('music-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const winLine = document.getElementById('win-line');

    // Ses Efektleri
    const clickSound = document.getElementById('click-sound');
    const winSound = document.getElementById('win-sound');
    const drawSound = document.getElementById('draw-sound');
    const backgroundMusic = document.getElementById('background-music');

    let currentPlayer = 'x';
    let gameActive = true;
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let isMusicMuted = false;
    let isSoundMuted = false;

    const winningConditions = [
        [0, 1, 2], // Yatay üst
        [3, 4, 5], // Yatay orta
        [6, 7, 8], // Yatay alt
        [0, 3, 6], // Dikey sol
        [1, 4, 7], // Dikey orta
        [2, 5, 8], // Dikey sağ
        [0, 4, 8], // Çapraz sol üst - sağ alt
        [2, 4, 6]  // Çapraz sağ üst - sol alt
    ];

    const messages = {
        x: "X'in sırası",
        o: "O'nun sırası",
        winX: "X kazandı!",
        winO: "O kazandı!",
        draw: "Berabere!"
    };

    // Sesler daha yüksek sesle çalsın
    clickSound.volume = 1.0;
    winSound.volume = 0.8;
    drawSound.volume = 0.8;
    backgroundMusic.volume = 0.3;

    // Sesleri yükle ve ön belleğe al
    function preloadSounds() {
        clickSound.load();
        winSound.load();
        drawSound.load();
        backgroundMusic.load();

        // Sesler hazır olduğunda kullanıcı etkileşimi bekle
        document.addEventListener('click', initializeAudio, { once: true });
    }

    // İlk kullanıcı etkileşiminde sesleri başlat
    function initializeAudio() {
        // Kısa sessiz ses çal ve sonra durdur (tarayıcı kısıtlamalarını aşmak için)
        clickSound.play().then(() => {
            clickSound.pause();
            clickSound.currentTime = 0;
        }).catch(e => console.log("Ses başlatma hatası: ", e));

        if (!isMusicMuted) {
            playBackgroundMusic();
        }
    }

    // Arkaplan müziğini başlat
    function playBackgroundMusic() {
        backgroundMusic.play().catch(error => {
            console.log("Müzik çalma hatası: ", error);
        });
    }

    // Sesleri ön belleğe al
    preloadSounds();

    // Müzik kontrolü
    musicToggle.addEventListener('click', () => {
        isMusicMuted = !isMusicMuted;

        if (isMusicMuted) {
            backgroundMusic.pause();
            musicToggle.classList.add('muted');
        } else {
            backgroundMusic.play().catch(e => console.log("Müzik çalma hatası: ", e));
            musicToggle.classList.remove('muted');
        }

        // Müzik butonuna tıklama sesi
        if (!isSoundMuted) {
            playClickSound();
        }
    });

    // Ses efektleri kontrolü
    soundToggle.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;

        if (isSoundMuted) {
            soundToggle.classList.add('muted');
        } else {
            soundToggle.classList.remove('muted');
            playClickSound(); // Değişikliği duymak için ses çal
        }
    });

    // Tıklama sesi çal
    function playClickSound() {
        if (!isSoundMuted) {
            clickSound.currentTime = 0;
            clickSound.play().catch(error => {
                console.log("Ses çalma hatası: ", error);
            });
        }
    }

    // Oyun sesi çal
    function playGameSound(sound) {
        if (sound && !isSoundMuted) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log("Ses çalma hatası: ", error);
            });
        }
    }

    // Patlama efekti oluşturma
    function createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        document.querySelector('.game-board').appendChild(explosion);

        setTimeout(() => {
            explosion.remove();
        }, 600);
    }

    function handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameState[clickedCellIndex] !== '' || !gameActive) {
            return;
        }

        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.classList.add(currentPlayer);

        // Tıklama sesi çal
        playClickSound();

        // Hücre merkezinde tıklama noktasında patlama efekti
        const rect = clickedCell.getBoundingClientRect();
        const x = clickedCell.offsetWidth / 2;
        const y = clickedCell.offsetHeight / 2;
        createExplosion(x, y);

        checkResult();
    }

    function drawWinLine(combination) {
        const [a, b, c] = combination;

        // Kazanan hücrelerini vurgula
        document.querySelector(`.cell[data-index="${a}"]`).classList.add('winner');
        document.querySelector(`.cell[data-index="${b}"]`).classList.add('winner');
        document.querySelector(`.cell[data-index="${c}"]`).classList.add('winner');

        // Çizginin tipini belirle
        let lineType;

        // Yatay satırlar
        if (a === 0 && c === 2) lineType = 'horizontal-top';
        else if (a === 3 && c === 5) lineType = 'horizontal-middle';
        else if (a === 6 && c === 8) lineType = 'horizontal-bottom';
        // Dikey sütunlar
        else if (a === 0 && c === 6) lineType = 'vertical-left';
        else if (a === 1 && c === 7) lineType = 'vertical-middle';
        else if (a === 2 && c === 8) lineType = 'vertical-right';
        // Çapraz çizgiler
        else if (a === 0 && c === 8) lineType = 'diagonal-main';
        else if (a === 2 && c === 6) lineType = 'diagonal-counter';

        // Çizgiyi ayarla
        winLine.className = 'win-line';  // Sınıfları sıfırla
        winLine.classList.add('active', lineType);
    }

    function checkResult() {
        let roundWon = false;
        let winningCombo = null;

        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            const position1 = gameState[a];
            const position2 = gameState[b];
            const position3 = gameState[c];

            if (position1 === '' || position2 === '' || position3 === '') {
                continue;
            }

            if (position1 === position2 && position2 === position3) {
                roundWon = true;
                winningCombo = winningConditions[i];
                break;
            }
        }

        if (roundWon) {
            statusMessage.textContent = currentPlayer === 'x' ? messages.winX : messages.winO;
            gameActive = false;

            // Kazanan çizgisini çiz
            drawWinLine(winningCombo);

            // Kazanma sesi çal
            playGameSound(winSound);

            return;
        }

        const roundDraw = !gameState.includes('');
        if (roundDraw) {
            statusMessage.textContent = messages.draw;
            gameActive = false;

            // Beraberlik sesi çal
            playGameSound(drawSound);

            return;
        }

        changePlayer();
    }

    function changePlayer() {
        currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
        statusMessage.textContent = currentPlayer === 'x' ? messages.x : messages.o;
    }

    function restartGame() {
        currentPlayer = 'x';
        gameActive = true;
        gameState = ['', '', '', '', '', '', '', '', ''];
        statusMessage.textContent = messages.x;

        cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'winner');
        });

        // Kazanan çizgisini kaldır
        winLine.className = 'win-line';

        // Tıklama sesi çal
        playClickSound();
    }

    // Event Listeners
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    restartButton.addEventListener('click', restartGame);
}); 