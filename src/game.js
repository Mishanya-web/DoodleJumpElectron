const Phaser = require('phaser');

// Размеры бэкграунда
const BACKGROUND_WIDTH = 2106;
const BACKGROUND_HEIGHT = 2026;

// Переменные для хранения размеров окна
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

// Масштабирование Phaser под размеры окна
const scaleRatio = screenHeight / BACKGROUND_HEIGHT;
const gameWidth = BACKGROUND_WIDTH * scaleRatio;
const gameHeight = BACKGROUND_HEIGHT * scaleRatio;

// Увеличиваем высоту игрового мира вниз
const worldHeight = gameHeight * 2; // В два раза больше, чем видимая область

// Сцена стартового экрана
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Загрузка изображений для стартового экрана
        this.load.image('startBackground', 'assets/images/startBackground.png');
        this.load.image('playButton', 'assets/images/playButton.png');
        this.load.image('platform', 'assets/images/platform.png'); // Загрузка платформы
        this.load.image('player', 'assets/images/doodle.png'); // Загрузка игрока
    }

    create() {
        // Добавление фона стартового экрана
        this.add.image(0, 0, 'startBackground').setOrigin(0, 0).setScale(scaleRatio);

        // Создание группы для платформ
        platforms = this.physics.add.staticGroup();

        // Создание одной платформы под игроком
        const startPlatform = platforms.create(gameWidth / 2 - 200, gameHeight / 2 + 200, 'platform');
        startPlatform.setScale(scaleRatio);
        updateHitbox(startPlatform, 1, 1); // Настройка хитбокса платформы

        // Создание игрока на начальной платформе
        const doodle = this.physics.add.sprite(startPlatform.x, startPlatform.y - 150 * scaleRatio, 'player');
        doodle.setScale(scaleRatio);
        doodle.setSize(doodle.width * 0.7, doodle.height);
        doodle.setCollideWorldBounds(true);

        // Коллизия игрока с платформой
        this.physics.add.collider(doodle, platforms, (player, platform) => {
            if (player.body.velocity.y >= 0 && player.body.bottom <= platform.body.top + 10) {
                // Игрок движется вниз и касается платформы сверху
                player.setVelocityY(-1000 * scaleRatio); // Подпрыгиваем
            }
        });


        // Добавление кнопки "Играть"
        const playButton = this.add.image(gameWidth / 2 - 100, gameHeight / 2 - 100, 'playButton').setScale(scaleRatio);
        playButton.setInteractive();

        // Обработка нажатия на кнопку "Играть"
        playButton.on('pointerdown', () => {
            this.scene.start('MainScene'); // Переход к основной сцене
        });
    }
}

// Основная сцена игры
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('background', 'assets/images/background.png'); // Загрузка бэкграунда
        this.load.image('platform', 'assets/images/platform.png'); // Загрузка платформы
        this.load.image('player', 'assets/images/doodle.png'); // Загрузка игрока
    }

    create() {
        // Устанавливаем размер игрового мира
        this.physics.world.setBounds(0, 0, gameWidth, worldHeight);

        // Добавление бэкграунда
        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.background.setScale(scaleRatio);

        // Инициализация переменных
        platforms = this.physics.add.staticGroup();
        cursors = this.input.keyboard.createCursorKeys();
        score = 0; // Сброс счета
        currentSection = 0; // Сброс текущей ячейки
        isGameOver = false; // Игра не проиграна
        playerFallVelocity = 0; // Скорость падения игрока
        cameraFollowSpeed = 0; // Скорость следования камеры за игроком
        isCameraFixed = false; // Флаг фиксации камеры
        fixedCameraY = 0; // Позиция камеры, на которой она фиксируется

        // Текст для отображения счета
        scoreText = this.add.text(16, 16, 'Счет: 0', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'DoodleJump', // Используем кастомный шрифт
        });

        // Запуск игры (создание игрока и платформ)
        this.startGame();
    }

    startGame() {
        // Генерация начальных ячеек
        generateSection.call(this, currentSection); // Ячейка 1 (в зоне видимости)
        generateSection.call(this, currentSection + 1); // Ячейка 2 (выше зоны видимости)

        // Создание игрока на начальной платформе
        const startPlatform = platforms.getChildren()[0]; // Первая платформа
        player = this.physics.add.sprite(startPlatform.x, startPlatform.y - 150 * scaleRatio, 'player');
        player.setCollideWorldBounds(true);

        // Масштабирование игрока
        player.setScale(scaleRatio);
        player.setSize(player.width * 0.7, player.height);

        // Коллизия игрока с платформами
        this.physics.add.collider(player, platforms, (player, platform) => {
            if (player.body.velocity.y >= 0 && player.body.bottom <= platform.body.top + 10) {
                // Игрок движется вниз и касается платформы сверху
                player.setVelocityY(-1500 * scaleRatio); // Подпрыгиваем
            }
        });
    }

    update() {
        if (isGameOver) {
            // Если игра проиграна, игрок продолжает падать с сохраненной скоростью
            player.setVelocityY(playerFallVelocity);

            // Если камера еще не зафиксирована, плавно догоняем игрока
            if (!isCameraFixed) {
                const targetScrollY = player.y - gameHeight / 2; // Целевая позиция камеры
                const deltaY = targetScrollY - this.cameras.main.scrollY; // Разница между текущей и целевой позицией

                // Плавное движение камеры с использованием линейной интерполяции
                const lerpFactor = 0.15; // Коэффициент плавности
                this.cameras.main.scrollY += deltaY * lerpFactor;

                // Если камера достаточно близко к игроку, фиксируем ее
                if (Math.abs(deltaY) < 5) {
                    isCameraFixed = true;
                    fixedCameraY = this.cameras.main.scrollY; // Запоминаем позицию фиксации камеры

                    // Переход на экран проигрыша
                    this.scene.start('GameOverScene', { score: score });
                }
            } else {
                // Камера зафиксирована, игрок продолжает падать
                this.cameras.main.scrollY = fixedCameraY; // Камера остается на месте
            }

            // Обновляем позицию фона, чтобы он оставался на месте
            this.background.y = this.cameras.main.scrollY;

            return;
        }

        // Движение игрока влево/вправо
        if (cursors.left.isDown) {
            player.setVelocityX(-500 * scaleRatio);
            player.setFlipX(true); // Отражаем спрайт по горизонтали (взгляд влево)
            player.setOffset(120 * scaleRatio, 0 * scaleRatio);
        } else if (cursors.right.isDown) {
            player.setVelocityX(500 * scaleRatio);
            player.setFlipX(false); // Возвращаем спрайт в исходное состояние (взгляд вправо)
            player.setOffset(-15 * scaleRatio, 0 * scaleRatio);
        } else {
            player.setVelocityX(0);
        }

        // Прокрутка камеры вверх (отключена при проигрыше)
        if (player.y < gameHeight / 2 && !isGameOver) {
            const deltaY = gameHeight / 2 - player.y;
            player.y = gameHeight / 2;

            // Перемещаем платформы вниз
            platforms.children.iterate((platform) => {
                if (platform) { // Проверяем, что платформа существует
                    platform.y += deltaY;

                    // Обновляем хитбокс платформы
                    platform.body.updateFromGameObject();

                    // Если платформа ушла за пределы видимой области, перемещаем ее в новую ячейку выше
                    if (platform.y > gameHeight) {
                        let newX, newY;
                        let attempts = 0;
                        const maxAttempts = 100;

                        // Генерация новой позиции с проверкой на перекрытие
                        do {
                            newX = Phaser.Math.Between(0, gameWidth);
                            newY = player.y - Phaser.Math.Between(400, 600);
                            attempts++;
                        } while (isPlatformTooClose(newX, newY, 200 * scaleRatio) && attempts < maxAttempts);

                        if (attempts < maxAttempts) {
                            platform.x = newX;
                            platform.y = newY;
                            platform.body.updateFromGameObject(); // Обновляем хитбокс
                        }
                    }
                }
            });

            // Увеличиваем счет
            updateScore(deltaY);

            // Проверяем, нужно ли генерировать новую ячейку
            checkForNewSection();
        }

        // Проверка на проигрыш
        if (player.y - 50 * scaleRatio > gameHeight && !isGameOver) {
            isGameOver = true;
            playerFallVelocity = player.body.velocity.y; // Сохраняем текущую скорость падения
        }

        // Динамическое управление коллизиями платформ
        platforms.children.iterate((platform) => {
            if (platform) { // Проверяем, что платформа существует
                if (platform.y > player.y) {
                    // Платформа ниже игрока — включаем коллизию
                    platform.body.checkCollision.none = false;
                } else {
                    // Платформа выше игрока — отключаем коллизию
                    platform.body.checkCollision.none = true;
                }
            }
        });
    }
}

// Сцена экрана проигрыша
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    preload() {
        // Загрузка спрайтов для кнопок и экрана проигрыша
        this.load.image('playAgainButton', 'assets/images/playAgainButton.png'); // Спрайт для кнопки "Играть снова"
        this.load.image('menuButton', 'assets/images/menuButton.png'); // Спрайт для кнопки "Выйти в меню"
        this.load.image('gameOverSprite', 'assets/images/gameOverSprite.png'); // Спрайт для экрана проигрыша
    }

    create(data) {
        // Получаем счет из данных
        const finalScore = data.score;

        // Добавление фона экрана проигрыша
        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(scaleRatio);

        // Добавление спрайта "Game Over" (выше текста счёта)
        const gameOverSprite = this.add.sprite(gameWidth / 2, gameHeight / 2 - 200, 'gameOverSprite');
        gameOverSprite.setScale(scaleRatio * 1.5);

        // Текст с итоговым счетом (ниже спрайта "Game Over")
        this.add.text(gameWidth / 2, gameHeight / 2 - 50, `Score: ${Math.trunc(finalScore)}`, {
            fontSize: '48px',
            fill: '#000',
            fontFamily: 'DoodleJump', // Используем кастомный шрифт
        }).setOrigin(0.5);

        // Кнопка "Играть снова" (спрайт)
        const playAgainButton = this.add.sprite(gameWidth / 2 - 150, gameHeight / 2 + 100, 'playAgainButton').setInteractive();
        playAgainButton.setScale(scaleRatio);

        // Кнопка "Выйти в меню" (спрайт)
        const menuButton = this.add.sprite(gameWidth / 2 + 150, gameHeight / 2 + 100, 'menuButton').setInteractive();
        menuButton.setScale(scaleRatio);

        // Обработка нажатия на кнопку "Играть снова"
        playAgainButton.on('pointerdown', () => {
            this.scene.start('MainScene'); // Перезапуск игры
        });

        // Обработка нажатия на кнопку "Выйти в меню"
        menuButton.on('pointerdown', () => {
            this.scene.start('StartScene'); // Возврат в стартовое меню
        });

        // Добавим эффект при наведении на кнопки (опционально)
        playAgainButton.on('pointerover', () => {
            playAgainButton.setScale(scaleRatio * 1.1); // Увеличиваем кнопку при наведении
        });

        playAgainButton.on('pointerout', () => {
            playAgainButton.setScale(scaleRatio); // Возвращаем кнопку в исходный размер
        });

        menuButton.on('pointerover', () => {
            menuButton.setScale(scaleRatio * 1.1); // Увеличиваем кнопку при наведении
        });

        menuButton.on('pointerout', () => {
            menuButton.setScale(scaleRatio); // Возвращаем кнопку в исходный размер
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: gameWidth, // Ширина игры
    height: gameHeight, // Высота игры
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 }, // Гравитация вниз
            debug: false // Включите для отладки (визуализация хитбоксов)
        }
    },
    scene: [StartScene, MainScene, GameOverScene], // Добавляем все сцены в конфигурацию
    scale: {
        mode: Phaser.Scale.FIT, // Масштабирование с сохранением пропорций
        autoCenter: Phaser.Scale.CENTER_BOTH // Центрирование игры
    }
};

const game = new Phaser.Game(config);

let player;
let platforms;
let cursors;
let score = 0; // Счет
let scoreText; // Текст для отображения счета
let currentSection = 0; // Текущая ячейка (секция)
let isGameOver = false; // Состояние проигрыша
let playerFallVelocity = 0; // Скорость падения игрока
let cameraFollowSpeed = 0; // Скорость следования камеры за игроком
let isCameraFixed = false; // Флаг фиксации камеры
let fixedCameraY = 0; // Позиция камеры, на которой она фиксируется

function generateSection(sectionIndex) {
    // Количество платформ в ячейке
    const numberOfPlatforms = 8;
    const minHorizontalDistance = 100 * scaleRatio; // Минимальное расстояние по горизонтали
    const minVerticalDistance = 600 * scaleRatio; // Минимальное расстояние по вертикали

    let previousY = null; // Переменная для хранения Y-координаты предыдущей платформы

    // Создаем платформы в ячейке
    for (let i = 0; i < numberOfPlatforms; i++) {
        let x, y;
        let attempts = 0;
        const maxAttempts = 100; // Максимальное количество попыток для генерации платформы

        do {
            x = Phaser.Math.Between(0, gameWidth);
            y = sectionIndex * gameHeight - (i * minVerticalDistance); // Интервал между платформами

            // Если это не первая платформа, проверяем расстояние по высоте
            if (previousY !== null) {
                const verticalDistance = Math.abs(y - previousY);
                if (verticalDistance < minVerticalDistance) {
                    // Если расстояние меньше минимального, корректируем Y
                    y = previousY - minVerticalDistance;
                }
            }

            attempts++;
        } while (isPlatformTooClose(x, y, minHorizontalDistance) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
            createSinglePlatform.call(this, x, y);
            previousY = y; // Сохраняем Y-координату текущей платформы
        }
    }
}

function isPlatformTooClose(x, y, minDistance) {
    let tooClose = false;
    platforms.children.iterate((platform) => {
        if (platform) {
            const distance = Phaser.Math.Distance.Between(x, y, platform.x, platform.y);
            if (distance < minDistance) {
                tooClose = true;
            }
        }
    });
    return tooClose;
}

function updateScore(deltaY) {
    // Увеличиваем счет в зависимости от пройденного расстояния
    score += deltaY;

    // Обновляем текст счета
    scoreText.setText(`Score: ${Math.floor(score)}`);
}

function checkForNewSection() {
    // Если игрок поднялся выше текущей ячейки, генерируем новую
    if (player.y < currentSection * gameHeight) {
        currentSection += 1; // Переходим к следующей ячейке
        generateSection.call(this, currentSection + 1); // Генерируем новую ячейку выше
    }
}

function createSinglePlatform(x, y) {
    const platform = platforms.create(x, y, 'platform');
    platform.setScale(scaleRatio);

    // Настройка хитбокса платформы (точно по границам спрайта)
    updateHitbox(platform, 1, 1); // Хитбокс по ширине равен спрайту, по высоте — 50%

    return platform;
}

function updateHitbox(sprite, widthRatio, heightRatio) {
    // Используем displayWidth и displayHeight для учета масштабирования
    const hitboxWidth = sprite.displayWidth;
    const hitboxHeight = sprite.displayHeight;

    // Рассчитываем смещение хитбокса
    const offsetX = sprite.displayWidth * 0.8;
    const offsetY = sprite.displayHeight * 0.8;

    // Применяем новые размеры и смещение хитбокса
    sprite.body.setSize(hitboxWidth, hitboxHeight);
    sprite.body.setOffset(offsetX, offsetY);
}