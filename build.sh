rm -f target/gls2.js

java -jar tools/compiler.jar \
--define DEBUG=false \
--define STATS=false \
--externs libs/tmlib.js \
--externs libs/mt.js \
--externs extern/extern.js \
--externs extern/tween.js \
--js libs/bulletml.js \
--js libs/bulletml.walker.js \
--js libs/bulletml.dsl.js \
--js libs/bulletml.tmlib.js \
--js src/main.js \
--js src/GlShooter2.js \
--js src/Setting.js \
--js src/Player.js \
--js src/ShotBullet.js \
--js src/Laser.js \
--js src/Bomb.js \
--js src/BombItem.js \
--js src/Effect.js \
--js src/ScoreLabel.js \
--js src/Ground.js \
--js src/StarItem.js \
--js src/stage/Stage.js \
--js src/stage/Stage1.js \
--js src/stage/Stage2.js \
--js src/stage/Stage4.js \
--js src/common/Collision.js \
--js src/common/Scene.js \
--js src/common/DialogMenu.js \
--js src/common/Particle.js \
--js src/common/ConsoleWindow.js \
--js src/common/Noise.js \
--js src/common/FixedRandom.js \
--js src/common/Sound.js \
--js src/scene/TitleScene.js \
--js src/scene/ShipSelectScene.js \
--js src/scene/GameScene.js \
--js src/scene/ResultScene.js \
--js src/scene/GameOverScene.js \
--js src/scene/EndingScene.js \
--js src/enemy/Enemy.js \
--js src/enemy/Boss.js \
--js src/enemy/EnemyHard.js \
--js src/enemy/EnemySoft.js \
--js src/enemy/EnemyUnit.js \
--js src/enemy/Danmaku.js \
--js libs/math.js \
--compilation_level ADVANCED_OPTIMIZATIONS \
--language_in ECMASCRIPT5 \
--js_output_file target/gls2.js \
--formatting PRETTY_PRINT

# --formatting SINGLE_QUOTES
# --externs libs/mt.js \
