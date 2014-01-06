/*
 * License
 * http://daishihmr.mit-license.org/
 */
(function() {

/**
 * @class
 * @extends {gls2.Scene}
 */
gls2.GameScene = tm.createClass(
/** @lends {gls2.GameScene.prototype} */
{
    superClass: gls2.Scene,
    /** @type {gls2.Player} */
    player: null,

    /** スコア */
    score: 0,
    /** 素点 */
    baseScore: 0,
    /** コンボ数 */
    comboCount: 0,
    /** maxコンボ数 */
    maxComboCount: 0,
    /** コンボゲージ */
    comboGauge: 0,
    /** コンボダウン */
    comboDown: 0,

    stageNumber: 0,
    /** @type {gls2.Stage} */
    stage: null,
    /** @type {gls2.GroundElement} */
    ground: null,

    zanki: 3,

    /** ステージ中の星アイテム（小）ゲット数 */
    starItem: 0,
    /** ステージ中の星アイテム（大）ゲット数 */
    starItemLarge: 0,

    /** 撃墜数 */
    killCount: 0,
    /** 出現敵数 */
    enemyCount: 0,
    /** ミス数 */
    missCount: 0,
    /** トータルミス数 */
    missCountTotal: 0,

    /** オートボム設定 */
    autoBomb: false,
    /** 現在の保有ボム数 */
    bomb: 0,
    /** ボムスロット数 */
    bombMax: 0,
    /** ボムスロット最大数 */
    bombMaxMax: 0,
    /** ボム発動中 */
    isBombActive: false,
    /** マキシマム中 */
    isBombMaximum: false,

    /** ハイパーゲージ */
    hyperGauge: 0,
    /** ハイパーランク */
    hyperRank: 0,
    /** ハイパーモード中 */
    isHyperMode: false,
    /** ハイパーモード無敵残り時間 */
    hyperMutekiTime: 0,
    /** ハイパーモード残り時間 */
    hyperTime: 0,
    /** ハイパーレベル */
    hyperLevel: 0,
    /** 発動中ハイパーモードのレベル */
    currentHyperLevel: 0,

    /** ひよこアイテム累計 */
    hiyokoTotal: 0,
    /** 現在のステージ中に取得したひよこアイテムの数 */
    hiyoko: 0,

    /** @type {gls2.GameScene.Layer} */
    groundLayer: null,
    /** @type {gls2.GameScene.Layer} */
    fallDownLayer: null,
    /** @type {gls2.GameScene.Layer} */
    playerLayer: null,
    /** @type {gls2.GameScene.Layer} */
    enemyLayer: null,
    /** @type {gls2.GameScene.Layer} */
    effectLayer0: null,
    /** @type {gls2.GameScene.Layer} */
    effectLayer1: null,
    /** @type {gls2.GameScene.Layer} */
    bulletLayer: null,
    /** @type {gls2.GameScene.LabelLayer} */
    labelLayer: null,

    /** @type {tm.app.Object2D} */
    lastElement: null,

    /** @type {gls2.ScoreLabel} */
    scoreLabel: null,

    /** @type {gls2.Boss} */
    boss: null,
    demoPlaying: false,
    isBossBattle: false,

    init: function() {
        if (gls2.GameScene.SINGLETON !== null) throw new Error("class 'gls2.GameScene' is singleton!!");

        this.superInit();
        gls2.GameScene.SINGLETON = this;

        this.scoreLabel = gls2.ScoreLabel(this);
        this.scoreLabel.scoreLabelElement.addChildTo(this);

        var g = gls2.Ground();
        this.ground = g.gElement;
        this.ground.addChildTo(this);

        this.groundLayer = gls2.GameScene.Layer().addChildTo(this);
        this.fallDownLayer = gls2.GameScene.Layer().addChildTo(this);
        this.enemyLayer = gls2.GameScene.Layer().addChildTo(this);
        this.effectLayer0 = gls2.GameScene.Layer().addChildTo(this);
        this.playerLayer = gls2.GameScene.Layer().addChildTo(this);
        this.effectLayer1 = gls2.GameScene.Layer().addChildTo(this);
        this.bulletLayer = gls2.GameScene.Layer().addChildTo(this);
        this.labelLayer = gls2.GameScene.LabelLayer(this).addChildTo(this);

        tm.bulletml.AttackPattern.defaultConfig.addTarget = this;

        this.lastElement = tm.app.Object2D();
        this.lastElement.addChildTo(this);
        this.lastElement.update = function(app) {
            this.onexitframe(app);
        }.bind(this);

        this.addEventListener("exit", function() {
            this.scoreLabel.clear();
        });
    },

    addChild: function(child) {
        // 必ずいずれかのレイヤーに入れる(lastElementとground以外)
        if (child.isEffect) {
            this.effectLayer0.addChild(child);
        } else if (child instanceof gls2.Bullet) {
            this.bulletLayer.addChild(child);
        } else if (child instanceof gls2.StarItem) {
            this.groundLayer.addChild(child);
        } else if (child instanceof gls2.Enemy) {
            if (child.isGround) {
                this.groundLayer.addChild(child);
            } else {
                this.enemyLayer.addChild(child);
            }
        } else if (child instanceof gls2.Player) {
            this.playerLayer.addChild(child);
        } else if (child === this.lastElement
            || child === this.ground
            || child instanceof gls2.GameScene.Layer
            || child instanceof gls2.GameScene.LabelLayer
            || child instanceof gls2.ScoreLabelElement) {
            this.superClass.prototype.addChild.apply(this, arguments);
        } else {
            console.error("unknown type child.");
            throw new Error(child);
        }
    },

    update: function(app) {
        this.record(app.keyboard);

        if (app.frame % 500 === 0) {
            gls2.Noise.noise = gls2.Noise.generate(512);
        }

        this.stage.update(app.frame);
        if (app.frame % 2 === 0) this.scoreLabel.update();

        if (app.keyboard.getKeyDown("escape")) {
            // タイトル画面に戻る
            this.app.replaceScene(gls2.TitleScene());
            gls2.stopBgm();
        } else if (app.keyboard.getKeyDown("space")) {
            // ポーズ
            this.openPauseMenu(0);
        } else if (app.keyboard.getKeyDown("p")) {
            this.shotScreen().saveAsImage();
            this.openPauseMenu(0);
        }

        if (DEBUG) {
            if (app.keyboard.getKeyDown("h")) {
                this.addHyperGauge(1.2 / gls2.Setting.HYPER_CHARGE_RATE);
            }
            if (app.keyboard.getKey("v")) {

            }
        }
    },

    shotScreen: function() {
        // スクショを撮る
        var out = tm.graphics.Canvas();
        out.resize(SC_W, SC_H);
        out.clearColor("black");
        out.drawImage(this.ground.ground.element, 0, 0);
        out.drawImage(this.app.canvas.element, 0, 0);
        out.drawImage(this.scoreLabel.element, 0, 0);
        return out;
    },

    /**
     * 各種当たり判定
     * フレームの最後に実行される
     */
    onexitframe: function(app) {
        if (this.player.controllable === false) {
            gls2.Danmaku.erase();
        }

        /** @type {Array.<gls2.Enemy>} */
        var enemies;

        // ショットvs敵
        enemies = [].concat(gls2.Enemy.activeList);
        var shots = [].concat(gls2.ShotBullet.activeList);
        for (var j = shots.length; shots[--j] !== undefined;) {
            for (var i = enemies.length; enemies[--i] !== undefined;) {
                var e = enemies[i];
                var shot = shots[j];
                if (e.hp <= 0) continue;
                if (gls2.Collision.isHit(e, shot)) {
                    shot.genParticle(1);
                    shot.remove();
                    if (e.damage(shot.attackPower)) {
                        this.killCount += 1;
                        if (this.isHyperMode) {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_SHOT_IN_HYPER);
                        } else {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_SHOT);
                        }
                        this.onDestroyEnemy(e);
                        break;
                    }
                }
            }
        }

        // レーザーvs敵
        var laser = this.player.laser;
        if (this.player.fireLaser) {
            // レーザー部分の当たり判定
            enemies = [].concat(gls2.Enemy.activeList);
            enemies.sort(function(l, r) {
                return l.y - r.y;
            });
            for (var i = enemies.length; enemies[--i] !== undefined;) {
                var e = enemies[i];
                if (e.hp <= 0) continue;
                if (gls2.Collision.isHit(e, laser)) {
                    laser.setHitY(e.y + e.boundingHeightBottom);
                    if (e.damage(laser.attackPower)) {
                        this.killCount += 1;
                        if (this.isHyperMode) {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_LASER_IN_HYPER);
                        } else {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_LASER);
                        }
                        this.onDestroyEnemy(e);
                    } else {
                        if (this.isHyperMode) {
                            this.addCombo(this.hyperLevel * 0.01);
                        } else {
                            this.addCombo(0.01);
                        }
                        this.comboGauge = Math.min(this.comboGauge + 0.02, 1);
                        if (this.isHyperMode) {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_LASER_HIT_IN_HYPER);
                        } else {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_LASER_HIT);
                        }
                    }
                    laser.genParticle(2);
                    break;
                }
            }
            // オーラ部分の当たり判定
            var aura = {
                x: this.player.x,
                y: this.player.y,
                boundingWidthLeft: 50,
                boundingWidthRight: 50,
                boundingHeightTop: 100,
                boundingHeightBottom: 40,
            };
            enemies = [].concat(gls2.Enemy.activeList);
            for (var i = enemies.length; enemies[--i] !== undefined;) {
                var e = enemies[i];
                if (e.hp <= 0) continue;
                if (gls2.Collision.isHit(e, aura)) {
                    if(e.damage(laser.attackPower)) {
                        this.killCount += 1;
                        if (this.isHyperMode) {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_AURA_IN_HYPER);
                        } else {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_AURA);
                        }
                        this.onDestroyEnemy(e);
                    } else {
                        if (this.isHyperMode) {
                            this.addCombo(this.hyperLevel * 0.01);
                        } else {
                            this.addCombo(0.01);
                        }
                        this.comboGauge = Math.min(this.comboGauge + 0.02, 1);
                        if (this.isHyperMode) {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_AURA_HIT_IN_HYPER);
                        } else {
                            this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_AURA_HIT);
                        }
                    }
                    laser.genAuraParticle(2, this.player.x, this.player.y-30);
                }
            }
        }

        // ボムvs敵
        if (this.isBombActive) {
            // すべての弾を消す
            gls2.Danmaku.erase();
            enemies = [].concat(gls2.Enemy.activeList);
            for (var i = enemies.length; enemies[--i] !== undefined;) {
                var e = enemies[i];
                if (e.hp <= 0) continue;
                if (e.isInScreen()) {
                    if (e.damage(gls2.Setting.BOMB_ATTACK_POWER)) {
                        this.addScore(e.score);
                        this.killCount += 1;
                    }
                }
            }
            this.comboCount = 0;
            this.comboGauge = 0;
        }

        // ショットvs敵弾
        if (this.isHyperMode) {
            var shotBullets = [].concat(gls2.ShotBullet.activeList);
            for (var s = shotBullets.length; shotBullets[--s] !== undefined;) {
                var shot = shotBullets[s];
                if (shot.hp <= 0) continue;
                var bullets = [].concat(gls2.Bullet.activeList);
                for (var b = bullets.length; bullets[--b] !== undefined;) {
                    var bullet = bullets[b];
                    if (bullet.visible === false) continue;
                    if (shot.hp > 0 && gls2.Collision.isHit(shot, bullet)) {
                        bullet.hp -= (6 - this.hyperRank);
                        if (bullet.hp < 0) {
                            bullet.destroy();
                            this.addScore(gls2.Setting.BULLET_SCORE);
                            this.addCombo(gls2.Setting.BULLET_COMBO);

                            this.generateStar(false, false, bullet.x, bullet.y, 1);
                        }
                        shot.hp -= 1;
                    }
                }
            }
        }

        if (this.demoPlaying) {
            gls2.Danmaku.erase();
        } else {

            if (this.player.parent !== null && this.player.muteki === false && this.isBombActive === false && this.hyperMutekiTime <= 0) {

                // 敵弾vs自機
                for (var i = gls2.Bullet.activeList.length; gls2.Bullet.activeList[--i] !== undefined;) {
                    var b = gls2.Bullet.activeList[i];
                    if (b.visible === false) continue;
                    if (gls2.Collision.isHit(b, this.player)) {
                        this.player.damage();
                        if (this.bomb > 0 && this.autoBomb) {
                            this.hyperRank = gls2.math.clamp(this.hyperRank - 1, 0, 1);
                            this.addRank(-0.01);
                            gls2.MiniBomb(this.player, this).setPosition(this.player.x, this.player.y).addChildTo(this);
                        } else {
                            this.miss();
                        }
                        break;
                    }
                }

                // 敵vs自機
                for (var i = gls2.Enemy.activeList.length; gls2.Enemy.activeList[--i] !== undefined;) {
                    var e = gls2.Enemy.activeList[i];
                    if (e.hp <= 0) continue;
                    if (e.isGround) continue;
                    if (gls2.Collision.isHit(e, this.player)) {
                        this.player.damage();
                        if (this.bomb > 0 && this.autoBomb) {
                            this.hyperRank = gls2.math.clamp(this.hyperRank - 1, 0, 1);
                            this.addRank(-0.01);
                            gls2.MiniBomb(this.player, this).setPosition(this.player.x, this.player.y).addChildTo(this);
                        } else {
                            this.miss();
                        }
                        break;
                    }
                }
            }

            // ハイパー残り時間減少
            if (this.isHyperMode) {
                this.hyperTime -= 1;
                if (this.hyperTime <= 0) {
                    this.endHyperMode();
                }
            }
            this.hyperMutekiTime = Math.max(this.hyperMutekiTime-1, 0);

            // コンボゲージ減少
            this.comboGauge -= gls2.Setting.COMBO_GAUGE_DECR * gls2.Setting.COMBO_GAUGE_DECR_RATE_WHEN_HYPERMODE;
            if (this.comboGauge <= 0) {
                // コンボゲージ切れ
                this.comboGauge = 0;
                if (this.isHyperMode || this.hyperLevel > 0) {
                    // ハイパー中orハイパーレディの場合は即コンボ切れ
                    this.baseScore = 0;
                    this.comboCount = 0;
                    this.comboDown = 0;
                } else {
                    // NoハイパーかつハイパーゲージがNoMAXの場合は徐々にコンボが低下
                    if (this.comboCount > 0) {
                        if (this.comboDown <= 0) {
                            this.comboDown = this.comboCount * gls2.Setting.COMBO_COUNT_DECR_WHEN_COMBOGAUGE_ZERO;
                        }
                        this.baseScore = this.baseScore * (this.comboCount-this.comboDown)/this.comboCount;
                        this.comboCount -= this.comboDown;
                    }
                    if (this.comboCount <= 0) {
                        this.baseScore = 0;
                        this.comboCount = 0;
                        this.comboDown = 0;
                    }
                }
            }

        }

    },

    /**
     * ボム以外の攻撃で敵を破壊した時
     */
    onDestroyEnemy: function(enemy) {
        this.generateStar(
            enemy.isGround,
            this.isHyperMode || gls2.distanceSq(enemy,this.player) < gls2.Setting.CROSS_RANGE,
            enemy.x,
            enemy.y,
            enemy.star
        );

        // ハイパー中はコンボ数が急上昇
        this.addCombo(gls2.Setting.HYPER_COMBO[this.currentHyperLevel]);

        var base = this.baseScore;

        // コンボ数に応じて倍率がかかる
        var bonus =  (~~(this.comboCount / gls2.Setting.COMBO_BONUS) + 1);
        for (var i = 0; i < bonus; i++) {
            base += enemy.score;
            this.addScore(base);
        }

        // 素点が上昇
        this.baseScore += enemy.score * bonus;
    },

    generateStar: function(ground, large, x, y, count) {
        var s = ground ? gls2.StarItemGround : gls2.StarItemSky;
        for (var i = 0; i < count; i++) {
            s(large).setPosition(x, y);
        }
    },

    /**
     * 星アイテム取得時
     */
    onGetStar: function(star) {
        gls2.playSound("star");
        if (star.large) {
            this.starItemLarge += 1;
            this.baseScore += gls2.Setting.STAR_ITEM_BASESCORE_LARGE;
            this.addScore(gls2.Setting.STAR_ITEM_SCORE_LARGE + this.baseScore * gls2.Setting.STAR_ITEM_BONUS_LARGE);
            if (this.isHyperMode) {
                this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_STAR_LARGE_IN_HYPER);
            } else {
                this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_STAR_LARGE);
            }
        } else {
            this.starItem += 1;
            this.baseScore += gls2.Setting.STAR_ITEM_BASESCORE;
            this.addScore(gls2.Setting.STAR_ITEM_SCORE + this.baseScore * gls2.Setting.STAR_ITEM_BONUS);
            if (this.isHyperMode) {
                this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_STAR_IN_HYPER);
            } else {
                this.addHyperGauge(gls2.Setting.HYPER_CHARGE_BY_STAR);
            }
        }
    },

    start: function(playerType, playerStyle) {
        this.scoreLabel.consoleWindow.clearBuf().clear();

        this.score = 0;
        this.zanki = gls2.Setting.INITIAL_ZANKI;
        this.bomb = this.bombMax = gls2.Setting.INITIAL_BOMB_MAX[playerStyle];
        this.bombMaxMax = gls2.Setting.BOMB_MAX_MAX[playerStyle];
        this.hyperGauge = 0;
        this.hyperRank = 0;
        this.hyperLevel = 0;
        bulletml.Walker.globalScope["$rank"] = gls2.Setting.INITIAL_RANK;
        this.endHyperMode();
        this.isBombActive = false;
        this.missCount = this.missCountTotal = 0;

        this.player = gls2.Player(this, playerType, playerStyle);

        this.startStage(0);

        gls2.playSound("voLetsGo");

        this.startRec();
    },

    startStage: function(stageNumber) {
        this.println("3...2...1...");

        if (this.player.parent !== null) this.player.remove();
        gls2.Enemy.clearAll();
        gls2.ShotBullet.clearAll();
        gls2.Danmaku.clearAll();

        this.groundLayer.removeChildren();
        this.effectLayer0.removeChildren();
        this.effectLayer1.removeChildren();
        this.playerLayer.removeChildren();
        this.bulletLayer.removeChildren();
        this.lastElement.removeChildren();

        this.baseScore = 0;
        this.comboCount = 0;
        this.comboGauge = 0;
        this.maxComboCount = 0;
        this.starItem = 0;
        this.starItemLarge = 0;
        this.enemyCount = 0;
        this.killCount = 0;
        this.boss = null
        this.demoPlaying = false;
        this.isBossBattle = false;
        this.missCount = 0;

        this.scoreLabel.scoreLabelElement.gpsOffsetX = 0;
        this.scoreLabel.scoreLabelElement.gpsOffsetY = 0;

        this.hyperRank = 0;

        this.stageNumber = stageNumber;
        this.stage = gls2.Stage.create(this, stageNumber);
        this.tweener.clear().wait(1000).call(function() {
            this.launch();
        }.bind(this));

        this.ground.tweener.clear();
    },

    launch: function() {
        this.println("Let's go!");

        this.player
            .setPosition(SC_W*0.5, SC_H+100)
            .setFrameIndex(3)
            .addChildTo(this);
        this.player.laser.addChildTo(this);
        this.player.controllable = false;
        this.player.muteki = true;
        this.player.fireShot = false;
        this.player.fireLaser = false;
        this.player.tweener
            .clear()
            .moveBy(0, -180, 1000, "easeOutBack")
            .call(function() {
                this.controllable = true;
            }.bind(this.player))
            .wait(gls2.Setting.LAUNCH_MUTEKI_TIME)
            .call(function() {
                this.muteki = false;
            }.bind(this.player));
    },

    miss: function() {
        // TODO ミスエフェクト
        gls2.Effect.explodeS(this.player.x, this.player.y, this);
        this.println("I was shot down.");

        this.player.controllable = false;
        this.player.remove();
        this.zanki -= 1;
        this.comboGauge = 0;
        this.comboCount = 0;
        this.comboDown = 0;
        this.hyperLevel = 0;

        this.missCount += 1;
        this.missCountTotal += 1;

        this.hyperRank = gls2.math.clamp(this.hyperRank - 3, 0, 1);
        this.addRank(-0.03);

        if (this.zanki > 0) {
            this.tweener.clear().wait(1000).call(function() {
                if (!this.autoBomb || !gls2.Setting.AUTO_BOMB_SELECT) {
                    this.bombMax = Math.min(this.bombMax + 1, this.bombMaxMax);
                }
                this.bomb = this.bombMax;
                this.launch();
            }.bind(this));
        } else {
            // コンティニュー確認画面へ
            this.tweener.clear().wait(2000).call(function() {
                this.openContinueMenu();
            }.bind(this));
        }
    },

    addRank: function(v) {
        bulletml.Walker.globalScope["$rank"] = gls2.math.clamp(bulletml.Walker.globalScope["$rank"] + v, 0.00, 0.50);
    },

    gameContinue: function() {
        this.println("System rebooted.", true);

        this.score = 0;
        this.zanki = gls2.Setting.INITIAL_ZANKI;
        this.bomb = this.bombMax = gls2.Setting.INITIAL_BOMB_MAX[this.player.style];
        this.hyperRank = 0;
        bulletml.Walker.globalScope["$rank"] = 0;

        this.launch();
    },

    clearStage: function() {
        // TODO リザルト画面へ
        gls2.playBgm("bgmResult");
        var tempTimer = tm.app.Object2D();
        tempTimer.addChildTo(this.lastElement);
        tempTimer.tweener.wait(1000).call(function() {
            this.app.pushScene(gls2.ResultScene(this, this.shotScreen()));
            tempTimer.remove();
        }.bind(this));
    },

    gameOver: function() {
        // ゲームオーバー画面へ
        gls2.stopBgm();
        this.app.replaceScene(gls2.GameOverScene());
    },

    gameClear: function() {
        // TODO エンディング画面へ
    },

    addScore: function(score) {
        var before = this.score;
        this.score += score;
        for (var i = 0; i < gls2.Setting.EXTEND_SCORE.length; i++) {
            var es = gls2.Setting.EXTEND_SCORE[i];
            if (before < es && es <= this.score) {
                this.extendZanki();
            }
        }
        gls2.core.highScore = Math.max(gls2.core.highScore, this.score);
    },

    addCombo: function(v) {
        this.comboDown = 0;
        this.comboCount += v;
        this.maxComboCount = Math.max(this.maxComboCount, this.comboCount);
        if (1 <= v) this.comboGauge = 1;
    },

    addHyperGauge: function(v) {
        if (this.hyperLevel === gls2.Setting.HYPER_LEVEL_MAX) return;

        v *= gls2.Setting.HYPER_CHARGE_RATE;

        while(v > 1) {
            gls2.ChargeEffect(this.player).addChildTo(this);
            v -= 1;
            this.hyperGauge = 0;
            this.hyperLevel += 1;
            if (this.hyperLevel === 1) {
                this.println("HYPER SYSTEM, stand by.", true);
                gls2.playSound("voHyperStandBy");
            } else {
                this.println("HYPER SYSTEM, ready.", true);
                gls2.playSound("voHyperReady");
            }
        }

        this.hyperGauge = gls2.math.clamp(this.hyperGauge + v, 0, 1);
        if (this.hyperGauge >= 1) {
            gls2.ChargeEffect(this.player).addChildTo(this);
            this.hyperLevel += 1;
            this.hyperGauge -= 1;
            if (this.hyperLevel === 1) {
                this.println("HYPER SYSTEM, stand by.", true);
                gls2.playSound("voHyperStandBy");
            } else {
                this.println("HYPER SYSTEM, ready.", true);
                gls2.playSound("voHyperReady");
            }
        }
    },

    startHyperMode: function() {
        if (Math.random() < 0.5) {
            this.println("HYPER SYSTEM start!!", true);
            gls2.playSound("voHyperStart0");
        } else {
            this.println("start counting to system limit.", true);
            gls2.playSound("voHyperStart1");
        }

        this.hyperRank = gls2.math.clamp(this.hyperRank + 1, 0, 5);
        this.addRank(this.hyperLevel * 0.01);
        bulletml.Walker.globalScope["$hyperOff"] = gls2.Setting.ENEMY_ATTACK_INTERVAL_RATE_HYPER;

        this.hyperTime = gls2.Setting.HYPERMODE_TIME;
        this.hyperMutekiTime = gls2.Setting.HYPERMODE_TIME * gls2.Setting.HYPERMODE_START_MUTEKI_TIME;

        this.player.hyperShotPool.setLevel(this.hyperLevel);
        this.player.laser.setLevel(this.hyperLevel);

        this.player.currentShotPool = this.player.hyperShotPool;

        gls2.Effect.genShockwaveL(this.player.x, this.player.y, this);

        this.isHyperMode = true;
        this.currentHyperLevel = this.hyperLevel;
        this.hyperLevel = 0;
        this.hyperGauge = 0;

        // すべての弾を消す
        gls2.Danmaku.erase(true, true);
    },

    endHyperMode: function() {
        if (this.isHyperMode === false) return;

        this.isHyperMode = false;

        gls2.ChargeEffect(this.player, true).addChildTo(this);

        this.player.currentShotPool = this.player.normalShotPool;

        bulletml.Walker.globalScope["$hyperOff"] = 1.0;

        this.player.hyperShotPool.setLevel(0);
        this.player.laser.setLevel(0);

        this.hyperMutekiTime = gls2.Setting.HYPERMODE_TIME * gls2.Setting.HYPERMODE_END_MUTEKI_TIME;
        this.hyperTime = 0;
        this.currentHyperLevel = 0;

        // すべての弾を消す
        gls2.Danmaku.erase();
    },

    addBomb: function(n) {
        gls2.playSound("decision");
        gls2.playSound("voGetBomb");
        this.bomb = Math.min(this.bomb + 1, this.bombMax);
        this.isBombMaximum = this.bomb === this.bombMax;
    },

    extendZanki: function() {
        // TODO エクステンドエフェクト
        gls2.playSound("voExtend");
        this.println("extended.");
        this.zanki += 1;
    },

    println: function(string, intercept) {
        this.scoreLabel.consoleWindow.addLine(string, intercept);
    },

    openPauseMenu: function(defaultValue) {
        this.openDialogMenu("PAUSE", [ "resume", "setting", "exit game" ], this.onResultPause, {
            "defaultValue": defaultValue,
            "menuDescriptions": [
                "ゲームを再開します",
                "設定を変更します",
                "ゲームを中断し、タイトル画面に戻ります",
            ],
            "showExit": false,
        });
    },
    onResultPause: function(result) {
        switch (result) {
        case 0: // resume
            break;
        case 1: // setting
            this.openSetting();
            break;
        case 2: // exit title
            this.openConfirmExitGame();
            break;
        }
    },

    openSetting: function() {
        this.openDialogMenu("SETTING", [ "bgm volume", "sound volume" ], this.onResultSetting, {
            "defaultValue": this.lastSetting,
            "menuDescriptions": [
                "BGMボリュームを設定します",
                "効果音ボリュームを設定します",
            ],
        });
    },
    onResultSetting: function(result) {
        if (result !== 3) this.lastSetting = result;
        switch (result) {
        case 0:
            this.openBgmSetting();
            break;
        case 1:
            this.openSeSetting();
            break;
        default:
            this.openPauseMenu();
            break;
        }
    },

    openConfirmExitGame: function() {
        this.openDialogMenu("REARY?", [ "yes", "no" ], this.onResultConfirmExitGame, {
            "defaultValue": 1,
            "menuDescriptions": [
                "ゲームを中断し、タイトル画面に戻ります",
                "前の画面へ戻ります",
            ],
            "showExit": false,
        });
    },
    onResultConfirmExitGame: function(result) {
        if (result === 0) {
            gls2.stopBgm();
            this.app.replaceScene(gls2.TitleScene());
        } else {
            this.openPauseMenu(1);
        }
    },

    openBgmSetting: function() {
        this.openDialogMenu("BGM VOLUME", [ "0", "1", "2", "3", "4", "5" ], this.onResultBgmSetting, {
            "defaultValue": gls2.core.bgmVolume,
            "onCursorMove": function(s) {
                if (gls2.currentBgm !== null && s !== 6) gls2.currentBgm.volume = s*0.1;
            },
            "showExit": false,
        });
    },
    onResultBgmSetting: function(result) {
        if (result !== 6) gls2.core.bgmVolume = result;
        this.openSetting(1);
    },

    openSeSetting: function() {
        this.openDialogMenu("SE VOLUME", [ "0", "1", "2", "3", "4", "5" ], this.onResultSeSetting, {
            "defaultValue": gls2.core.seVolume,
            "showExit": false,
        });
    },
    onResultSeSetting: function(result) {
        if (result !== 6) {
            gls2.core.seVolume = result;
        }
        this.openSetting(1);
    },

    openContinueMenu: function() {
        this.openDialogMenu("CONTINUE?", [ "yes", "no" ], this.onResultContinue, {
            "defaultValue": 0,
            "menuDescriptions": [
                "システムを再起動して出撃します",
                "作戦失敗。退却します",
            ],
            "showExit": false,
        });
    },
    onResultContinue: function(result) {
        switch (result) {
        case 0: // yes
            this.gameContinue();
            break;
        case 1: // no
            this.gameOver();
            break;
        }
    },

    draw: function(canvas) {
        if (this.stage === null) return;
    },

    showBossLife: function() {
        this.scoreLabel.scoreLabelElement.tweener
            .clear()
            .to({
                gpsOffsetX: -SC_W,
            }, 1600, "easeInQuad")
            .to({
                gpsOffsetY: 30,
            }, 800, "easeInOutQuad")
        ;
    },

    hideBossLife: function() {
        this.scoreLabel.scoreLabelElement.tweener
            .clear()
            .to({
                gpsOffsetY: 0,
            }, 800, "easeInOutQuad")
            .to({
                gpsOffsetX: 0,
            }, 1600, "easeOutQuad")
        ;
    },

    rec: null,
    recCount : 0,
    kbary: null,
    /**
     * 0:何もしない 1:記録 2:再生
     * @const
     */
    RECMODE: 0,
    startRec: function() {
        if (this.RECMODE === 1) {
            console.log("rec start");
            if (localStorage.getItem("recCount") !== undefined) {
                this.kbary = [];
                var c = ~~localStorage.getItem("recCount");
                for (var i = 0; i < c; i++) {
                    localStorage.removeItem("rec" + i);
                }
                localStorage.removeItem("recCount");
            }
            this.rec = [];
            this.recCount = 0;
        } else if (this.RECMODE === 2) {
            console.log("replay start");
            if (localStorage.getItem("recCount") !== undefined) {
                this.kbary = [];
                var c = ~~localStorage.getItem("recCount");
                for (var i = 0; i < c; i++) {
                    var r = localStorage.getItem("rec"+i);
                    var ary = r.split(",");
                    for (var j = 0; j < ary.length; j++) {
                        this.kbary.push(ary[j]);
                    }
                }
            }
        }
    },
    record: function(kb) {
        if (this.RECMODE === 1) {
            if (1000 < this.rec.length) {
                console.log("save");
                localStorage.setItem("rec" + this.recCount, this.rec);
                localStorage.setItem("recCount", this.recCount);
                this.rec = [];
                this.recCount += 1;
            }
            this.rec.push(""
                + ~~kb.getKey("up")
                + ~~kb.getKey("down")
                + ~~kb.getKey("left")
                + ~~kb.getKey("right")
                + ~~kb.getKey("z")
                + ~~kb.getKey("x")
                + ~~kb.getKey("c"));
        } else if (this.RECMODE === 2) {
            if (this.kbary) {
                var keylog = this.kbary.shift();
                if (keylog !== undefined) {
                    kb.getKey = function(key) {
                        if (key === "up") return !!~~keylog[0];
                        else if (key === "down") return !!~~keylog[1];
                        else if (key === "left") return !!~~keylog[2];
                        else if (key === "right") return !!~~keylog[3];
                        else if (key === "z") return !!~~keylog[4];
                        else if (key === "x") return !!~~keylog[5];
                        else if (key === "c") return !!~~keylog[6];
                        else return false;
                    };
                    kb.getKeyDown = function(key) {
                        if (key === "up") return !!~~keylog[0];
                        else if (key === "down") return !!~~keylog[1];
                        else if (key === "left") return !!~~keylog[2];
                        else if (key === "right") return !!~~keylog[3];
                        else if (key === "z") return !!~~keylog[4];
                        else if (key === "x") return !!~~keylog[5];
                        else if (key === "c") return !!~~keylog[6];
                        else return false;
                    };
                }
            }
        }
    },

});

gls2.GameScene.Layer = tm.createClass({
    superClass: tm.app.Object2D,
    init: function() {
        this.superInit();
    },
});

gls2.GameScene.LabelLayer = tm.createClass({
    superClass: tm.app.CanvasElement,

    gameScene: null,
    frame: 0,

    init: function(gameScene) {
        this.superInit();
        this.gameScene = gameScene;
        this.blendMode = "lighter";
    },
    update: function(app) {
        this.frame = app.frame;
    },
    draw: function(canavs) {
        this.drawComboGauge(canavs);
        this.drawHyperGauge(canavs);
    },
    drawComboGauge: function(canvas) {
        if (this.gameScene.comboGauge > 0) {
            canvas.fillStyle = "rgba(255," + ~~(this.gameScene.comboGauge * 255) + "," + ~~Math.min(255, this.gameScene.comboGauge * 512) + ",0.5)";
            var h = 500 * this.gameScene.comboGauge;
            canvas.fillRect(SC_W-15, SC_H-5 - h, 10, h);
        }
    },
    drawHyperGauge: function(canvas) {
        canvas.fillStyle = "rgba(255,255,0,0.1)";
        canvas.fillRect(5, SC_H-12, 200, 9);
        if (this.hyperLevel === gls2.Setting.HYPER_LEVEL_MAX) {
            if (this.frame%2 === 1) {
                canvas.fillStyle = "rgba(255,255,255,0.3)";
                canvas.fillRect(5, SC_H-12, 200, 9);
            }
        } else if (0 < this.gameScene.hyperGauge) {
            canvas.fillStyle = "rgba(255,255,100,0.3)";
            var w = 200 * this.gameScene.hyperGauge;
            canvas.fillRect(5, SC_H-12, w, 9);
        }

        canvas.strokeStyle = "rgba(255,255,100,0.5)";
        if (!this.gameScene.isHyperMode && this.gameScene.hyperLevel > 0) {
            canvas.setText("bold 24px Orbitron", "left", "bottom");
            canvas.strokeText("HYPER LV " + this.gameScene.hyperLevel, 5, SC_H-3);
        } else if (this.gameScene.isHyperMode) {
            canvas.setText("bold 28px Orbitron", "left", "bottom");
            canvas.strokeText("HYPER LV " + this.gameScene.currentHyperLevel, 5, SC_H-3);
        }
    },
});

/** @const */
gls2.GameScene.SINGLETON = null;

})();
