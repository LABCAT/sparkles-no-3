import React, { useRef, useEffect } from "react";
import "./helpers/Globals";
import "p5/lib/addons/p5.sound";
import * as p5 from "p5";
import { Midi } from '@tonejs/midi'
import PlayIcon from './functions/PlayIcon.js';

import audio from "../audio/sparkles-no-3.ogg";
import midi from "../audio/sparkles-no-3.mid";

const P5SketchWithAudio = () => {
    const sketchRef = useRef();

    const Sketch = p => {

        p.canvas = null;

        p.canvasWidth = window.innerWidth;

        p.canvasHeight = window.innerHeight;

        p.audioLoaded = false;

        p.player = null;

        p.PPQ = 3840 * 4;

        p.loadMidi = () => {
            Midi.fromUrl(midi).then(
                function(result) {
                    console.log(result);
                    const noteSet1 = result.tracks[1].notes;
                    p.scheduleCueSet(noteSet1, 'executeCueSet1');
                    p.audioLoaded = true;
                    document.getElementById("loader").classList.add("loading--complete");
                    document.getElementById("play-icon").classList.remove("fade-out");
                }
            );
            
        }

        p.preload = () => {
            p.song = p.loadSound(audio, p.loadMidi);
            p.song.onended(p.logCredits);
        }

        p.scheduleCueSet = (noteSet, callbackName, poly = false)  => {
            let lastTicks = -1,
                currentCue = 1;
            for (let i = 0; i < noteSet.length; i++) {
                const note = noteSet[i],
                    { ticks, time } = note;
                if(ticks !== lastTicks || poly){
                    note.currentCue = currentCue;
                    p.song.addCue(time, p[callbackName], note);
                    lastTicks = ticks;
                    currentCue++;
                }
            }
        } 

        p.numOfLoops = 2000;

        p.vx = new Array(p.numOfLoops);
        p.vy = new Array(p.numOfLoops);
        p.x = new Array(p.numOfLoops);
        p.y = new Array(p.numOfLoops);
        p.ax = new Array(p.numOfLoops);
        p.ay = new Array(p.numOfLoops);
        
        p.vx2 = new Array(p.numOfLoops);
        p.vy2 = new Array(p.numOfLoops);
        p.x2 = new Array(p.numOfLoops);
        p.y2 = new Array(p.numOfLoops);
        p.ax2 = new Array(p.numOfLoops);
        p.ay2 = new Array(p.numOfLoops);

        p.touchX = 0;
        p.touchY = 0;
        p.hueOptions = [0, 30, 60, 80, 120, 150, 180, 210, 240, 270, 300, 330];
        p.hueRangeMin = p.random(p.hueOptions);
        p.hueRangeMax = p.hueRangeMin + 30;

        p.magnetism = 444.0;
        
        p.radius = 1;
        p.gensoku = 0.95; // principle

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.noStroke(); 
            p.background(0);
            p.fill(0);
            p.ellipseMode(p.RADIUS);
            p.colorMode(p.HSB);
            p.blendMode(p.ADD);
            p.setupParticles();
        }

        p.setupParticles = () => {
            for(var i =0; i< p.numOfLoops; i++){
                p.x[i] = p.random(p.width);
                p.y[i] = p.random(p.height);
                p.vx[i] = 0;
                p.vy[i] = 0;
                p.ax[i] = 0;
                p.ay[i] = 0;
            }
        }

        p.draw = () => {
            if(p.audioLoaded && p.song.isPlaying()){
                p.background(0);
                for(let i=0; i < p.numOfLoops; i++){
                    const distance = p.dist(p.touchX, p.touchY, p.x[i], p.y[i]);

                    if(distance > 3){
                        p.ax[i] = p.magnetism * (p.touchX - p.x[i]) / (distance * distance); 
                        p.ay[i] = p.magnetism * (p.touchY - p.y[i]) / (distance * distance);
                    }
                    p.vx[i] += p.ax[i];
                    p.vy[i] += p.ay[i];
                    
                    p.vx[i] = p.vx[i] * p.gensoku;
                    p.vy[i] = p.vy[i] * p.gensoku;
                    
                    p.x[i] += p.vx[i]; 
                    p.y[i] += p.vy[i]; 
                    
                    const sokudo = p.dist(0, 0, p.vx[i], p.vy[i]);
                    const r = p.map(sokudo, 0, 5, p.hueRangeMin, p.hueRangeMax); 
                    const g = p.map(sokudo, 0, 5, 75, 100);
                    const b = p.map(sokudo, 0, 5, 75, 100);
                    p.fill(r, g, b, 0.1);
                    p.ellipse(p.x[i], p.y[i], p.radius, p.radius);
                }
            }
        }

        p.executeCueSet1 = (note) => {
            const { currentCue } = note;
            if(currentCue % 4 === 1) {
                p.clear();
            }
            p.touchX = p.random(0, p.width);
            p.touchY = p.random(0, p.height);
            p.hueRangeMin = p.random(p.hueOptions);
            p.hueRangeMax = p.hueRangeMin + 30;
            p.magnetism = p.random(88, 444);
        }

        p.coOrds = [];

        p.generateCoOrds = () => {
            p.coOrds = [];
            for (let i = 0; i < 2; i++) {
                p.coOrds.push(
                    {
                        x: p.random((p.width / 2) * i, (p.width / 2) * i + (p.width / 2)),
                        y: p.random(0, (p.height / 2))
                    }
                )
            }
            for (let i = 0; i < 2; i++) {
                p.coOrds.push(
                    {
                        x: p.random((p.width / 2) * i, (p.width / 2) * i + (p.width / 2)),
                        y: p.random((p.height / 2), p.height)
                    }
                )
            }
            p.coOrds = p.shuffle(p.coOrds);
        }

        p.hasStarted = false;

        p.mousePressed = () => {
            if(p.audioLoaded){
                if (p.song.isPlaying()) {
                    p.song.pause();
                } else {
                    if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                        p.reset();
                        if (typeof window.dataLayer !== typeof undefined){
                            window.dataLayer.push(
                                { 
                                    'event': 'play-animation',
                                    'animation': {
                                        'title': document.title,
                                        'location': window.location.href,
                                        'action': 'replaying'
                                    }
                                }
                            );
                        }
                    }
                    document.getElementById("play-icon").classList.add("fade-out");
                    p.canvas.addClass("fade-in");
                    p.song.play();
                    if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'start playing'
                                }
                            }
                        );
                        p.hasStarted = false
                    }
                }
            }
        }

        p.creditsLogged = false;

        p.logCredits = () => {
            if (
                !p.creditsLogged &&
                parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)
            ) {
                p.creditsLogged = true;
                    console.log(
                    "Music By: http://labcat.nz/",
                    "\n",
                    "Animation By: https://github.com/LABCAT/"
                );
                p.song.stop();
            }
        };

        p.reset = () => {

        }

        p.updateCanvasDimensions = () => {
            p.canvasWidth = window.innerWidth;
            p.canvasHeight = window.innerHeight;
            p.canvas = p.resizeCanvas(p.canvasWidth, p.canvasHeight);
        }

        if (window.attachEvent) {
            window.attachEvent(
                'onresize',
                function () {
                    p.updateCanvasDimensions();
                }
            );
        }
        else if (window.addEventListener) {
            window.addEventListener(
                'resize',
                function () {
                    p.updateCanvasDimensions();
                },
                true
            );
        }
        else {
            //The browser does not support Javascript event binding
        }
    };

    useEffect(() => {
        new p5(Sketch, sketchRef.current);
    }, []);

    return (
        <div ref={sketchRef}>
            <PlayIcon />
        </div>
    );
};

export default P5SketchWithAudio;
