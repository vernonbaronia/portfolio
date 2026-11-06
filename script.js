/* =========================================================
   Jade Vernon A. Baronia — Portfolio
   Interactions: theme, sound, cursor, background, navigation
   ========================================================= */
(function () {
	'use strict';

	var docEl = document.documentElement;
	var introEl = document.getElementById('intro');
	var entered = !introEl;
	var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	/* =====================================================
	   Theme — light / dark
	   The initial value is set by an inline script in <head>,
	   so the page never paints in the wrong theme.
	   ===================================================== */
	var Theme = (function () {
		var KEY = 'jvb-theme';
		var ACCENT_KEY = 'jvb-accent';
		var ACCENTS = ['blue', 'violet', 'emerald', 'rose', 'amber', 'teal'];
		var meta = document.getElementById('meta-theme');
		var button = document.getElementById('theme-toggle');
		var introButton = document.getElementById('intro-theme-toggle');

		function current() {
			return docEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
		}

		function stored() {
			try {
				return window.localStorage.getItem(KEY);
			} catch (e) {
				return null;
			}
		}

		function paintButton(btn, dark) {
			if (!btn) return;
			var icon = btn.querySelector('i');
			btn.setAttribute('aria-pressed', String(dark));
			btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
			btn.setAttribute('title', dark ? 'Light mode — click to switch' : 'Dark mode — click to switch');
			btn.setAttribute('data-label', dark ? 'Light mode' : 'Dark mode');
			if (icon) {
				icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
			}
		}

		function paintMeta() {
			if (!meta) return;
			var dark = current() === 'dark';
			var value;
			if (dark) {
				value = getComputedStyle(docEl).getPropertyValue('--body-bg').trim() || '#0a1424';
			} else {
				value = getComputedStyle(docEl).getPropertyValue('--accent').trim() || '#2563eb';
			}
			meta.setAttribute('content', value);
		}

		function paint() {
			var dark = current() === 'dark';

			paintMeta();

			paintButton(button, dark);
			paintButton(introButton, dark);
		}

		function currentAccent() {
			var a = docEl.getAttribute('data-accent');
			return ACCENTS.indexOf(a) !== -1 ? a : 'blue';
		}

		function applyAccent(next) {
			docEl.setAttribute('data-accent', next);
			try {
				window.localStorage.setItem(ACCENT_KEY, next);
			} catch (e) {
				/* storage blocked — the colour still works for this visit */
			}
			paintMeta();
		}

		function setAccent(next) {
			if (ACCENTS.indexOf(next) === -1) next = 'blue';
			if (next === currentAccent()) {
				paintMeta();
				return;
			}

			var run = function () {
				applyAccent(next);
			};

			if (!prefersReduced && typeof document.startViewTransition === 'function') {
				document.startViewTransition(run);
			} else {
				run();
			}
		}

		function apply(next) {
			docEl.setAttribute('data-theme', next);
			try {
				window.localStorage.setItem(KEY, next);
			} catch (e) {
				/* storage blocked — the theme still works for this visit */
			}
			paint();
		}

		function set(next, origin) {
			if (next === current()) {
				paint();
				return;
			}

			var canReveal = !prefersReduced && typeof document.startViewTransition === 'function';

			if (!canReveal) {
				apply(next);
				return;
			}

			var rect = origin ? origin.getBoundingClientRect() : null;
			var x = rect ? rect.left + rect.width / 2 : window.innerWidth - 60;
			var y = rect ? rect.top + rect.height / 2 : window.innerHeight - 60;
			var radius = Math.hypot(
				Math.max(x, window.innerWidth - x),
				Math.max(y, window.innerHeight - y)
			);

			var transition = document.startViewTransition(function () {
				apply(next);
			});

			transition.ready.then(function () {
				docEl.animate(
					{
						clipPath: [
							'circle(0px at ' + x + 'px ' + y + 'px)',
							'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'
						]
					},
					{
						duration: 620,
						easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
						pseudoElement: '::view-transition-new(root)'
					}
				);
			}).catch(function () {
				/* the transition was skipped — the theme is already applied */
			});
		}

		function toggle(origin) {
			var next = current() === 'dark' ? 'light' : 'dark';
			var from = origin || button;

			[button, introButton].forEach(function (btn) {
				if (!btn) return;
				btn.classList.remove('is-spinning');
				void btn.offsetWidth;
				btn.classList.add('is-spinning');
				window.setTimeout(function () {
					btn.classList.remove('is-spinning');
				}, 620);
			});

			set(next, from);
		}

		if (button) {
			button.addEventListener('click', function () {
				toggle(button);
			});
		}

		if (introButton) {
			introButton.addEventListener('click', function () {
				toggle(introButton);
			});
		}

		/* Follow the OS while the visitor has not chosen a side */
		var system = window.matchMedia('(prefers-color-scheme: dark)');

		function followSystem(event) {
			if (stored()) return;
			set(event.matches ? 'dark' : 'light', null);
		}

		if (typeof system.addEventListener === 'function') {
			system.addEventListener('change', followSystem);
		} else if (typeof system.addListener === 'function') {
			system.addListener(followSystem);
		}

		paint();

		return { paint: paint, current: current, set: set, setAccent: setAccent, currentAccent: currentAccent };
	})();

	/* =====================================================
	   Accent colour picker
	   ===================================================== */
	var paletteToggles = Array.prototype.slice.call(
		document.querySelectorAll('.palette-toggle')
	);
	var palettePanel = document.getElementById('palette-panel');
	var paletteSwatches = Array.prototype.slice.call(
		document.querySelectorAll('#palette-swatches .swatch')
	);

	var paintSwatches = function () {
		var current = Theme.currentAccent();
		paletteSwatches.forEach(function (swatch) {
			var isActive = swatch.getAttribute('data-accent') === current;
			swatch.classList.toggle('active', isActive);
			swatch.setAttribute('aria-checked', String(isActive));
		});
	};

	var paintToggles = function (activeToggle) {
		paletteToggles.forEach(function (toggle) {
			var isActive = toggle === activeToggle;
			toggle.classList.toggle('is-active', isActive);
			toggle.setAttribute('aria-expanded', String(isActive));
		});
	};

	var openPalette = function (toggle) {
		if (!palettePanel) return;
		palettePanel.classList.add('is-open');
		palettePanel.classList.toggle('is-intro', !!toggle && toggle.classList.contains('intro-palette-toggle'));
		paintToggles(toggle);
	};

	var closePalette = function () {
		if (!palettePanel) return;
		palettePanel.classList.remove('is-open');
		palettePanel.classList.remove('is-intro');
		paintToggles(null);
	};

	if (palettePanel) {
		paletteToggles.forEach(function (toggle) {
			toggle.addEventListener('click', function () {
				if (palettePanel.classList.contains('is-open') && toggle.classList.contains('is-active')) {
					closePalette();
				} else {
					openPalette(toggle);
				}
			});
		});

		document.addEventListener('click', function (event) {
			if (!palettePanel.classList.contains('is-open')) return;
			var target = event.target;
			if (target && target.closest &&
				(target.closest('#palette-panel') || target.closest('.palette-toggle'))) return;
			closePalette();
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') closePalette();
		});

		paletteSwatches.forEach(function (swatch) {
			swatch.addEventListener('click', function () {
				Theme.setAccent(swatch.getAttribute('data-accent'));
				paintSwatches();
			});
		});

		paintSwatches();
	}

	/* =====================================================
	   Sound — generated with the Web Audio API, so there
	   are no audio files to download.
	   ===================================================== */
	var Sound = (function () {
		var ctx = null;
		var enabled = true;

		try {
			enabled = window.localStorage.getItem('jvb-sound') !== 'off';
		} catch (e) {
			/* storage blocked — keep the default */
		}

		function context() {
			if (!ctx) {
				var AudioCtor = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtor) return null;
				ctx = new AudioCtor();
			}
			if (ctx.state === 'suspended') {
				ctx.resume();
			}
			return ctx;
		}

		function tone(options) {
			var audio = context();
			if (!audio) return;

			var now = audio.currentTime;
			var osc = audio.createOscillator();
			var gain = audio.createGain();

			osc.type = options.type || 'sine';
			osc.frequency.setValueAtTime(options.from, now);
			osc.frequency.exponentialRampToValueAtTime(options.to, now + options.dur);

			gain.gain.setValueAtTime(0.0001, now);
			gain.gain.exponentialRampToValueAtTime(options.vol, now + 0.008);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + options.dur);

			osc.connect(gain);
			gain.connect(audio.destination);
			osc.start(now);
			osc.stop(now + options.dur + 0.03);
		}

		return {
			isEnabled: function () {
				return enabled;
			},
			setEnabled: function (value) {
				enabled = value;
				try {
					window.localStorage.setItem('jvb-sound', value ? 'on' : 'off');
				} catch (e) {
					/* ignore */
				}
			},
			click: function () {
				if (!enabled) return;
				tone({ from: 880, to: 640, dur: 0.085, vol: 0.05, type: 'sine' });
				tone({ from: 1560, to: 1180, dur: 0.05, vol: 0.018, type: 'triangle' });
			},
			nav: function () {
				if (!enabled) return;
				tone({ from: 540, to: 760, dur: 0.13, vol: 0.042, type: 'sine' });
			},
			on: function () {
				tone({ from: 520, to: 880, dur: 0.16, vol: 0.05, type: 'sine' });
			},
			off: function () {
				tone({ from: 760, to: 420, dur: 0.14, vol: 0.04, type: 'sine' });
			}
		};
	})();

	/* =====================================================
	   Opening page — click anywhere, or press Enter / Space
	   Registered early so a later script error can never
	   leave the visitor stuck on the intro.
	   ===================================================== */
	if (introEl && !entered) {
		/* Keep the page behind the intro out of the tab order */
		var behindIntro = Array.prototype.slice.call(
			document.querySelectorAll('main, nav, .deck-controls, .corner-controls')
		);
		behindIntro.forEach(function (el) {
			el.inert = true;
		});

		/* Warm every face the homepage uses straight away, so a
		   cold cache can never swap fonts while the intro fades. */
		var fontFaces = [
			'600 1em Caveat',
			'400 1em Inter',
			'500 1em Inter',
			'600 1em Inter',
			'500 1em "Space Grotesk"',
			'600 1em "Space Grotesk"',
			'700 1em "Space Grotesk"'
		];
		if (document.fonts && document.fonts.load) {
			fontFaces.forEach(function (face) {
				try {
					document.fonts.load(face).catch(function () {});
				} catch (e) {}
			});
		}

		var fontsAreReady = function () {
			if (!document.fonts || !document.fonts.check) return true;
			return fontFaces.every(function (face) {
				try { return document.fonts.check(face); } catch (e) { return true; }
			});
		};

		var autoEnterTimer = null;

		var enterSite = function (fromKeyboard, originX, originY) {
			if (entered) return;
			entered = true;

			if (autoEnterTimer) window.clearTimeout(autoEnterTimer);

			Sound.click();

			closePalette();

			behindIntro.forEach(function (el) {
				el.inert = false;
			});

			var x = typeof originX === 'number' ? originX : window.innerWidth / 2;
			var y = typeof originY === 'number' ? originY : window.innerHeight / 2;

			var reveal = function () {
				/* Camera-lens (iris) transition: close to black, then open onto the homepage. */
				var iris = document.getElementById('iris');
				if (iris) {
					iris.classList.remove('is-playing');
					void iris.offsetWidth;
					iris.classList.add('is-playing');
				}

				/* Swap intro → homepage at the midpoint (screen is fully black). */
				window.setTimeout(function () {
					introEl.hidden = true;
					document.body.classList.remove('is-intro');
					document.body.classList.add('is-entered');
					document.dispatchEvent(new CustomEvent('jvb:entered'));
				}, 500);

				window.setTimeout(function () {
					if (fromKeyboard) {
						var firstTab = document.getElementById('home-menu-about') ||
							document.getElementById('nav-about');
						if (firstTab) firstTab.focus({ preventScroll: true });
					}
				}, 1050);
			};

			/* If a font is still in flight, let it land first (with
			   a short cap) so the reveal never shows a font swap. */
			if (fontsAreReady() || !document.fonts || !document.fonts.ready) {
				reveal();
				return;
			}

			var revealed = false;
			var go = function () {
				if (revealed) return;
				revealed = true;
				reveal();
			};
			var timer = window.setTimeout(go, 400);
			document.fonts.ready.then(function () {
				window.clearTimeout(timer);
				go();
			}, function () {
				window.clearTimeout(timer);
				go();
			});
		};

		introEl.addEventListener('click', function (event) {
			if (event.target && event.target.closest && event.target.closest('.intro-controls')) return;
			enterSite(false, event.clientX, event.clientY);
		});

		/* Any key press on the intro page enters, not just a click */
		document.addEventListener('keydown', function (event) {
			if (entered) return;
			if (event.target && event.target.closest && event.target.closest('.intro-controls')) return;
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
				event.preventDefault();
				enterSite(true);
			}
		});

		/* Enter automatically after a short delay */
		autoEnterTimer = window.setTimeout(function () {
			if (!entered) enterSite(false);
		}, 3200);
	}

	/* One delegated listener for every clickable thing */
	document.addEventListener('click', function (event) {
		var target = event.target && event.target.closest
			? event.target.closest('a, button, [role="tab"], [role="button"]')
			: null;

		if (!target || target.id === 'sound-toggle' || target.id === 'intro') return;

		if (target.matches('nav ul li')) {
			Sound.nav();
		} else {
			Sound.click();
		}
	});

	/* Sound toggle */
	var soundToggle = document.getElementById('sound-toggle');

	if (soundToggle) {
		var soundIcon = soundToggle.querySelector('i');

		var paintSound = function () {
			var on = Sound.isEnabled();
			soundToggle.setAttribute('aria-pressed', String(on));
			soundToggle.setAttribute('aria-label', on ? 'Mute interface sounds' : 'Enable interface sounds');
			soundToggle.setAttribute('data-label', on ? 'Sound on' : 'Sound off');
			soundToggle.setAttribute('title', on ? 'Sound on — click to mute' : 'Sound off — click to enable');
			soundToggle.classList.toggle('is-muted', !on);
			if (soundIcon) {
				soundIcon.className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
			}
		};

		soundToggle.addEventListener('click', function () {
			if (Sound.isEnabled()) {
				Sound.off();
				Sound.setEnabled(false);
			} else {
				Sound.setEnabled(true);
				Sound.on();
			}
			paintSound();
		});

		paintSound();
	}

	/* =====================================================
	   Custom cursor
	   ===================================================== */
	var dot = document.getElementById('cursor-dot');
	var ring = document.getElementById('cursor-ring');

	if (finePointer && dot && ring) {
		docEl.classList.add('has-custom-cursor');

		var mouseX = window.innerWidth / 2;
		var mouseY = window.innerHeight / 2;
		var ringX = mouseX;
		var ringY = mouseY;
		var visible = false;

		window.addEventListener('pointermove', function (event) {
			mouseX = event.clientX;
			mouseY = event.clientY;

			if (!visible) {
				visible = true;
				ringX = mouseX;
				ringY = mouseY;
				dot.classList.remove('is-hidden');
				ring.classList.remove('is-hidden');
			}

			dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0)';
		}, { passive: true });

		document.addEventListener('pointerover', function (event) {
			var interactive = event.target && event.target.closest
				? event.target.closest('a, button, [role="tab"], [role="button"], .photo-frame, .icon-btn')
				: null;
			dot.classList.toggle('is-hover', !!interactive);
			ring.classList.toggle('is-hover', !!interactive);
		});

		window.addEventListener('pointerdown', function () {
			ring.classList.add('is-down');
		});

		window.addEventListener('pointerup', function () {
			ring.classList.remove('is-down');
		});

		document.addEventListener('mouseleave', function () {
			visible = false;
			dot.classList.add('is-hidden');
			ring.classList.add('is-hidden');
		});

		(function trail() {
			var ease = prefersReduced ? 1 : 0.45;
			ringX += (mouseX - ringX) * ease;
			ringY += (mouseY - ringY) * ease;
			ring.style.transform = 'translate3d(' + ringX.toFixed(2) + 'px,' + ringY.toFixed(2) + 'px,0)';
			window.requestAnimationFrame(trail);
		})();
	}

	/* =====================================================
	   Cursor spotlight — a soft light that follows the pointer
	   ===================================================== */
	var spotlight = document.getElementById('spotlight');

	if (spotlight && finePointer) {
		docEl.classList.add('has-spotlight');

		var spotTargetX = window.innerWidth / 2;
		var spotTargetY = window.innerHeight / 2;
		var spotX = spotTargetX;
		var spotY = spotTargetY;

		window.addEventListener('pointermove', function (event) {
			spotTargetX = event.clientX;
			spotTargetY = event.clientY;
		}, { passive: true });

		(function spotLoop() {
			var ease = prefersReduced ? 1 : 0.12;
			spotX += (spotTargetX - spotX) * ease;
			spotY += (spotTargetY - spotY) * ease;
			spotlight.style.transform = 'translate3d(' + spotX.toFixed(1) + 'px,' + spotY.toFixed(1) + 'px,0)';
			window.requestAnimationFrame(spotLoop);
		})();
	}

	/* =====================================================
	   Background — sparkles + gentle parallax
	   ===================================================== */
	var sparkleLayer = document.getElementById('sparkles');

	if (sparkleLayer && !prefersReduced) {
		var frag = document.createDocumentFragment();

		for (var i = 0; i < 8; i++) {
			var spark = document.createElement('span');
			var size = 4 + Math.random() * 5;

			spark.className = 'spark';
			spark.style.left = (Math.random() * 100).toFixed(2) + '%';
			spark.style.top = (Math.random() * 100).toFixed(2) + '%';
			spark.style.width = size.toFixed(1) + 'px';
			spark.style.height = size.toFixed(1) + 'px';
			spark.style.animationDelay = (-Math.random() * 20).toFixed(2) + 's';
			spark.style.animationDuration = (16 + Math.random() * 14).toFixed(1) + 's';
			frag.appendChild(spark);
		}

		sparkleLayer.appendChild(frag);
	}

	var scene = document.querySelector('.bg-scene');

	if (scene && finePointer && !prefersReduced) {
		var targetX = 0;
		var targetY = 0;
		var currentX = 0;
		var currentY = 0;

		window.addEventListener('pointermove', function (event) {
			targetX = (event.clientX / window.innerWidth - 0.5) * 2;
			targetY = (event.clientY / window.innerHeight - 0.5) * 2;
		}, { passive: true });

		(function parallax() {
			currentX += (targetX - currentX) * 0.05;
			currentY += (targetY - currentY) * 0.05;
			scene.style.setProperty('--px', (currentX * 18).toFixed(2) + 'px');
			scene.style.setProperty('--py', (currentY * 18).toFixed(2) + 'px');
			window.requestAnimationFrame(parallax);
		})();
	}

	/* =====================================================
	   Photo tilt
	   ===================================================== */
	var frame = document.getElementById('photo-frame');

	if (frame && finePointer && !prefersReduced) {
		var frameRect = null;

		frame.addEventListener('pointerenter', function () {
			frameRect = frame.getBoundingClientRect();
		});

		frame.addEventListener('pointermove', function (event) {
			if (!frameRect) frameRect = frame.getBoundingClientRect();
			var px = (event.clientX - frameRect.left) / frameRect.width - 0.5;
			var py = (event.clientY - frameRect.top) / frameRect.height - 0.5;
			frame.style.transform = 'perspective(1000px) rotateX(' +
				(-py * 7).toFixed(2) + 'deg) rotateY(' +
				(px * 7).toFixed(2) + 'deg)';
		});

		frame.addEventListener('pointerleave', function () {
			frame.style.transform = '';
			frameRect = null;
		});
	}

	/* =====================================================
	   Placeholder cards — gentle 3D tilt
	   ===================================================== */
	if (finePointer && !prefersReduced) {
		var soonCards = Array.prototype.slice.call(
			document.querySelectorAll('.coming-soon')
		);

		soonCards.forEach(function (card) {
			var rect = null;

			card.addEventListener('pointerenter', function () {
				rect = card.getBoundingClientRect();
			});

			card.addEventListener('pointermove', function (event) {
				if (!rect) rect = card.getBoundingClientRect();
				var px = (event.clientX - rect.left) / rect.width - 0.5;
				var py = (event.clientY - rect.top) / rect.height - 0.5;
				card.style.transform = 'perspective(900px) rotateX(' +
					(-py * 4).toFixed(2) + 'deg) rotateY(' +
					(px * 4).toFixed(2) + 'deg)';
			});

			card.addEventListener('pointerleave', function () {
				card.style.transform = '';
				rect = null;
			});
		});
	}

	/* =====================================================
	   Magnetic buttons — they lean towards the cursor
	   ===================================================== */
	if (finePointer && !prefersReduced) {
		var magnets = Array.prototype.slice.call(
			document.querySelectorAll('.icon-btn, .nav-btn, .orb-btn, .swatch')
		);

		magnets.forEach(function (element) {
			var strength = element.classList.contains('icon-btn') ? 7 : 4;
			var rect = null;

			element.addEventListener('pointerenter', function () {
				rect = element.getBoundingClientRect();
			});

			element.addEventListener('pointermove', function (event) {
				if (!rect) rect = element.getBoundingClientRect();
				var dx = event.clientX - (rect.left + rect.width / 2);
				var dy = event.clientY - (rect.top + rect.height / 2);
				element.style.setProperty('--mag-x', (dx / rect.width * strength * 2).toFixed(2) + 'px');
				element.style.setProperty('--mag-y', (dy / rect.height * strength * 2).toFixed(2) + 'px');
			});

			element.addEventListener('pointerleave', function () {
				element.style.setProperty('--mag-x', '0px');
				element.style.setProperty('--mag-y', '0px');
				rect = null;
			});
		});
	}

	/* =====================================================
	   Time-aware greeting — "a pleasant morning" and so on.
	   Re-checked while the page stays open.
	   ===================================================== */
	var greeting = document.getElementById('greeting');
	var greetingText = document.getElementById('greeting-text');

	if (greeting && greetingText) {
		var lastGreeting = '';

		function greetingFor(hour) {
			if (hour < 5) return 'still up?';
			if (hour < 12) return 'a pleasant morning';
			if (hour < 18) return 'a pleasant afternoon';
			return 'a pleasant evening';
		}

		function paintGreeting(animate) {
			var next = greetingFor(new Date().getHours());
			if (next === lastGreeting) return;
			lastGreeting = next;

			if (!animate || prefersReduced) {
				greetingText.textContent = next;
				return;
			}

			greeting.classList.add('is-swapping');
			window.setTimeout(function () {
				greetingText.textContent = next;
				greeting.classList.remove('is-swapping');
			}, 220);
		}

		paintGreeting(false);

		window.setInterval(function () {
			paintGreeting(true);
		}, 30000);

		document.addEventListener('visibilitychange', function () {
			if (!document.hidden) paintGreeting(true);
		});
	}

	/* =====================================================
	   Live clock (nav left) and date (nav right)
	   Only touches the DOM when the visible text changes.
	   ===================================================== */
	var liveTime = document.getElementById('live-time');
	var liveDate = document.getElementById('live-date');
	var liveWeekday = document.getElementById('live-weekday');

	if (liveTime || liveDate || liveWeekday) {
		var timeFormat = new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
		var weekdayFormat = new Intl.DateTimeFormat('en-US', {
			weekday: 'long'
		});
		var dateFormatFull = new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
		var dateFormatCompact = new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		var compactDate = window.matchMedia('(max-width: 560px)');

		var lastTimeText = '';
		var lastTimeAttr = '';
		var lastWeekdayText = '';
		var lastDateText = '';
		var lastDateAttr = '';

		var pad2 = function (n) {
			return n < 10 ? '0' + n : String(n);
		};

		var paintClock = function () {
			var now = new Date();

			if (liveTime) {
				var timeText = timeFormat.format(now);
				if (timeText !== lastTimeText) {
					lastTimeText = timeText;
					liveTime.textContent = timeText;
				}

				var timeAttr = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
				if (timeAttr !== lastTimeAttr) {
					lastTimeAttr = timeAttr;
					liveTime.setAttribute('datetime', timeAttr);
				}

				var fullTime = now.toLocaleString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				});
				if (liveTime.title !== fullTime) liveTime.title = fullTime;
			}

			if (liveWeekday) {
				var weekdayText = weekdayFormat.format(now);
				if (weekdayText !== lastWeekdayText) {
					lastWeekdayText = weekdayText;
					liveWeekday.textContent = weekdayText;
				}
			}

			if (liveDate) {
				var dateText = (compactDate.matches ? dateFormatCompact : dateFormatFull).format(now);
				if (dateText !== lastDateText) {
					lastDateText = dateText;
					liveDate.textContent = dateText;
				}

				var dateAttr = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
				if (dateAttr !== lastDateAttr) {
					lastDateAttr = dateAttr;
					liveDate.setAttribute('datetime', dateAttr);
				}

				var fullDate = now.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				if (liveDate.title !== fullDate) liveDate.title = fullDate;
			}
		};

		paintClock();
		window.setInterval(paintClock, 1000);

		document.addEventListener('visibilitychange', function () {
			if (!document.hidden) paintClock();
		});

		var onDateFormatChange = function () {
			lastDateText = '';
			paintClock();
		};

		if (compactDate.addEventListener) {
			compactDate.addEventListener('change', onDateFormatChange);
		} else if (compactDate.addListener) {
			compactDate.addListener(onDateFormatChange);
		}
	}

	/* =====================================================
	   Typed role line — "Aspiring [profession]"
	   Deletes the current role, then types the next one.
	   ===================================================== */
	var typedRole = document.getElementById('typed-role');

	if (typedRole) {
		var roles = [
			'Software Engineer',
			'Embedded Systems Engineer',
			'Cloud / Infrastructure Engineer',
			'Systems Architect'
		];
		var roleIndex = 0;
		var roleTimer = 0;
		var typingStarted = false;

		var TYPE_MS = 62;
		var DELETE_MS = 34;
		var HOLD_MS = 1900;
		var GAP_MS = 380;

		var eraseRole = function () {
			var word = roles[roleIndex];
			var pos = word.length;

			var step = function () {
				pos -= 1;
				typedRole.textContent = word.slice(0, pos);

				if (pos > 0) {
					roleTimer = window.setTimeout(step, DELETE_MS);
				} else {
					roleIndex = (roleIndex + 1) % roles.length;
					roleTimer = window.setTimeout(typeRole, GAP_MS);
				}
			};

			step();
		};

		var typeRole = function () {
			var word = roles[roleIndex];
			var pos = 0;

			var step = function () {
				pos += 1;
				typedRole.textContent = word.slice(0, pos);

				if (pos < word.length) {
					roleTimer = window.setTimeout(step, TYPE_MS);
				} else {
					roleTimer = window.setTimeout(eraseRole, HOLD_MS);
				}
			};

			step();
		};

		var startTyping = function () {
			if (typingStarted) return;
			typingStarted = true;

			typedRole.textContent = roles[0];
			eraseRole();
		};

		if (entered) {
			window.setTimeout(startTyping, 2200);
		} else {
			document.addEventListener('jvb:entered', function () {
				window.setTimeout(startTyping, 2200);
			}, { once: true });
		}
	}

	/* =====================================================
	   Section navigation
	   ===================================================== */
	var navList = document.querySelector('nav ul');
	var navItems = Array.prototype.slice.call(document.querySelectorAll('nav ul li'));
	var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
	var prevBtn = document.getElementById('prev-btn');
	var nextBtn = document.getElementById('next-btn');
	var counter = document.getElementById('current-num');
	var main = document.querySelector('main');
	var currentIndex = 0;

	function pad(number) {
		return number < 10 ? '0' + number : String(number);
	}

	function sectionIndexForId(id) {
		for (var i = 0; i < sections.length; i++) {
			if (sections[i].id === id) return i;
		}
		return -1;
	}

	function navItemForSection(sectionIndex) {
		var section = sections[sectionIndex];
		if (!section) return null;
		for (var i = 0; i < navItems.length; i++) {
			if (navItems[i].getAttribute('aria-controls') === section.id) return navItems[i];
		}
		return null;
	}

	function paintPill() {
		if (!navList) return;
		var active = navItemForSection(currentIndex);

		if (!active) {
			navList.classList.remove('pill-ready');
			return;
		}

		navList.style.setProperty('--pill-x', active.offsetLeft + 'px');
		navList.style.setProperty('--pill-w', active.offsetWidth + 'px');
		navList.classList.add('pill-ready');
	}

	function revealTab() {
		var active = navItemForSection(currentIndex);
		if (!active) return;

		if (navList && navList.scrollWidth > navList.clientWidth + 1) {
			active.scrollIntoView({
				block: 'nearest',
				inline: 'center',
				behavior: prefersReduced ? 'auto' : 'smooth'
			});
		}
	}

	function updateActiveSection(index) {
		if (!sections.length) return;

		currentIndex = Math.max(0, Math.min(index, sections.length - 1));

		var currentId = sections[currentIndex].id;
		document.body.classList.toggle('is-home', currentId === 'home');
		navItems.forEach(function (item) {
			var isActive = item.getAttribute('aria-controls') === currentId;
			item.classList.toggle('active', isActive);
			item.setAttribute('aria-selected', String(isActive));
			item.setAttribute('tabindex', isActive ? '0' : '-1');
		});

		sections.forEach(function (section, i) {
			var isActive = i === currentIndex;
			section.classList.toggle('active', isActive);
			section.setAttribute('aria-hidden', String(!isActive));
			if (isActive) section.scrollTop = 0;
		});

		if (counter) {
			counter.textContent = pad(currentIndex + 1);
			counter.classList.remove('pop');
			void counter.offsetWidth;
			counter.classList.add('pop');
		}

		var atStart = currentIndex === 0;
		var atEnd = currentIndex === sections.length - 1;

		if (prevBtn) {
			prevBtn.classList.toggle('disabled', atStart);
			prevBtn.disabled = atStart;
		}

		if (nextBtn) {
			nextBtn.classList.toggle('disabled', atEnd);
			nextBtn.disabled = atEnd;
		}

		paintPill();
		revealTab();
	}

	navItems.forEach(function (item) {
		item.addEventListener('click', function () {
			var idx = sectionIndexForId(item.getAttribute('aria-controls'));
			if (idx !== -1) updateActiveSection(idx);
		});

		item.addEventListener('keydown', function (event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				var idx = sectionIndexForId(item.getAttribute('aria-controls'));
				if (idx !== -1) updateActiveSection(idx);
			}
		});
	});

	/* Home menu links jump to their section */
	var homeMenuItems = Array.prototype.slice.call(document.querySelectorAll('.home-menu-item'));
	homeMenuItems.forEach(function (item) {
		item.addEventListener('click', function () {
			var idx = sectionIndexForId(item.getAttribute('data-section'));
			if (idx !== -1) updateActiveSection(idx);
		});
	});

	/* "JB" logo returns to the Home page */
	var navLogo = document.getElementById('nav-logo');
	if (navLogo) {
		navLogo.addEventListener('click', function () {
			updateActiveSection(0);
		});
	}

	if (prevBtn) {
		prevBtn.addEventListener('click', function () {
			if (!prevBtn.disabled) updateActiveSection(currentIndex - 1);
		});
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', function () {
			if (!nextBtn.disabled) updateActiveSection(currentIndex + 1);
		});
	}

	/* Arrow keys move between sections (Home/End jump to the ends) */
	document.addEventListener('keydown', function (event) {
		if (!entered) return;

		var direction = 0;
		var target = currentIndex;

		if (event.key === 'ArrowRight') {
			direction = 1;
		} else if (event.key === 'ArrowLeft') {
			direction = -1;
		} else if (event.key === 'Home') {
			target = 0;
		} else if (event.key === 'End') {
			target = sections.length - 1;
		} else {
			return;
		}

		if (direction !== 0) {
			target = currentIndex + direction;
			if (target < 0 || target > sections.length - 1) return;
		}

		event.preventDefault();
		updateActiveSection(target);

		if (document.activeElement && document.activeElement.closest('nav')) {
			var activeItem = navItemForSection(currentIndex);
			if (activeItem) activeItem.focus();
		}
	});

	/* Swipe between sections on touch screens */
	if (main && sections.length > 1) {
		var swipeX = 0;
		var swipeY = 0;
		var swipeActive = false;

		main.addEventListener('touchstart', function (event) {
			if (event.touches.length !== 1) return;
			swipeX = event.touches[0].clientX;
			swipeY = event.touches[0].clientY;
			swipeActive = true;
		}, { passive: true });

		main.addEventListener('touchend', function (event) {
			if (!swipeActive) return;
			swipeActive = false;

			var touch = event.changedTouches[0];
			if (!touch) return;

			var dx = touch.clientX - swipeX;
			var dy = touch.clientY - swipeY;

			if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;

			updateActiveSection(currentIndex + (dx < 0 ? 1 : -1));
		}, { passive: true });
	}

	/* =====================================================
	   Achievements: show the matching photo on hover/click.
	   Cards are added later via [data-image] attributes.
	   ===================================================== */
	var achievementCards = Array.prototype.slice.call(
		document.querySelectorAll('.achievement-card')
	);
	var photoDisplay = document.getElementById('achievement-display-photo');

	if (photoDisplay) {
		achievementCards.forEach(function (card) {
			card.addEventListener('mouseenter', function () {
				var imageSrc = card.getAttribute('data-image');
				if (!imageSrc) return;
				photoDisplay.src = imageSrc;
				photoDisplay.classList.add('active');
				card.classList.add('active');
			});

			card.addEventListener('mouseleave', function () {
				photoDisplay.classList.remove('active');
				card.classList.remove('active');
			});

			card.addEventListener('click', function () {
				var imageSrc = card.getAttribute('data-image');
				if (!imageSrc) return;
				photoDisplay.src = imageSrc;
				photoDisplay.classList.add('active');
				achievementCards.forEach(function (other) {
					other.classList.remove('active');
				});
				card.classList.add('active');
			});
		});
	}

	/* ---------- Start ---------- */
	updateActiveSection(0);

	window.addEventListener('resize', paintPill);

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(paintPill);
	}

	window.addEventListener('load', paintPill);
})();
