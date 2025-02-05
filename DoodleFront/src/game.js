const Phaser = require('phaser');

const BACKGROUND_WIDTH = 2106;
const BACKGROUND_HEIGHT = 2026;

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

const scaleRatio = screenHeight / BACKGROUND_HEIGHT;
const gameWidth = BACKGROUND_WIDTH * scaleRatio;
const gameHeight = BACKGROUND_HEIGHT * scaleRatio;

const worldHeight = gameHeight * 2;

//register scene here

//end of register scene

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('startBackground', 'assets/images/startBackground.png');
        this.load.image('playButton', 'assets/images/playButton.png');
        this.load.image('platform', 'assets/images/platform.png');
        this.load.image('player', 'assets/images/doodle.png');
        this.load.image('scoreboardButton', 'assets/images/scoreboardButton.png');


        this.load.audio('jumpSound', 'assets/sounds/jump.wav');
    }

    create() {
        this.add.image(0, 0, 'startBackground').setOrigin(0, 0).setScale(scaleRatio);

        platforms = this.physics.add.staticGroup();

        const startPlatform = platforms.create(gameWidth / 2 - 200, gameHeight / 2 + 200, 'platform');
        startPlatform.setScale(scaleRatio);
        updateHitbox(startPlatform, 1, 1);

        const doodle = this.physics.add.sprite(startPlatform.x, startPlatform.y - 150 * scaleRatio, 'player');
        doodle.setScale(scaleRatio);
        doodle.setSize(doodle.width * 0.7, doodle.height);
        doodle.setCollideWorldBounds(true);

        this.physics.add.collider(doodle, platforms, (player, platform) => {
            if (player.body.velocity.y >= 0 && player.body.bottom <= platform.body.top + 10) {
                player.setVelocityY(-1000 * scaleRatio);
                this.sound.play('jumpSound');
            }
        });


        const playButton = this.add.image(gameWidth / 2 - 100, gameHeight / 2 - 100, 'playButton').setScale(scaleRatio);
        playButton.setInteractive();

        playButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        const leaderboardButton = this.add.image(gameWidth / 2 + 50, gameHeight / 2 + 300, 'scoreboardButton').setScale(scaleRatio);
        leaderboardButton.setInteractive();
        leaderboardButton.setScale(scaleRatio * 2);

        leaderboardButton.on('pointerdown', () => {
            this.scene.start('LeaderboardScene');
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('background', 'assets/images/background.png');
        this.load.image('platform', 'assets/images/platform.png');
        this.load.image('player', 'assets/images/doodle.png');

        this.load.audio('jumpSound', 'assets/sounds/jump.wav');
        this.load.audio('fallSound', 'assets/sounds/fall.mp3');
    }

    create() {
        this.physics.world.setBounds(0, 0, gameWidth, worldHeight);

        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.background.setScale(scaleRatio);

        platforms = this.physics.add.staticGroup();
        cursors = this.input.keyboard.createCursorKeys();
        score = 0;
        currentSection = 0;
        isGameOver = false;
        playerFallVelocity = 0;
        cameraFollowSpeed = 0;
        isCameraFixed = false;
        fixedCameraY = 0;

        scoreText = this.add.text(16, 16, 'Счет: 0', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'DoodleJump',
        });

        this.startGame();
    }

    startGame() {

        generateSection.call(this, currentSection);
        generateSection.call(this, currentSection + 1);

        const startPlatform = platforms.getChildren()[0];
        player = this.physics.add.sprite(startPlatform.x, startPlatform.y - 150 * scaleRatio, 'player');
        player.setCollideWorldBounds(true);

        player.setScale(scaleRatio);
        player.setSize(player.width * 0.7, player.height);

        this.physics.add.collider(player, platforms, (player, platform) => {
            if (player.body.velocity.y >= 0 && player.body.bottom <= platform.body.top + 10) {
                player.setVelocityY(-1500 * scaleRatio);
                this.sound.play('jumpSound');
            }
        });
    }

    update() {
        if (isGameOver) {
            player.setVelocityY(playerFallVelocity);

            if (!isCameraFixed) {
                const targetScrollY = player.y - gameHeight / 2;
                const deltaY = targetScrollY - this.cameras.main.scrollY;

                const lerpFactor = 0.15;
                this.cameras.main.scrollY += deltaY * lerpFactor;

                if (Math.abs(deltaY) < 5) {
                    isCameraFixed = true;
                    fixedCameraY = this.cameras.main.scrollY;

                    this.scene.start('GameOverScene', { score: score });
                }
            } else {
                this.cameras.main.scrollY = fixedCameraY;
            }

            this.background.y = this.cameras.main.scrollY;

            return;
        }

        if (cursors.left.isDown) {
            player.setVelocityX(-500 * scaleRatio);
            player.setFlipX(true);
            player.setOffset(120 * scaleRatio, 0 * scaleRatio);
        } else if (cursors.right.isDown) {
            player.setVelocityX(500 * scaleRatio);
            player.setFlipX(false);
            player.setOffset(-15 * scaleRatio, 0 * scaleRatio);
        } else {
            player.setVelocityX(0);
        }

        if (player.y < gameHeight / 2 && !isGameOver) {
            const deltaY = gameHeight / 2 - player.y;
            player.y = gameHeight / 2;

            platforms.children.iterate((platform) => {
                if (platform) {
                    platform.y += deltaY;

                    platform.body.updateFromGameObject();

                    if (platform.y > gameHeight) {
                        let newX, newY;
                        let attempts = 0;
                        const maxAttempts = 100;

                        do {
                            newX = Phaser.Math.Between(0, gameWidth);
                            newY = player.y - Phaser.Math.Between(400, 600);
                            attempts++;
                        } while (isPlatformTooClose(newX, newY, 200 * scaleRatio) && attempts < maxAttempts);

                        if (attempts < maxAttempts) {
                            platform.x = newX;
                            platform.y = newY;
                            platform.body.updateFromGameObject();
                        }
                    }
                }
            });

            updateScore(deltaY);
            checkForNewSection();
        }

        if (player.y - 50 * scaleRatio > gameHeight && !isGameOver) {
            isGameOver = true;
            this.sound.play('fallSound');
            playerFallVelocity = player.body.velocity.y;
        }

        platforms.children.iterate((platform) => {
            if (platform) {
                if (platform.y > player.y) {
                    platform.body.checkCollision.none = false;
                } else {
                    platform.body.checkCollision.none = true;
                }
            }
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    preload() {
        this.load.image('playAgainButton', 'assets/images/playAgainButton.png');
        this.load.image('menuButton', 'assets/images/menuButton.png');
        this.load.image('gameOverSprite', 'assets/images/gameOverSprite.png');
    }

    create(data) {
        const finalScore = Math.trunc(data.score);

        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(scaleRatio);

        const gameOverSprite = this.add.sprite(gameWidth / 2, gameHeight / 2 - 200, 'gameOverSprite');
        gameOverSprite.setScale(scaleRatio * 1.5);

        this.add.text(gameWidth / 2, gameHeight / 2 - 50, `Score: ${Math.trunc(finalScore)}`, {
            fontSize: '48px',
            fill: '#000',
            fontFamily: 'DoodleJump',
        }).setOrigin(0.5);

        const playAgainButton = this.add.sprite(gameWidth / 2 - 150, gameHeight / 2 + 100, 'playAgainButton').setInteractive();
        playAgainButton.setScale(scaleRatio);

        const menuButton = this.add.sprite(gameWidth / 2 + 150, gameHeight / 2 + 100, 'menuButton').setInteractive();
        menuButton.setScale(scaleRatio);

        playAgainButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        menuButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });

        playAgainButton.on('pointerover', () => {
            playAgainButton.setScale(scaleRatio * 1.1);
        });

        playAgainButton.on('pointerout', () => {
            playAgainButton.setScale(scaleRatio);
        });

        menuButton.on('pointerover', () => {
            menuButton.setScale(scaleRatio * 1.1);
        });

        menuButton.on('pointerout', () => {
            menuButton.setScale(scaleRatio);
        });

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('accessToken');

        console.log('User ID:', userId);
        console.log('Access Token:', token);

        if (userId && token) {
            console.log('Запрос на получение максимального счета...');
            this.getMaxScore(userId, token, finalScore);
        } else {
            console.warn('Нет данных пользователя, запрос на сервер не отправляется.');
        }
    }

    getMaxScore(userId, token, finalScore) {
        fetch(`http://localhost:8000/api/score/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log('Ответ от сервера:', data);

                if (data && data.high_score !== undefined) {
                    console.log('Текущий максимальный счет:', data.high_score);

                    if (finalScore > data.high_score) {
                        console.log(`Новый счет (${finalScore}) больше текущего (${data.high_score}). Обновляем...`);
                        this.updateScore(userId, token, finalScore);
                    } else {
                        console.log('Счет не изменился, обновление не требуется.');
                    }
                } else {
                    console.error('Ответ сервера не содержит high_score или формат данных неверный');
                }
            })
            .catch(error => {
                console.error('Ошибка при получении счета:', error);
            });
    }

    updateScore(userId, token, finalScore) {
        fetch(`http://localhost:8000/api/score/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score: finalScore })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Счет успешно обновлен:', data);
            })
            .catch(error => {
                console.error('Ошибка при обновлении счета:', error);
            });
    }
}

class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    preload() {
        this.load.image('background', 'assets/images/background.png');
        this.load.image('menuButton', 'assets/images/menuButton.png');
    }

    create() {
        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(scaleRatio);

        this.add.text(gameWidth / 2, 100, 'LeaderBoard', {
            fontSize: '48px',
            fill: '#000',
            fontFamily: 'DoodleJump',
        }).setOrigin(0.5);

        const menuButton = this.add.image(gameWidth / 2, gameHeight - 100, 'menuButton').setScale(scaleRatio).setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });

        this.loadLeaderboard();
    }

    loadLeaderboard() {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            console.warn('Нет токена, нельзя загрузить таблицу лидеров.');
            return;
        }

        fetch('http://localhost:8000/api/leaderboard/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                this.displayLeaderboard(data);
            })
            .catch(error => {
                console.error('Ошибка при загрузке таблицы лидеров:', error);
            });
    }

    displayLeaderboard(players) {
        let startY = 180;
        players.forEach((player, index) => {
            this.add.text(gameWidth / 2 - 200, startY + index * 50, `${index + 1}. ${player.username}: ${player.high_score}`, {
                fontSize: '32px',
                fill: '#000',
                fontFamily: 'DoodleJump',
            });
        });
    }
}


const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: [StartScene, MainScene, GameOverScene, LeaderboardScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

let player;
let platforms;
let cursors;
let score = 0;
let scoreText;
let currentSection = 0;
let isGameOver = false;
let playerFallVelocity = 0;
let cameraFollowSpeed = 0;
let isCameraFixed = false;
let fixedCameraY = 0;

function generateSection(sectionIndex) {
    const numberOfPlatforms = 8;
    const minHorizontalDistance = 100 * scaleRatio;
    const minVerticalDistance = 600 * scaleRatio;

    let previousY = null;

    for (let i = 0; i < numberOfPlatforms; i++) {
        let x, y;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            x = Phaser.Math.Between(0, gameWidth);
            y = sectionIndex * gameHeight - (i * minVerticalDistance);

            if (previousY !== null) {
                const verticalDistance = Math.abs(y - previousY);
                if (verticalDistance < minVerticalDistance) {
                    y = previousY - minVerticalDistance;
                }
            }

            attempts++;
        } while (isPlatformTooClose(x, y, minHorizontalDistance) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
            createSinglePlatform.call(this, x, y);
            previousY = y;
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
    score += deltaY;

    scoreText.setText(`Score: ${Math.floor(score)}`);
}

function checkForNewSection() {
    if (player.y < currentSection * gameHeight) {
        currentSection += 1;
        generateSection.call(this, currentSection + 1);
    }
}

function createSinglePlatform(x, y) {
    const platform = platforms.create(x, y, 'platform');
    platform.setScale(scaleRatio);

    updateHitbox(platform, 1, 1);

    return platform;
}

function updateHitbox(sprite, widthRatio, heightRatio) {
    const hitboxWidth = sprite.displayWidth;
    const hitboxHeight = sprite.displayHeight;

    const offsetX = sprite.displayWidth * 0.8;
    const offsetY = sprite.displayHeight * 0.8;

    sprite.body.setSize(hitboxWidth, hitboxHeight);
    sprite.body.setOffset(offsetX, offsetY);
}