var SC_W = 480;
var SC_H = 520;

/** @namespace */
var gls2 = {
    core: null,
};

gls2.GlShooter2 = tm.createClass({
    superClass: tm.app.CanvasApp,
    /** アプリ実行中のハイスコア */
    highScore: 0,
    /** ハイスコア取得時の最終到達ステージ */
    highStage: 0,
    /** BGM音量(0～5) */
    bgmVolume: 4,
    /** SE音量(0～5) */
    seVolume: 4,
    /** 難易度(0～4) */
    difficulty: 1,
    init: function(id) {
        this.superInit(id);
        gls2.core = this;
        this.resize(SC_W, SC_H).fitWindow();
        this.fps = 60;
        this.background = "rgba(0,0,0,1)";
        this.replaceScene(tm.app.LoadingScene({
            assets: {
                "tex0": "assets/bullets.png",
                "tex1": "assets/tex1.png",
            },
            nextScene: gls2.TitleScene
        }));
    },
    exitApp: function() {
        this.stop();
        tm.social.Nineleap.postRanking(this.highScore, "");
    }
});

gls2.setShadow = function(element) {
    element.shadowColor = "rgba(0,0,0,0.5)";
    element.shadowBlur = 30;
    element.shadowOffsetX = 20;
    element.shadowOffsetY = 40;
};

tm.app.Label = tm.createClass({
    superClass: tm.app.Label,
    init: function(text, size) {
        this.superInit(text, size);
        this.setAlign("center");
        this.setBaseline("middle");
        this.setFontFamily("Orbitron");

        this.isHitPoint = this.isHitPointRect;
    },
    update: function(app) {
        this.alpha = 0.8 + Math.sin(app.frame * 0.1) * 0.2;
    }
});