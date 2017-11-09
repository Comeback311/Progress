'use strict';

if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', init, false);
}

window.onload = init;

// ---------

class loader {

	constructor(options = {}) {

		// Толщина окружности
		this.lineHeight = options.lineHeight || 8;

		// Dom - element
		if(! ('canvas' in options) )
			return false;

		this.canvas = (typeof(options.canvas) === 'object') ? options.canvas : false;
		this.context = this.canvas.getContext('2d');

		// Элемент, который скрывается при активации чекбокса "hide"
		this.progressElem = options.progressElem || false;

		// Шаг анимации
		this.step = options.step || 5;

		this.limit = 0;

		this.last = 0;

		this.degree = 0;

		// Радиус лоадера
		this.radius = (this.canvas.width > this.canvas.height) ? 
			(this.canvas.height / 2) : 
			(this.canvas.width / 2);

		// Положение лоадера
		this.y = this.canvas.height / 2;
		this.x = this.canvas.width / 2;

		// Начальный вывод лоадера
		this.fillCircle();
		this.insideCircle();

		// Polyfill для requestAnimationFrame
		this.polyfillRequestAnimationFrame();
	}	

	set animate(value) { 
		this.isAnimate = value;
	}

	set hide(value) {
		this.isHidden = value;
	}

	run(limit = 0) {

		if(!this.canvas)
			return false;

		if(limit > 100 || limit < 0 || isNaN(limit)) 
			return false;

		this.limit = Math.floor(limit * 360 / 100);

		// Элемент скрыт
		if(this.progressElem && hasClass(this.progressElem, 'progress_hidden'))
			return false;

		// Если подряд введено одно и то же значение
		if(this.limit == this.last)
			return false;

		// Отключена анимация
		if(!this.isAnimate) {	

			this.degree = this.limit;

			// Рисование лоадера
			this.draw();
			return true;
		}

		this.degree = this.last;

		// Сброс текущей анимации, если была
		window.cancelAnimationFrame(this.requestId);

		// Сама анимация
		this.loading();
	}

	loading() {

		let step = this.step;

		// Против часовой стрелки
		if(this.last > this.limit) {

			step = (this.degree + step < this.limit) ? (this.limit - this.degree) : this.step;
			this.degree = ((this.degree - step) > 0) ? (this.degree - step) : 0;

			if(this.degree > this.limit) 
				this.requestId = requestAnimationFrame(() => this.loading());

		// По часовой стрелке
		} else {

			step = (this.degree + step > this.limit) ? (this.limit - this.degree) : this.step;
			this.degree += step;

			if(this.degree < this.limit) 
				this.requestId = requestAnimationFrame(() => this.loading());
		}

		// Рисование лоадера
		this.draw();
	}

	// Рисование лоадера
	draw() {

		this.clearCanvas();

		// Внешняя часть
		this.fillCircle();

		// Полоска
		this.fillCircleMark();

		// Внутренняя белая часть
		this.insideCircle();

		// Запоминаем предыдущее значение
		this.last = this.degree;
	}

	// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
	// MIT license
	polyfillRequestAnimationFrame() {

		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
			|| window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
					timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			}
		}

		if (!window.cancelAnimationFrame) {

	        window.cancelAnimationFrame = function(id) {
	            clearTimeout(id);
	        };
	    }
	}

	clearCanvas() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	fillCircleMark() {

		let context = this.context;

		context.fillStyle = '#FFDB4D'; // yellow
		context.beginPath();
		context.moveTo(this.x, this.y);
		context.arc(this.x, this.y, this.radius, 0, (Math.PI * this.degree / 180), false);
		context.lineTo(this.x, this.y);
		context.fill();
	}

	fillCircle() {

		let context = this.context;

		context.fillStyle = '#EFEFEC'; // gray
		context.beginPath();
		context.moveTo(this.x, this.y);
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		context.lineTo(this.x, this.y);
		context.fill();
	}

	insideCircle() {

		let context = this.context,
		radius = this.radius - this.lineHeight;

		context.beginPath();
		context.arc(this.x, this.y, radius, 0, 2 * Math.PI, true);
		context.fillStyle = '#fff';
		context.fill();
	}
}

function init() {
	
	let canvas 		 = getFirstByClass('progress__loader'),
		progress     = getFirstByClass('progress');

	let options = {
		canvas: canvas, // Canvas (!обязательный)
		lineHeight: 8,  // Толщина окружности
		step: 5,		// Шаг анимации
		progressElem: progress // Элемент, который скрывается при активации чекбокса "hide"
	}	

	let load = new loader(options);

	// -------
	// События
	// -------

	let inputElem       = getById('input-value'),
		hideCheckbox    = getById('checkbox-hide'),
		animateCheckbox = getById('checkbox-animate');

	// Включена анимация ?
	animateCheckbox.onchange = (e) => load.animate = e.target.checked;

	// Непосредственно запуск анимации
	inputElem.oninput = (e) => load.run(e.target.value);

	// Скрыт / Показан блок
	hideCheckbox.onchange = (e) => { 

		let elem = getFirstByClass('progress');

		(e.target.checked === true) ? 
		addClass(elem, 'progress_hidden') : 
		removeClass(elem, 'progress_hidden')
	}
}


// ---------
// Functions
// ---------


function addClass(elem, className) {
	
	className = ` ${className}`;
	elem.className += (elem.className.indexOf(className) === -1) ? className : '';
}

function removeClass(elem, className) {
	
	className = ` ${className}`;
	elem.className = elem.className.replace(className, '');
}

function hasClass(elem, className) {
	return (elem.className.indexOf(className) !== -1);
}

function getById(id) {
	return (typeof id === 'string' || typeof id === 'number') ? 
		document.getElementById(id) : id;
}

function getFirstByClass(className) {
	return (typeof className === 'string' || typeof className === 'number') ?
		document.getElementsByClassName(className)[0] : false;
}
