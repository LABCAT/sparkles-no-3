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

        p.numOfLoops = 1000;
        p.vx = new Array(p.numOfLoops);
        p.vy = new Array(p.numOfLoops);
        p.x = new Array(p.numOfLoops);
        p.y = new Array(p.numOfLoops);
        p.ax = new Array(p.numOfLoops);
        p.ay = new Array(p.numOfLoops);
        p.touchX = 0;
        p.touchY = 0;

        p.magnetism = 20.0;
        p.radius = 1;
        p.gensoku = 0.95; // principle

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.noStroke(); 
            p.fill(0);
            p.ellipseMode(p.RADIUS);
            p.background(0);
            p.blendMode(p.ADD);
            
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
                p.fill(0,0,0);
                p.rect(0,0,p.width,p.height);
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
                    const r = p.map(sokudo, 0, 5, 0, 255); 
                    const g = p.map(sokudo, 0, 5, 64, 255);
                    // const b = p.map(sokudo, 0, 5, 0, 128);
                    // const r = p.random(0, 255);
                    // const g = p.random(128, 255);
                    const b = p.random(0, 128);
                    p.fill(r, g, b, 64);
                    p.ellipse(p.x[i], p.y[i], p.radius, p.radius);
                }
            }
        }

        p.executeCueSet1 = (note) => {
            p.touchX = p.random(0, p.width);
            p.touchY = p.random(0, p.height);
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
