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

		var stopAutoEnter = function () {
			if (!autoEnterTimer) return;
			window.clearTimeout(autoEnterTimer);
			autoEnterTimer = null;
			autoEnterRemaining = Math.max(0, autoEnterRemaining - (Date.now() - autoEnterStarted));
		};

		var startAutoEnter = function () {
			if (entered || autoEnterTimer || autoEnterRemaining <= 0) return;
			autoEnterStarted = Date.now();
			autoEnterTimer = window.setTimeout(function () {
				autoEnterTimer = null;
				if (!entered) enterSite(false);
			}, autoEnterRemaining);
		};

		var pauseAutoEnter = function () {
			if (entered || !autoEnterTimer) return;
			stopAutoEnter();
			introEl.classList.add('is-timer-paused');
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

			behindIntro.forEach(function (el) {
				el.inert = false;
			});

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
				? event.target.closest('a, button, [role="tab"], [role="button"], .photo-frame, .home-portrait, .icon-btn')
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
	var irisEl = document.getElementById('iris');
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

		var atStart = currentIndex <= 1;
		var prevName = atStart ? '' : sectionTitle(currentIndex - 1);
		var nextIndex = currentIndex >= sections.length - 1 ? 1 : currentIndex + 1;
		var nextName = sectionTitle(nextIndex);

		if (prevBtn) {
			prevBtn.classList.toggle('disabled', atStart);
			prevBtn.disabled = atStart;
			prevBtn.setAttribute('data-label', prevName ? 'Previous — ' + prevName : '');
			prevBtn.setAttribute('aria-label', prevName ? 'Previous: ' + prevName : 'Previous section');
		}

		if (nextBtn) {
			nextBtn.classList.remove('disabled');
			nextBtn.disabled = false;
			nextBtn.setAttribute('data-label', nextName ? 'Next — ' + nextName : '');
			nextBtn.setAttribute('aria-label', nextName ? 'Next: ' + nextName : 'Next section');
		}

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
})();
