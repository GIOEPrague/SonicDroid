
// #####################
// the following two functions are heavily based on the Realtime Visual Analyzer from the original Web Audio examples
// http://chromium.googlecode.com/svn/trunk/samples/audio/visualizer-gl.html
// I've modified the code to work with my original Audio Data API visualizer code by calling my visualizer loop and directing the frame buffer event at my event handler
// #####################
// original code copyright:
/*
Copyright 2010, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
    * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
// #####################

Array.prototype.avg = function() {
	var av = 0;
	var cnt = 0;
	var len = this.length;
	for (var i = 0; i < len; i++) {
		var e = +this[i];
		if(!e && this[i] !== 0 && this[i] !== '0') e--;
		if (this[i] == e) {av += e; cnt++;}
	}
	return av/cnt;
}

// ###############################

var context;
var source = 0;
var jsProcessor = 0;


function loadSample(url) {
    // Load asynchronously

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() { 
        source.buffer = context.createBuffer(request.response, false);
        source.looping = true;
        source.noteOn(0);
		visualizer();				// run jsfft visualizer
    }

    request.send();
}


function initAudio(songName) {
    context = new webkitAudioContext();
    source = context.createBufferSource();

    // This AudioNode will do the amplitude modulation effect directly in JavaScript
    jsProcessor = context.createJavaScriptNode(2048);
    jsProcessor.onaudioprocess = audioAvailable;			// run jsfft audio frame event
    
    // Connect the processing graph: source -> jsProcessor -> analyser -> destination
    source.connect(jsProcessor);
    jsProcessor.connect(context.destination);

    var SONG1 = "Truth_2_Jon_Gilham_short.mp3";
    var SONG2 = "02 R.Against - Help is On The Way.mp3";
    var SONG3 = "07 R.Against - Survivor Guilt.mp3";
    var SONG4 = "024.-Bedřich-Smetana---Má-Vlast---Vltava.mp3";
    var SONG5 = "test.mp3";

    // Load the sample buffer for the audio source
    loadSample("files/"+songName+".mp3");
}

// #####################
// end of Google Web Audio code fragment
// #####################


maxvalue = new Array();
for (a=0;a<1024;a++) {
	maxvalue[a] = 0;
}

currentvalue = new Array();

var frameBufferSize = 4096;
var bufferSize = frameBufferSize/4;

var signal = new Float32Array(bufferSize);
var peak = new Float32Array(bufferSize);

var fft = new FFT(bufferSize, 44100);


var canvas = document.getElementById('fft');
var ctx = canvas.getContext('2d');


function audioAvailable(event) {

	// Copy input arrays to output arrays to play sound
	var inputArrayL = event.inputBuffer.getChannelData(0);
	var inputArrayR = event.inputBuffer.getChannelData(1);
	var outputArrayL = event.outputBuffer.getChannelData(0);
	var outputArrayR = event.outputBuffer.getChannelData(1);
	
	var n = inputArrayL.length;
	for (var i = 0; i < n; ++i) {
		outputArrayL[i] = inputArrayL[i];
		outputArrayR[i] = inputArrayR[i];
		signal[i] = (inputArrayL[i] + inputArrayR[i]) / 2;		// create data frame for fft - deinterleave and mix down to mono
	}
	
	// perform forward transform
	fft.forward(signal);
	
	for ( var i = 0; i < bufferSize/8; i++ ) {
		magnitude = fft.spectrum[i] * 8000; 					// multiply spectrum by a zoom value
		
		currentvalue[i] = magnitude;
		
		if (magnitude > maxvalue[i]) {
			maxvalue[i] = magnitude;
		} else {
			if (maxvalue[i] > 10) {
				maxvalue[i]--;
			}
		}
	
	}
	
}
function visualizer() {

    currentvalue1 = new Array();

	ctx.clearRect(0,0, canvas.width, canvas.height);

	ctx.fillStyle = '#000044';
	for (var i=0; i<currentvalue.length; i++) {
        if (currentvalue[i] > 30) {
            currentvalue1.push(currentvalue[i]);
    		// Draw rectangle bars for each frequency bin
    		ctx.fillRect(i * 8, canvas.height, 7, -currentvalue[i]*3);
        }
	}

    console.log(currentvalue.avg());

	t = setTimeout("visualizer()", 1000);
}
