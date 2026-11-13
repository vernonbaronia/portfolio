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
				value = getComputedStyle(docEl).getPropertyValue('--body-bg').trim() || '#08080a';
			} else {
				value = getComputedStyle(docEl).getPropertyValue('--accent').trim() || '#1a1a1c';
			}
			meta.setAttribute('content', value);
		}

		function paint() {
			var dark = current() === 'dark';

			paintMeta();

			paintButton(button, dark);
			paintButton(introButton, dark);
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

		/* Dark is the house default; only a saved choice changes it, so the
		   operating system preference is not followed. */
		paint();

		return { paint: paint, current: current, set: set };
	})();

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
				var resumed = ctx.resume();
				if (resumed && resumed.catch) resumed.catch(function () {});
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
			prepare: function () {
				if (!enabled) return;
				try {
					context();
				} catch (e) {
					/* audio unavailable — stay silent */
				}
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

		/* Decode the portrait before the homepage reveal so the first
		   frame of the transition isn't waiting on a large image. */
		var homePortrait = document.querySelector('.home-portrait img');
		if (homePortrait && homePortrait.decode) {
			homePortrait.decode().catch(function () {});
		}

		/* Warm every face the homepage uses straight away, so a
		   cold cache can never swap fonts while the intro fades. */
		var fontFaces = [
			'600 1em Caveat',
			'400 1em Inter',
			'500 1em Inter',
			'600 1em Inter',
			'500 1em "Space Grotesk"',
			'600 1em "Space Grotesk"',
			'700 1em "Space Grotesk"',
			'400 1em Euphoria',
			'400 1em Francy',
			'400 1em Gendy',
			'400 1em "ID Grotesk"',
			'400 1em Switzer',
			'500 1em Switzer',
			'600 1em Switzer',
			'700 1em Switzer'
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

		var AUTO_ENTER_MS = 3000;
		var autoEnterTimer = null;
		var autoEnterRemaining = AUTO_ENTER_MS;
		var autoEnterStarted = 0;
		var autoEnterQueued = false;

		var railFill = introEl.querySelector('.intro-rail-fill');
		var progressFill = introEl.querySelector('.intro-progress-fill');
		var barAnimations = [];

		var startBarAnimations = function (anchorTime) {
			if (!railFill || !progressFill || !railFill.animate) return;
			if (barAnimations.length) {
				barAnimations.forEach(function (anim) { anim.play(); });
				return;
			}
			barAnimations = [
				{ el: railFill, id: 'intro-rail-fill' },
				{ el: progressFill, id: 'intro-progress-fill' }
			].map(function (item) {
				var anim = item.el.animate(
					[{ width: '0%' }, { width: '100%' }],
					{ duration: AUTO_ENTER_MS, easing: 'linear', fill: 'forwards' }
				);
				anim.id = item.id;
				return anim;
			});
			if (typeof anchorTime === 'number') {
				barAnimations.forEach(function (anim) { anim.startTime = anchorTime; });
			}
		};

		var pauseBarAnimations = function () {
			barAnimations.forEach(function (anim) { anim.pause(); });
		};

		var stopAutoEnter = function () {
			if (!autoEnterTimer) return;
			window.clearTimeout(autoEnterTimer);
			autoEnterTimer = null;
			autoEnterRemaining = Math.max(0, autoEnterRemaining - (Date.now() - autoEnterStarted));
		};

		var startAutoEnter = function () {
			if (entered || autoEnterTimer || autoEnterQueued || autoEnterRemaining <= 0) return;
			autoEnterQueued = true;
			window.requestAnimationFrame(function () {
				if (!autoEnterQueued) return;
				autoEnterQueued = false;
				if (entered || autoEnterTimer || autoEnterRemaining <= 0) return;
				introEl.classList.add('is-timing');
				startBarAnimations(document.timeline ? document.timeline.currentTime : null);
				autoEnterStarted = Date.now();
				autoEnterTimer = window.setTimeout(function () {
					autoEnterTimer = null;
					if (!entered) enterSite(false);
				}, autoEnterRemaining);
			});
		};

		var pauseAutoEnter = function () {
			if (entered) return;
			autoEnterQueued = false;
			if (!autoEnterTimer) return;
			stopAutoEnter();
			introEl.classList.add('is-timer-paused');
			pauseBarAnimations();
		};

		var resumeAutoEnter = function () {
			if (entered) return;
			introEl.classList.remove('is-timer-paused');
			startAutoEnter();
		};

		var enterSite = function (fromKeyboard, originX, originY) {
			if (entered) return;
			entered = true;

			stopAutoEnter();
			introEl.classList.remove('is-timer-paused');

			Sound.click();

			var x = typeof originX === 'number' ? originX : window.innerWidth / 2;
			var y = typeof originY === 'number' ? originY : window.innerHeight / 2;

			var reveal = function () {
				/* Swirled shutter: the opening page spirals shut, then
				   opens onto the homepage. */
				var iris = document.getElementById('iris');
				if (iris) {
					iris.classList.remove('is-playing', 'is-swirl');
					void iris.offsetWidth;
					iris.classList.add('is-swirl');
				}
				document.body.classList.add('is-section-changing');
				sectionTransitioning = true;

				/* Swap intro → homepage at the midpoint (screen is fully black). */
				window.setTimeout(function () {
					introEl.hidden = true;
					document.body.classList.remove('is-intro');
					document.body.classList.add('is-entered');
					behindIntro.forEach(function (el) {
						el.inert = false;
					});
					document.dispatchEvent(new CustomEvent('jvb:entered'));
				}, 500);

				window.setTimeout(function () {
					if (iris) iris.classList.remove('is-swirl');
					document.body.classList.remove('is-section-changing');
					sectionTransitioning = false;
				}, 1180);

				window.setTimeout(function () {
					if (fromKeyboard) {
						var firstTab = document.getElementById('home-menu-about');
						if (firstTab) firstTab.focus({ preventScroll: true });
					}
				}, 1220);
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

		/* Pause the countdown while the visitor is using the intro controls */
		var introControls = introEl.querySelector('.intro-controls');
		if (introControls) {
			introControls.addEventListener('pointerenter', pauseAutoEnter);
			introControls.addEventListener('pointerleave', resumeAutoEnter);
			introControls.addEventListener('focusin', pauseAutoEnter);
			introControls.addEventListener('focusout', resumeAutoEnter);
		}

		/* Enter automatically after a short delay */
		Sound.prepare();
		startAutoEnter();
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
	   Custom cursor — parked. The site uses the normal pointer.
	   ===================================================== */
	var dot = document.getElementById('cursor-dot');
	var ring = document.getElementById('cursor-ring');

	if (dot) dot.remove();
	if (ring) ring.remove();


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

	/* The paper/shutter backdrop stays still like the opening page. */

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

	/* Home portrait: pointer tilt layered on top of its idle float. */
	var homePortrait = document.querySelector('.home-portrait');

	if (homePortrait && finePointer && !prefersReduced) {
		var homePortraitRect = null;

		homePortrait.addEventListener('pointerenter', function () {
			homePortraitRect = homePortrait.getBoundingClientRect();
		});

		homePortrait.addEventListener('pointermove', function (event) {
			if (!homePortraitRect) homePortraitRect = homePortrait.getBoundingClientRect();
			var px = (event.clientX - homePortraitRect.left) / homePortraitRect.width - 0.5;
			var py = (event.clientY - homePortraitRect.top) / homePortraitRect.height - 0.5;
			homePortrait.style.transform = 'perspective(1100px) rotateX(' +
				(-py * 8).toFixed(2) + 'deg) rotateY(' +
				(px * 8).toFixed(2) + 'deg)';
		});

		homePortrait.addEventListener('pointerleave', function () {
			homePortrait.style.transform = '';
			homePortraitRect = null;
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
			document.querySelectorAll('.nav-home, .icon-btn, .nav-btn, .orb-btn, .swatch')
		);

		magnets.forEach(function (element) {
			var strength = element.classList.contains('icon-btn')
				? 7
				: (element.classList.contains('nav-home') ? 6 : 4);
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
	var greetingIcon = document.getElementById('greeting-icon');

	if (greeting && greetingText) {
		var lastGreeting = '';

		function greetingFor(hour) {
			if (hour < 5) return 'still up?';
			if (hour < 12) return 'a pleasant morning';
			if (hour < 18) return 'a pleasant afternoon';
			return 'a pleasant evening';
		}

		function greetingIconFor(hour) {
			return (hour < 5 || hour >= 18) ? 'fa-moon' : 'fa-sun';
		}

		function paintGreeting(animate) {
			var hour = new Date().getHours();
			var next = greetingFor(hour);

			if (greetingIcon) {
				greetingIcon.className = 'fa-solid ' + greetingIconFor(hour) + ' nav-greeting-icon';
			}

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
	var typedRoles = Array.prototype.slice.call(document.querySelectorAll('.typed-role'));

	if (typedRoles.length) {
		var roles = [
			'Software Engineer',
			'Embedded Systems Engineer',
			'Cloud / Infrastructure Engineer',
			'Systems Architect'
		];

		var TYPE_MS = 62;
		var DELETE_MS = 34;
		var HOLD_MS = 1900;
		var GAP_MS = 380;

		var makeTyper = function (element) {
			var roleIndex = 0;
			var roleTimer = 0;
			var typingStarted = false;

			var eraseRole = function () {
				var word = roles[roleIndex];
				var pos = word.length;

				var step = function () {
					pos -= 1;
					element.textContent = word.slice(0, pos);

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
					element.textContent = word.slice(0, pos);

					if (pos < word.length) {
						roleTimer = window.setTimeout(step, TYPE_MS);
					} else {
						roleTimer = window.setTimeout(eraseRole, HOLD_MS);
					}
				};

				step();
			};

			return function () {
				if (typingStarted) return;
				typingStarted = true;

				element.textContent = roles[0];
				eraseRole();
			};
		};

		var startTyping = function () {
			typedRoles.forEach(function (element, index) {
				var start = makeTyper(element);
				window.setTimeout(start, 2200 + index * 120);
			});
		};

		if (entered) {
			startTyping();
		} else {
			document.addEventListener('jvb:entered', startTyping, { once: true });
		}
	}

	/* =====================================================
	   Section navigation
	   ===================================================== */
	var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
	var prevBtn = document.getElementById('prev-btn');
	var nextBtn = document.getElementById('next-btn');
	var counter = document.getElementById('current-num');
	var main = document.querySelector('main');
	var navHome = document.getElementById('nav-home');
	var prevNameEl = document.getElementById('prev-name');
	var nextNameEl = document.getElementById('next-name');
	var pagerDots = Array.prototype.slice.call(document.querySelectorAll('.pager-dot[data-section]'));

	pagerDots.forEach(function (dot) {
		dot.addEventListener('click', function () {
			var idx = sectionIndexForId(dot.getAttribute('data-section'));
			if (idx !== -1) goToSection(idx);
		});
	});
	var navPageTitle = document.getElementById('nav-page-title');
	var irisEl = document.getElementById('iris');
	var categoryButtons = Array.prototype.slice.call(document.querySelectorAll('.category-dock-btn'));
	var currentIndex = 0;
	var sectionTransitioning = false;
	var revealTimer = null;

	function pad(number) {
		return number < 10 ? '0' + number : String(number);
	}

	function sectionIndexForId(id) {
		for (var i = 0; i < sections.length; i++) {
			if (sections[i].id === id) return i;
		}
		return -1;
	}

	function sectionTitle(index) {
		var section = sections[index];
		if (!section) return '';
		return section.getAttribute('data-title') || section.getAttribute('aria-label') || '';
	}

	/* Replay the entrance choreography for the section coming into view. */
	function revealSection(section) {
		if (!section) return;

		sections.forEach(function (item) {
			item.classList.remove('is-revealing');
		});

		if (revealTimer) window.clearTimeout(revealTimer);

		void section.offsetWidth;
		section.classList.add('is-revealing');

		revealTimer = window.setTimeout(function () {
			section.classList.remove('is-revealing');
			revealTimer = null;
		}, 2200);
	}

	function updateActiveSection(index) {
		if (!sections.length) return;

		currentIndex = Math.max(0, Math.min(index, sections.length - 1));

		document.body.classList.toggle('is-home', currentIndex === 0);
		document.body.classList.toggle('is-about', currentIndex === 1);
		document.body.classList.toggle('is-achievements', currentIndex === 2);

		if (navPageTitle) {
			navPageTitle.textContent = sections[currentIndex].getAttribute('data-title') || '';
		}

		if (navHome) {
			navHome.hidden = currentIndex === 0;
		}

		sections.forEach(function (section, i) {
			var isActive = i === currentIndex;
			section.classList.toggle('active', isActive);
			section.setAttribute('aria-hidden', String(!isActive));
			if (isActive) section.scrollTop = 0;
		});

		if (counter) {
			counter.textContent = pad(currentIndex);
			counter.classList.remove('pop');
			void counter.offsetWidth;
			counter.classList.add('pop');
		}

		var hasPrev = currentIndex > 0;
		var prevName = hasPrev ? sectionTitle(currentIndex - 1) : '';
		var nextIndex = currentIndex >= sections.length - 1 ? 1 : currentIndex + 1;
		var nextName = sectionTitle(nextIndex);

		if (prevBtn) {
			prevBtn.classList.toggle('disabled', !hasPrev);
			prevBtn.disabled = !hasPrev;
			prevBtn.setAttribute('aria-label', prevName ? 'Previous: ' + prevName : 'Previous section');
		}
		if (prevNameEl) prevNameEl.textContent = prevName;

		if (nextBtn) {
			nextBtn.classList.remove('disabled');
			nextBtn.disabled = false;
			nextBtn.setAttribute('aria-label', nextName ? 'Next: ' + nextName : 'Next section');
		}
		if (nextNameEl) nextNameEl.textContent = nextName;

		categoryButtons.forEach(function (button) {
			var isActive = sectionIndexForId(button.getAttribute('data-section')) === currentIndex;
			button.classList.toggle('active', isActive);
			if (isActive) {
				button.setAttribute('aria-current', 'page');
			} else {
				button.removeAttribute('aria-current');
			}
		});

		pagerDots.forEach(function (dot) {
			var isActive = sectionIndexForId(dot.getAttribute('data-section')) === currentIndex;
			dot.classList.toggle('active', isActive);
			if (isActive) {
				dot.setAttribute('aria-current', 'page');
			} else {
				dot.removeAttribute('aria-current');
			}
		});

		revealSection(sections[currentIndex]);
	}

	/* Section changes use the circular camera iris. The section is
	   swapped while the aperture is fully closed, then it opens again. */
	function goToSection(index) {
		if (!sections.length || sectionTransitioning) return;

		var target = Math.max(0, Math.min(index, sections.length - 1));
		if (target === currentIndex) return;

		if (!irisEl || prefersReduced) {
			updateActiveSection(target);
			return;
		}

		sectionTransitioning = true;
		document.body.classList.add('is-section-changing');

		var leavingSection = sections[currentIndex];
		if (leavingSection) leavingSection.classList.add('is-leaving');

		irisEl.classList.remove('is-playing', 'is-swirl');
		void irisEl.offsetWidth;
		irisEl.classList.add('is-playing');

		window.setTimeout(function () {
			updateActiveSection(target);
		}, 500);

		window.setTimeout(function () {
			if (leavingSection) leavingSection.classList.remove('is-leaving');
			irisEl.classList.remove('is-playing');
			document.body.classList.remove('is-section-changing');
			sectionTransitioning = false;
		}, 1050);
	}

	/* Home menu links jump to their section */
	var homeMenuItems = Array.prototype.slice.call(document.querySelectorAll('.home-menu-item'));
	homeMenuItems.forEach(function (item) {
		item.addEventListener('click', function () {
			var idx = sectionIndexForId(item.getAttribute('data-section'));
			if (idx !== -1) goToSection(idx);
		});
	});

	/* Category dock icons jump to their section */
	categoryButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			var idx = sectionIndexForId(button.getAttribute('data-section'));
			if (idx !== -1) goToSection(idx);
		});
	});

	/* "JB" logo returns to the Home page */
	var navLogo = document.getElementById('nav-logo');
	if (navLogo) {
		navLogo.addEventListener('click', function () {
			goToSection(0);
		});
	}

	/* Centre HOME button only shows away from Home */
	if (navHome) {
		navHome.addEventListener('click', function () {
			goToSection(0);
		});

		/* Chrome ripple on press */
		navHome.addEventListener('pointerdown', function (event) {
			if (prefersReduced) return;

			var rect = navHome.getBoundingClientRect();
			var size = Math.max(rect.width, rect.height) * 1.35;
			var ripple = document.createElement('span');

			ripple.className = 'nav-home-ripple';
			ripple.style.width = size + 'px';
			ripple.style.height = size + 'px';
			ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
			ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

			navHome.appendChild(ripple);
			ripple.addEventListener('animationend', function () {
				ripple.remove();
			});
		});
	}

	/* First visit: play the home entrance once the intro clears. */
	var homeSection = document.getElementById('home');
	if (homeSection) {
		if (entered) {
			revealSection(homeSection);
		} else {
			document.addEventListener('jvb:entered', function () {
				revealSection(homeSection);
			}, { once: true });
		}
	}

	if (prevBtn) {
		prevBtn.addEventListener('click', function () {
			if (!prevBtn.disabled) goToSection(currentIndex - 1);
		});
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', function () {
			if (!nextBtn.disabled) {
				var nextIndex = currentIndex >= sections.length - 1 ? 1 : currentIndex + 1;
				goToSection(nextIndex);
			}
		});
	}

	/* Arrow keys move between sections (Home/End jump to the ends) */
	document.addEventListener('keydown', function (event) {
		if (!entered) return;
		if (document.body.classList.contains('is-lightbox-open')) return;

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
			if (direction === 1 && currentIndex >= sections.length - 1) {
				target = 1;
			} else {
				target = currentIndex + direction;
				if (currentIndex > 0) target = Math.max(1, target);
				if (target < 0 || target > sections.length - 1) return;
			}
		}

		event.preventDefault();
		goToSection(target);
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

			var target = currentIndex + (dx < 0 ? 1 : -1);
			if (dx < 0 && currentIndex >= sections.length - 1) target = 1;
			if (currentIndex > 0) target = Math.max(1, target);
			if (target < 0 || target > sections.length - 1 || target === currentIndex) return;
			goToSection(target);
		}, { passive: true });
	}

	/* =====================================================
	   Achievements: build the school record board from
	   achievements-data.js + achievements-images.js.
	   Photos are added through the build script, never by
	   editing this file.
	   ===================================================== */
	var achievContent = window.ACHIEVEMENT_CONTENT;
	var achievMedia = window.ACHIEVEMENT_MEDIA || { logos: {}, folders: {} };
	var achievBoard = document.getElementById('ach-board');
	var achievBase = document.getElementById('ach-base');
	var achievSummitCard = document.getElementById('ach-summit-card');
	var achievSummit = document.querySelector('.ach-summit');
	var achievNote = document.getElementById('ach-note');
	var achLightbox = document.getElementById('ach-lightbox');

	function achEl(tag, className, text) {
		var node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	}

	var ACH_STOP_WORDS = {
		of: true, the: true, and: true, for: true, de: true, la: true, ng: true
	};

	function achInitials(name) {
		var parts = String(name || '').split(/\s+/).filter(Boolean);
		var letters = '';

		parts.forEach(function (part) {
			if (!ACH_STOP_WORDS[part.toLowerCase()]) letters += part.charAt(0);
		});

		return (letters || (parts[0] || '?').charAt(0)).slice(0, 4).toUpperCase();
	}

	function achLogo(key, label, fallbackText) {
		var wrap = achEl('span', 'ach-logo');
		var logo = achievMedia.logos && achievMedia.logos[key];
		var src = logo && (logo.thumb || logo.src);

		if (src) {
			var img = document.createElement('img');
			img.src = src;
			img.alt = label + ' logo';
			img.loading = 'lazy';
			img.decoding = 'async';
			wrap.appendChild(img);
		} else {
			var fallback = achEl('span', 'ach-logo-fallback', fallbackText || achInitials(label));
			fallback.setAttribute('aria-hidden', 'true');
			wrap.appendChild(fallback);
		}

		return wrap;
	}

	function achFolder(folder) {
		return (achievMedia.folders && achievMedia.folders[folder]) || { certs: [], featured: [] };
	}

	function achPhoto(src, label) {
		var img = document.createElement('img');
		img.className = 'ach-photo';
		img.src = src;
		img.alt = label + ' portrait';
		img.loading = 'lazy';
		img.decoding = 'async';
		return img;
	}

	/* An auto-rolling photo presentation: the graduation shot leads, then
	   returns every seven certificates without breaking their order. */
	var achReels = [];
	var achReelTimer = 0;

	function achReelSlide(item, index, eager) {
		var slide = achEl('button', 'ach-reel-slide');
		slide.type = 'button';
		slide.setAttribute('data-ach-index', String(index));
		slide.setAttribute('aria-label', 'Open ' + item.title);

		var img = document.createElement('img');
		img.src = item.thumb || item.src;
		img.alt = '';
		img.loading = eager ? 'eager' : 'lazy';
		img.decoding = 'async';
		if (item.width && item.height) {
			img.width = item.width;
			img.height = item.height;
			img.style.aspectRatio = item.width + ' / ' + item.height;
		}

		slide.appendChild(img);
		return slide;
	}

	function buildAchReel(data, school, items) {
		var photos = data.certs.concat(data.featured);
		var reel = achEl('div', 'ach-reel');
		reel.setAttribute('role', 'group');
		reel.setAttribute('aria-label', school.school + ' photos');

		/* Register every photo once; the lightbox uses this list. */
		var indexBySrc = {};
		photos.forEach(function (item) {
			indexBySrc[item.src] = items.length;
			items.push({ src: item.src, title: item.title, school: school.school });

			/* Warm the cache so a swipe never waits on the network. */
			var preload = new Image();
			preload.decoding = 'async';
			preload.src = item.thumb || item.src;
		});

		/* The graduation shot leads and comes back every ninth slide; the
		   certificates keep rolling in their own order in between. */
		var gradAt = photos.length - 1;
		if (school.grad) {
			for (var g = 0; g < photos.length; g++) {
				if (photos[g].src.indexOf(school.grad) !== -1) {
					gradAt = g;
					break;
				}
			}
		}

		var grad = photos[gradAt];
		var certs = photos.filter(function (item, i) { return i !== gradAt; });
		if (!certs.length) certs = [grad];

		/* Two stacked frames: one on screen, one waiting to swipe in. */
		var track = achEl('div', 'ach-reel-track');
		var slots = [];
		for (var s = 0; s < 2; s++) {
			var slide = achEl('button', 'ach-reel-slide');
			slide.type = 'button';
			var img = document.createElement('img');
			img.alt = '';
			img.decoding = 'async';
			slide.appendChild(img);
			track.appendChild(slide);
			slots.push({ button: slide, img: img });
		}
		reel.appendChild(track);

		var counter = null;
		if (certs.length > 1) {
			counter = achEl('span', 'ach-reel-count', reelCountText(0, certs.length));
			counter.setAttribute('aria-hidden', 'true');
			reel.appendChild(counter);
		}

		var entry = {
			track: track,
			slots: slots,
			grad: grad,
			certs: certs,
			certIndex: 0,
			indexOf: indexBySrc,
			counter: counter
		};

		achReelPaint(entry, grad, 0);
		achReels.push(entry);
		return reel;
	}

	function achReelPaint(reel, photo, slot) {
		var frame = reel.slots[slot];
		if (!frame) return;

		frame.img.src = photo.thumb || photo.src;
		if (photo.width && photo.height) {
			frame.img.style.aspectRatio = photo.width + ' / ' + photo.height;
		}
		frame.button.setAttribute('data-ach-index', String(reel.indexOf[photo.src]));
		frame.button.setAttribute('aria-label', 'Open ' + photo.title);
	}

	function reelCountText(index, total) {
		var pad = function (n) { return n < 10 ? '0' + n : String(n); };
		return pad(index + 1) + ' / ' + pad(total);
	}

	function achReelSwap(reel, photo, certNumber) {
		/* Park the incoming photo in the second frame, then swipe up. */
		achReelPaint(reel, photo, 1);
		reel.track.style.transition = '';
		reel.track.style.transform = 'translate3d(0,-100%,0)';

		window.setTimeout(function () {
			achReelPaint(reel, photo, 0);
			reel.track.style.transition = 'none';
			reel.track.style.transform = 'translate3d(0,0,0)';
			void reel.track.offsetHeight;
			reel.track.style.transition = '';
		}, 800);

		if (reel.counter && certNumber != null) {
			reel.counter.textContent = reelCountText(certNumber, reel.certs.length);
		}
	}

	var achSlide = 0;

	function achReelTick() {
		achSlide += 1;

		var isGrad = achSlide % 9 === 0;

		achReels.forEach(function (reel) {
			if (isGrad) {
				/* Not counted: the number stays where the certificates left it. */
				achReelSwap(reel, reel.grad, null);
				return;
			}

			var photo = reel.certs[reel.certIndex % reel.certs.length];
			var number = reel.certIndex % reel.certs.length;
			reel.certIndex += 1;
			achReelSwap(reel, photo, number);
		});

		achReelTimer = window.setTimeout(achReelTick, isGrad ? 3000 : 2000);
	}

	function resetAchReels() {
		window.clearTimeout(achReelTimer);
		achReelTimer = 0;
		achSlide = 0;

		achReels.forEach(function (reel) {
			reel.certIndex = 0;
			reel.track.style.transition = 'none';
			reel.track.style.transform = 'translate3d(0,0,0)';
			void reel.track.offsetHeight;
			reel.track.style.transition = '';
			achReelPaint(reel, reel.grad, 0);
			achReelPaint(reel, reel.certs[0], 1);
			if (reel.counter) reel.counter.textContent = reelCountText(0, reel.certs.length);
		});

		if (!achReels.length) return;
		if (achRunReduced && achRunReduced.matches) return;

		/* Everyone opens on the graduation shot. */
		achReelTimer = window.setTimeout(achReelTick, 3000);
	}
	function achEmpty(label, icon) {
		var box = achEl('div', 'ach-empty');
		var symbol = achEl('i', icon || 'fa-regular fa-image');
		symbol.setAttribute('aria-hidden', 'true');
		box.appendChild(symbol);
		box.appendChild(achEl('span', null, label));
		return box;
	}

	function buildAchievementCard(school, index, still) {
		var data = achFolder(school.folder);
		var items = [];
		var card = achEl('article', 'ach-card');
		card.setAttribute('data-school', school.id || school.folder || '');
		card.setAttribute('data-step', String(index + 1));
		if (school.bg) card.style.setProperty('--ach-card-bg', 'url("' + school.bg + '")');

		var head = achEl('header', 'ach-card-head');
		var headTop = achEl('div', 'ach-head-top');
		headTop.appendChild(achEl('p', 'ach-stage', school.stage || ''));
		head.appendChild(headTop);
		var row = achEl('div', 'ach-school');
		row.appendChild(achLogo(school.logo, school.school, school.logoText));
		row.appendChild(achEl('h3', 'ach-school-name', school.school));
		if (school.photo) row.appendChild(achPhoto(school.photo, school.school));
		head.appendChild(row);
		card.appendChild(head);

		if (school.awards && school.awards.length) {
			var list = achEl('ul', 'ach-awards');
			school.awards.forEach(function (award) {
				list.appendChild(achEl('li', null, award));
			});
			card.appendChild(list);
		}

		if (data.certs.length || data.featured.length) {
			if (still) {
				var stills = achEl('div', 'ach-still-grid');
				stills.setAttribute('aria-label', school.school + ' photos');
				data.certs.concat(data.featured).forEach(function (item, i) {
					var shot = achEl('button', 'ach-still');
					shot.type = 'button';
					shot.setAttribute('data-ach-index', String(items.length));
					shot.setAttribute('aria-label', 'Open ' + item.title);

					var shotImg = document.createElement('img');
					shotImg.src = item.thumb || item.src;
					shotImg.alt = '';
					shotImg.loading = i < 2 ? 'eager' : 'lazy';
					shotImg.decoding = 'async';
					if (item.width && item.height) {
						shotImg.style.aspectRatio = item.width + ' / ' + item.height;
					}

					shot.appendChild(shotImg);
					stills.appendChild(shot);
					items.push({ src: item.src, title: item.title, school: school.school });
				});
				card.appendChild(stills);
			} else {
				card.appendChild(buildAchReel(data, school, items));
			}
		} else {
			card.appendChild(achEmpty(school.emptyLabel || 'Photos coming soon'));
		}

		if (school.status) {
			var status = achEl('p', 'ach-status');
			var dot = achEl('span', 'ach-status-dot');
			dot.setAttribute('aria-hidden', 'true');
			status.appendChild(dot);
			status.appendChild(document.createTextNode(school.status));
			card.appendChild(status);
		}

		card.addEventListener('click', function (event) {
			var button = event.target.closest ? event.target.closest('.ach-reel-slide') : null;
			if (!button) return;
			var index = Number(button.getAttribute('data-ach-index'));
			if (isNaN(index) || !items[index]) return;
			openAchLightbox(items, index, button);
		});

		return card;
	}

	/* A skinny block for the day care / kindergarten stage. */
	function buildAchievementStart(start) {
		if (!start || !start.school) return null;

		var card = achEl('article', 'ach-card ach-card--start');
		card.setAttribute('data-start', 'true');
		card.setAttribute('data-step', '0');

		var row = achEl('div', 'ach-start-row');
		row.appendChild(achLogo(start.logo, start.school, start.logoText));

		var copy = achEl('div', 'ach-start-copy');
		copy.appendChild(achEl('p', 'ach-stage', start.level || 'Day care'));
		copy.appendChild(achEl('h3', 'ach-school-name', start.school));
		row.appendChild(copy);

		if (start.photo) row.appendChild(achPhoto(start.photo, start.school));

		if (start.status) {
			var status = achEl('span', 'ach-status');
			var dot = achEl('span', 'ach-status-dot');
			dot.setAttribute('aria-hidden', 'true');
			status.appendChild(dot);
			status.appendChild(document.createTextNode(start.status));
			row.appendChild(status);
		}

		card.appendChild(row);
		return card;
	}

	/* ---------- Lightbox ---------- */
	var lbImg = document.getElementById('ach-lightbox-img');
	var lbStage = document.getElementById('ach-lightbox-stage');
	var lbTitle = document.getElementById('ach-lightbox-title');
	var lbMeta = document.getElementById('ach-lightbox-meta');
	var lbCount = document.getElementById('ach-lightbox-count');
	var lbFull = document.getElementById('ach-lightbox-open-full');
	var lbPrev = achLightbox ? achLightbox.querySelector('[data-ach-prev]') : null;
	var lbNext = achLightbox ? achLightbox.querySelector('[data-ach-next]') : null;
	var lbItems = [];
	var lbIndex = 0;
	var lbTrigger = null;
	var lbOpen = false;
	var lbCloseTimer = null;

	function renderAchLightbox() {
		var item = lbItems[lbIndex];
		if (!item) return;

		lbImg.classList.remove('is-loaded');
		lbImg.onload = function () {
			lbImg.classList.add('is-loaded');
		};
		lbImg.src = item.src;
		lbImg.alt = item.title + ' — ' + item.school;

		lbTitle.textContent = item.title;
		lbMeta.textContent = item.school;
		lbCount.textContent = (lbIndex + 1) + ' / ' + lbItems.length;
		lbFull.href = item.src;

		if (lbPrev) lbPrev.disabled = lbIndex === 0;
		if (lbNext) lbNext.disabled = lbIndex === lbItems.length - 1;

		[lbIndex - 1, lbIndex + 1].forEach(function (neighbour) {
			if (!lbItems[neighbour]) return;
			var preload = new Image();
			preload.src = lbItems[neighbour].src;
		});
	}

	function openAchLightbox(items, index, trigger) {
		if (!achLightbox || !items.length) return;

		window.clearTimeout(lbCloseTimer);
		lbItems = items;
		lbIndex = index;
		lbTrigger = trigger || null;
		lbOpen = true;

		achLightbox.hidden = false;
		achLightbox.setAttribute('aria-hidden', 'false');
		document.body.classList.add('is-lightbox-open');
		renderAchLightbox();

		window.requestAnimationFrame(function () {
			achLightbox.classList.add('is-open');
		});

		window.setTimeout(function () {
			if (lbOpen && achLightbox.querySelector('.ach-lightbox-close')) {
				achLightbox.querySelector('.ach-lightbox-close').focus();
			}
		}, 80);
	}

	function closeAchLightbox() {
		if (!lbOpen) return;
		lbOpen = false;

		achLightbox.classList.remove('is-open');
		document.body.classList.remove('is-lightbox-open');

		if (lbTrigger && lbTrigger.focus) lbTrigger.focus();
		achLightbox.setAttribute('aria-hidden', 'true');

		lbCloseTimer = window.setTimeout(function () {
			if (lbOpen) return;
			achLightbox.hidden = true;
			lbImg.removeAttribute('src');
			lbImg.classList.remove('is-loaded');
		}, 300);
	}

	function stepAchLightbox(delta) {
		if (!lbOpen) return;
		var next = lbIndex + delta;
		if (next < 0 || next >= lbItems.length) return;
		lbIndex = next;
		renderAchLightbox();
	}

	if (achLightbox) {
		Array.prototype.forEach.call(
			achLightbox.querySelectorAll('[data-ach-close]'),
			function (control) {
				control.addEventListener('click', closeAchLightbox);
			}
		);

		if (lbPrev) lbPrev.addEventListener('click', function () { stepAchLightbox(-1); });
		if (lbNext) lbNext.addEventListener('click', function () { stepAchLightbox(1); });

		document.addEventListener('keydown', function (event) {
			if (!lbOpen) return;

			if (event.key === 'Escape' || event.key === 'Esc') {
				event.preventDefault();
				closeAchLightbox();
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				stepAchLightbox(-1);
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				stepAchLightbox(1);
			} else if (event.key === 'Tab') {
				var focusable = achLightbox.querySelectorAll('button:not([disabled]), a[href]');
				if (!focusable.length) return;
				var first = focusable[0];
				var last = focusable[focusable.length - 1];

				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		});

		var touchStartX = null;
		var touchStartY = null;

		lbStage.addEventListener('touchstart', function (event) {
			if (event.touches.length !== 1) return;
			touchStartX = event.touches[0].clientX;
			touchStartY = event.touches[0].clientY;
		}, { passive: true });

		lbStage.addEventListener('touchend', function (event) {
			if (touchStartX === null) return;
			var dx = event.changedTouches[0].clientX - touchStartX;
			var dy = event.changedTouches[0].clientY - touchStartY;
			touchStartX = null;
			touchStartY = null;

			if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
				stepAchLightbox(dx < 0 ? 1 : -1);
			}
		}, { passive: true });
	}

	/* ---------- Render ---------- */
	if (achievContent && achievBoard) {
		var achSchools = achievContent.schools || [];
		var achTotal = 0;

		achievBoard.style.setProperty('--ach-steps', String(Math.max(1, achSchools.length)));
		if (achievSummit) achievSummit.style.setProperty('--ach-col', String(achSchools.length));

		achSchools.forEach(function (school, index) {
			var data = achFolder(school.folder);
			achTotal += data.certs.length + data.featured.length;

			var isSummit = index === achSchools.length - 1;
			var card = buildAchievementCard(school, index, isSummit);

			if (isSummit && achievSummitCard) {
				achievSummitCard.appendChild(card);
			} else if (index === 0 && achievBase) {
				/* The day care block sits on top of the first step. */
				var startCard = buildAchievementStart(achievContent.start);
				if (startCard) achievBase.appendChild(startCard);
				achievBase.appendChild(card);
			} else {
				card.style.setProperty('--ach-col', String(index + 1));
				achievBoard.appendChild(card);
			}
		});

		if (achievNote) {
			if (!achTotal) {
				achievNote.hidden = false;
				achievNote.textContent = 'Photos are on the way — they will appear here soon.';
			} else {
				achievNote.hidden = true;
			}
		}
	}

	/* =====================================================
	   Achievements: a little stickman runs along each step
	   and jumps up to the next school card.
	   ===================================================== */
	var achRunnerEl = document.getElementById('ach-runner');
	var achRunAnim = null;
	var achWaveOn = 0;
	var achWaveOff = 0;
	var achRunReduced = window.matchMedia
		? window.matchMedia('(prefers-reduced-motion: reduce)')
		: null;

	function achRunnerSteps() {
		if (!achievBoard || !achRunnerEl) return null;

		var cards = Array.prototype.slice.call(achievBoard.querySelectorAll('.ach-card[data-step]'));
		var boardH = achievBoard.offsetHeight;
		if (cards.length < 2 || !boardH) return null;

		var found = [];
		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			var stepNo = Number(card.getAttribute('data-step'));
			if (isNaN(stepNo)) stepNo = i + 1;
			/* Cards are laid out across the stair, so order them by step
			   number rather than by the order they sit in the DOM. */
			if (!card.offsetHeight) return null;
			found.push({
				order: stepNo,
				left: card.offsetLeft,
				right: card.offsetLeft + card.offsetWidth,
				y: card.offsetTop - boardH
			});
		}

		found.sort(function (a, b) { return a.order - b.order; });

		/* Keep only steps that keep climbing; a card tucked under another
		   one (the day care tag sits on top of the first column) is not a
		   tread the climber should stand on. */
		var steps = [];
		found.forEach(function (step) {
			var prev = steps[steps.length - 1];
			if (prev && step.y > prev.y + 6) return;
			steps.push(step);
		});

		return {
			steps: steps,
			width: achRunnerEl.offsetWidth || 30,
			height: achRunnerEl.offsetHeight || 40
		};
	}

	function achRunnerKeyframes() {
		var geo = achRunnerSteps();
		if (!geo) return null;

		var steps = geo.steps;
		var figureW = geo.width;
		var figureH = geo.height;
		var inset = Math.max(2, figureW * 0.18);
		var frames = [];
		var time = 0;

		/* The top of the board sits just under the page title, so the
		   climber's head must never rise into that strip. Work out how many
		   pixels of clear air there are above the board. */
		var boardRect = achievBoard.getBoundingClientRect();
		var zoom = achievBoard.offsetHeight ? boardRect.height / achievBoard.offsetHeight : 1;
		var navH = parseFloat(
			window.getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
		) || 92;
		var safeHead = navH + 34;
		var headLimit = (safeHead - boardRect.top) / (zoom || 1);

		function style(x, y, rot, opacity) {
			return {
				transform: 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)',
				opacity: opacity
			};
		}

		function push(delay, x, y, rot, opacity) {
			time += delay;
			frames.push({ time: time, style: style(x, y, rot, opacity) });
		}

		var x = steps[0].left + inset;
		var y = steps[0].y;

		/* A quiet beat before the climb starts. */
		push(0, x, y, 0, 0);
		push(300, x, y, 0, 0);
		push(240, x, y, 0, 1);

		steps.forEach(function (step, i) {
			var lastStep = i === steps.length - 1;
			/* On the final step the climber pulls up near the middle of the
			   card instead of running all the way to the edge. */
			var runTo = lastStep
				? step.left + (step.right - step.left - figureW) * 0.62
				: Math.max(step.left + inset, step.right - figureW - inset);
			var distance = runTo - x;

			if (distance > 4) {
				/* Constant-ish running speed, in px per millisecond. */
				var runTime = Math.max(340, Math.min(1100, distance / 0.46));
				push(runTime, runTo, step.y, 0, 1);
			}

			x = runTo;
			y = step.y;

			var next = steps[i + 1];
			if (!next) return;

			var jumpToX = next.left + inset;
			var jumpToY = next.y;
			var rise = Math.abs(jumpToY - step.y);
			var arc = Math.max(30, Math.min(84, rise * 0.45 + 28));
			/* Never let the leap carry the climber's head into the title. */
			var arcRoom = (achievBoard.offsetHeight + jumpToY) - figureH - headLimit;
			arc = Math.max(0, Math.min(arc, arcRoom));
			var flight = 540;
			var slices = 8;

			for (var k = 1; k <= slices; k++) {
				var t = k / slices;
				/* Ease the flight so take-off and landing feel quick and the
				   middle of the leap floats. */
				var p = t * t * (3 - 2 * t);
				var arcOffset = Math.sin(Math.PI * t);

				push(
					flight / slices,
					x + (jumpToX - x) * p,
					step.y + (jumpToY - step.y) * p - arcOffset * arc,
					arcOffset * 14,
					1
				);
			}

			x = jumpToX;
			y = jumpToY;
		});

		/* At the top: stop, wave, then fade away and walk again. */
		var holdAt = time;
		push(1750, x, y, 0, 1);
		push(320, x, y, 0, 0);

		var total = time;
		return {
			duration: total,
			holdAt: holdAt,
			keyframes: frames.map(function (frame) {
				var key = frame.style;
				key.offset = total ? frame.time / total : 0;
				key.easing = 'linear';
				return key;
			})
		};
	}

	function restartAchRunner() {
		if (!achRunnerEl) return;

		if (achRunAnim) {
			achRunAnim.cancel();
			achRunAnim = null;
		}

		window.clearTimeout(achWaveOn);
		window.clearTimeout(achWaveOff);
		achRunnerEl.classList.remove('is-waving');

		if (achRunReduced && achRunReduced.matches) return;
		if (!achievBoard || !achievBoard.offsetHeight) return;

		var run = achRunnerKeyframes();
		if (!run || !run.duration) return;

		achRunAnim = achRunnerEl.animate(run.keyframes, {
			duration: run.duration,
			iterations: Infinity,
			easing: 'linear'
		});

		/* Wave while he rests at the top, then walk again next loop. */
		var waveOnAt = run.holdAt + 140;
		var waveOffAt = run.duration - 420;

		function cycleWave() {
			achWaveOn = window.setTimeout(function () {
				achRunnerEl.classList.add('is-waving');
			}, waveOnAt);

			achWaveOff = window.setTimeout(function () {
				achRunnerEl.classList.remove('is-waving');
				cycleWave();
			}, waveOffAt);
		}

		cycleWave();
	}

	function scheduleAchRunner() {
		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(restartAchRunner);
		});
	}

	/* =====================================================
	   Achievements: scale the board so the whole section fits
	   the viewport without a scrollbar.
	   ===================================================== */
	var achSectionEl = document.getElementById('achievements');
	var achPageEl = document.querySelector('.achievements-page');
	var achFitFrame = 0;
	var achFitTimer = 0;

	function applyAchievementFit() {
		if (!achSectionEl || !achPageEl) return;
		if (!achSectionEl.classList.contains('active')) return;

		achPageEl.style.zoom = '';
		achSectionEl.classList.remove('is-fit');

		/* Below this width the cards become too tall; scrolling is the
		   only readable option. */
		if (window.innerWidth <= 1024) {
			scheduleAchRunner();
			return;
		}

		var sectionStyles = window.getComputedStyle(achSectionEl);
		var paddingY =
			(parseFloat(sectionStyles.paddingTop) || 0) +
			(parseFloat(sectionStyles.paddingBottom) || 0);
		var available = achSectionEl.clientHeight - paddingY;
		var natural = achPageEl.scrollHeight;
		if (!natural || available <= 0) {
			scheduleAchRunner();
			return;
		}

		var scale = Math.min(1, (available - 4) / natural);
		if (scale >= 0.995) {
			achSectionEl.classList.add('is-fit');
			scheduleAchRunner();
			return;
		}

		/* Zoom changes how text wraps, so measure the rendered result and
		   correct once or twice until the board really fits. */
		for (var attempt = 0; attempt < 5; attempt += 1) {
			achPageEl.style.zoom = String(scale);
			var rendered = achPageEl.getBoundingClientRect().height;
			if (rendered <= available - 4) break;
			scale *= (available - 5) / rendered;
		}

		achPageEl.style.zoom = String(scale);
		achSectionEl.classList.add('is-fit');
		scheduleAchRunner();
	}

	function scheduleAchievementFit() {
		window.cancelAnimationFrame(achFitFrame);
		achFitFrame = window.requestAnimationFrame(applyAchievementFit);
	}

	if (achSectionEl) {
		if (window.MutationObserver) {
			/* aria-hidden flips when the deck changes section. Watching this
			   instead of the class avoids re-triggering the fit when the
			   is-fit class is toggled below. */
			new MutationObserver(function () {
				if (achSectionEl.getAttribute('aria-hidden') === 'false') {
					window.requestAnimationFrame(function () {
						window.requestAnimationFrame(applyAchievementFit);
					});
					resetAchReels();
				}
			}).observe(achSectionEl, { attributes: true, attributeFilter: ['aria-hidden'] });
		}

		window.addEventListener('resize', function () {
			window.clearTimeout(achFitTimer);
			achFitTimer = window.setTimeout(scheduleAchievementFit, 120);
		});

		window.addEventListener('load', scheduleAchievementFit);

		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(scheduleAchievementFit);
		}

		scheduleAchievementFit();
	}

	/* =====================================================
	   Personal info: build a rounded-rectangle path so the
	   orbit words slither around the portrait's border.
	   ===================================================== */
	var orbitPortrait = document.querySelector('.about-portrait');
	var orbitBadge = document.querySelector('.orbit-badge');

	function updateOrbitPath() {
		if (!orbitPortrait || !orbitBadge) return;
		var w = orbitPortrait.clientWidth;
		var h = orbitPortrait.clientHeight;
		if (!w || !h) return;

		var d = 19; /* distance outside the frame */
		var r = 18; /* rounded corner radius */
		var x0 = -d;
		var y0 = -d;
		var x1 = w + d;
		var y1 = h + d;

		var path = 'path("M ' + r + ' ' + y0 +
			' H ' + (x1 - r) +
			' A ' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + (y0 + r) +
			' V ' + (y1 - r) +
			' A ' + r + ' ' + r + ' 0 0 1 ' + (x1 - r) + ' ' + y1 +
			' H ' + (x0 + r) +
			' A ' + r + ' ' + r + ' 0 0 1 ' + x0 + ' ' + (y1 - r) +
			' V ' + (y0 + r) +
			' A ' + r + ' ' + r + ' 0 0 1 ' + (x0 + r) + ' ' + y0 +
			' Z")';

		orbitBadge.style.setProperty('--snake-path', path);
	}

	if (orbitPortrait && orbitBadge) {
		if (window.ResizeObserver) {
			new ResizeObserver(updateOrbitPath).observe(orbitPortrait);
		} else {
			window.addEventListener('resize', updateOrbitPath);
		}
		updateOrbitPath();
	}

	/* =====================================================
	   Starfield: a slow drift of glimmering stars behind the
	   page, with the odd shooting star.
	   ===================================================== */
	(function starfield() {
		var canvas = document.getElementById('starfield');
		if (!canvas || !canvas.getContext) return;

		var ctx = canvas.getContext('2d');
		if (!ctx) return;

		var reduce = window.matchMedia
			? window.matchMedia('(prefers-reduced-motion: reduce)')
			: null;
		var stars = [];
		var shots = [];
		var width = 0;
		var height = 0;
		var nextShot = 6 + Math.random() * 8;
		var last = 0;
		var running = false;

		function build() {
			var count = Math.round(Math.min(120, Math.max(50, (width * height) / 17000)));
			stars = [];
			for (var i = 0; i < count; i++) {
				stars.push({
					x: Math.random() * width,
					y: Math.random() * height,
					r: 0.35 + Math.random() * 1.1,
					phase: Math.random() * Math.PI * 2,
					speed: 0.3 + Math.random() * 1.1,
					depth: 0.25 + Math.random() * 0.75
				});
			}
		}

		function resize() {
			var dpr = Math.min(2, window.devicePixelRatio || 1);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			build();
		}

		function spawnShot() {
			var fromLeft = Math.random() > 0.5;
			shots.push({
				x: fromLeft ? -40 : width + 40,
				y: Math.random() * height * 0.45,
				vx: (fromLeft ? 1 : -1) * (260 + Math.random() * 140),
				vy: 90 + Math.random() * 70,
				life: 0,
				max: 1.1 + Math.random() * 0.5
			});
		}

		function draw(time, dt) {
			var dark = document.documentElement.getAttribute('data-theme') !== 'light';
			ctx.clearRect(0, 0, width, height);

			for (var i = 0; i < stars.length; i++) {
				var s = stars[i];
				var twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
				var alpha = dark
					? 0.05 + twinkle * 0.4
					: 0.02 + twinkle * 0.12;
				var x = s.x;
				var y = s.y + Math.sin(time * 0.18 + s.phase) * 2;
				var radius = s.r * (0.75 + twinkle * 0.5);

				ctx.beginPath();
				ctx.arc(x, y, radius, 0, Math.PI * 2);
				ctx.fillStyle = dark
					? 'rgba(255, 247, 226,' + alpha.toFixed(3) + ')'
					: 'rgba(38, 32, 24,' + alpha.toFixed(3) + ')';
				ctx.fill();
			}

			nextShot -= dt;
			if (nextShot <= 0) {
				spawnShot();
				nextShot = 11 + Math.random() * 14;
			}

			for (var k = shots.length - 1; k >= 0; k--) {
				var shot = shots[k];
				shot.life += dt;
				shot.x += shot.vx * dt;
				shot.y += shot.vy * dt;

				var fade = 1 - shot.life / shot.max;
				if (fade <= 0) {
					shots.splice(k, 1);
					continue;
				}

				var tailX = shot.x - shot.vx * 0.16;
				var tailY = shot.y - shot.vy * 0.16;
				var grad = ctx.createLinearGradient(tailX, tailY, shot.x, shot.y);
				grad.addColorStop(0, dark ? 'rgba(255, 240, 200, 0)' : 'rgba(40, 34, 26, 0)');
				grad.addColorStop(1, dark
					? 'rgba(255, 244, 214,' + (0.75 * fade).toFixed(3) + ')'
					: 'rgba(40, 34, 26,' + (0.3 * fade).toFixed(3) + ')');

				ctx.beginPath();
				ctx.strokeStyle = grad;
				ctx.lineWidth = 1.6;
				ctx.lineCap = 'round';
				ctx.moveTo(tailX, tailY);
				ctx.lineTo(shot.x, shot.y);
				ctx.stroke();
			}
		}

		function loop(now) {
			if (!running) return;
			window.requestAnimationFrame(loop);

			/* 30fps is plenty for a slow twinkle and leaves the main thread
			   free for the card transitions. */
			if (now - last < 30) return;

			var time = now / 1000;
			var dt = last ? Math.min(0.06, (now - last) / 1000) : 0.016;
			last = now;
			draw(time, dt);
		}

		function start() {
			if (running) return;
			running = true;
			last = 0;
			window.requestAnimationFrame(loop);
		}

		function stop() {
			running = false;
		}

		resize();
		window.addEventListener('resize', resize);

		document.addEventListener('visibilitychange', function () {
			if (document.hidden) {
				stop();
			} else {
				start();
			}
		});

		if (reduce && reduce.matches) {
			/* A calm, static sky. */
			draw(0, 0);
			return;
		}

		start();
	})();

	/* ---------- Start ---------- */
	updateActiveSection(0);
})();
