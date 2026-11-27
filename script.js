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
				value = getComputedStyle(docEl).getPropertyValue('--body-bg').trim() || '#050505';
			} else {
				value = getComputedStyle(docEl).getPropertyValue('--accent').trim() || '#2c666e';
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
			'400 1em Milker',
			'400 1em "Cocogoose Pro"',
			'400 1em "Californian Signature"',
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

		var progressFill = introEl.querySelector('.intro-progress-fill');
		var barAnimations = [];

		var startBarAnimations = function (anchorTime) {
			if (!progressFill || !progressFill.animate) return;
			if (barAnimations.length) {
				barAnimations.forEach(function (anim) { anim.play(); });
				return;
			}
			/* The bottom bar is a plain fill, so it can scale on the compositor. */
			barAnimations = [
				{ el: progressFill, id: 'intro-progress-fill', frames: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }] }
			].map(function (item) {
				var anim = item.el.animate(item.frames, {
					duration: AUTO_ENTER_MS,
					easing: 'linear',
					fill: 'forwards'
				});
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

		var enterSite = function (fromKeyboard) {
			if (entered) return;
			entered = true;

			stopAutoEnter();
			introEl.classList.remove('is-timer-paused');

			Sound.click();

			var reveal = function () {
				/* The navy panel slides in from the right and erases the
				   opening page as it travels; the intro is clipped from the
				   right in step with the panel's leading edge. */
				introEl.classList.add('is-erasing');
				document.body.classList.add('is-transitioning-home');
				document.body.classList.add('is-curtain-opening');

				window.setTimeout(function () {
					document.body.classList.remove('is-curtain-opening');
				}, 2000);

				window.setTimeout(function () {
					introEl.hidden = true;
					document.body.classList.remove('is-intro');
					document.body.classList.add('is-entered');
					behindIntro.forEach(function (el) {
						el.inert = false;
					});
					document.dispatchEvent(new CustomEvent('jvb:entered'));
				}, 1330);

				window.setTimeout(function () {
					document.body.classList.remove('is-transitioning-home');
					introEl.classList.remove('is-erasing');
				}, 2300);

				window.setTimeout(function () {
					if (fromKeyboard) {
						var firstTab = document.getElementById('home-menu-about');
						if (firstTab) firstTab.focus({ preventScroll: true });
					}
				}, 1450);
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
			enterSite(false);
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
	   Opening-page greeting — the visitor's local hour picks
	   the pair of words that sits under "Hello,".
	   6–11:59 Good Morning · 12–17:59 Good Afternoon ·
	   18–23:59 Good Evening · 0–5:59 Still Up?
	   ===================================================== */
	(function paintIntroGreeting() {
		var lead = document.getElementById('intro-greeting-lead');
		var tail = document.getElementById('intro-greeting-tail');
		if (!lead || !tail) return;

		var hour = new Date().getHours();
		var words;

		/* Temporary preview: pin the greeting so its length can be judged.
		   Set to null to restore the time-aware wording below. */
		var preview = ['Good', 'Morning'];

		if (preview) {
			words = preview;
		} else if (hour >= 6 && hour < 12) {
			words = ['Good', 'Morning'];
		} else if (hour >= 12 && hour < 18) {
			words = ['Good', 'Afternoon'];
		} else if (hour >= 18) {
			words = ['Good', 'Evening'];
		} else {
			words = ['Still', 'Up?'];
		}

		lead.textContent = words[0];
		tail.textContent = words[1];
	})();

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
		document.body.classList.toggle('is-family', currentIndex === 3);

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

	/* Home menu and bottom nav links jump to their section */
	var homeMenuItems = Array.prototype.slice.call(document.querySelectorAll('.home-menu-item, .home-bottom-link'));
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
	   Achievements: the certificate strip and the educational
	   stage cards, built from achievements-data.js +
	   achievements-images.js. Photos are added through the
	   build script, never by editing this file.
	   ===================================================== */
	var achievContent = window.ACHIEVEMENT_CONTENT;
	var achievMedia = window.ACHIEVEMENT_MEDIA || { logos: {}, folders: {} };
	var achievCertTrack = document.getElementById('ach-cert-track');
	var achievStageGrid = document.getElementById('ach-stage-grid');
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

	function achPhoto(src, label, className) {
		var img = document.createElement('img');
		img.className = className || 'ach-photo';
		img.src = src;
		img.alt = label + ' portrait';
		img.loading = 'lazy';
		img.decoding = 'async';
		return img;
	}

	var ACH_GROUP_ICONS = {
		academic: 'fa-graduation-cap',
		competition: 'fa-trophy',
		leadership: 'fa-user-tie',
		extracurricular: 'fa-star'
	};

	function achGroupList(school) {
		var groups = school.groups;

		if (!groups || !groups.length) {
			groups = [{ label: 'Academic', icon: 'academic', items: school.awards || [] }];
		}

		groups = groups.filter(function (group) {
			return group && group.items && group.items.length;
		});
		if (!groups.length) return null;

		var wrap = achEl('div', 'ach-groups');

		groups.forEach(function (group) {
			var section = achEl('section', 'ach-group');
			var head = achEl('h4', 'ach-group-title');
			var icon = achEl('i', 'fa-solid ' + (ACH_GROUP_ICONS[group.icon] || 'fa-award'));
			icon.setAttribute('aria-hidden', 'true');
			head.appendChild(icon);
			head.appendChild(document.createTextNode(group.label + ':'));
			section.appendChild(head);

			var list = achEl('ul', 'ach-group-items');
			group.items.forEach(function (item) {
				list.appendChild(achEl('li', null, item));
			});
			section.appendChild(list);
			wrap.appendChild(section);
		});

		return wrap;
	}

	function achEmpty(label, icon) {
		var box = achEl('div', 'ach-empty');
		var symbol = achEl('i', icon || 'fa-regular fa-image');
		symbol.setAttribute('aria-hidden', 'true');
		box.appendChild(symbol);
		box.appendChild(achEl('span', null, label));
		return box;
	}

	function achStatus(status) {
		var pill = achEl('p', 'ach-status');
		var dot = achEl('span', 'ach-status-dot');
		dot.setAttribute('aria-hidden', 'true');
		pill.appendChild(dot);
		pill.appendChild(document.createTextNode(status));
		return pill;
	}

	function achPickMedia(school, data) {
		var pool = data.certs.concat(data.featured);
		if (!pool.length) return null;

		if (school.grad) {
			for (var i = 0; i < pool.length; i++) {
				if (pool[i].src.indexOf(school.grad) !== -1) return pool[i];
			}
		}

		if (data.featured.length) return data.featured[data.featured.length - 1];
		return pool[0];
	}

	/* A certificate card for the rolling strip at the top. */
	function achCertCard(item, index, items, clone) {
		var card = achEl('button', 'ach-cert-card');
		card.type = 'button';

		var img = document.createElement('img');
		img.src = item.thumb || item.src;
		img.alt = '';
		img.loading = index < 8 ? 'eager' : 'lazy';
		img.decoding = 'async';
		card.appendChild(img);

		if (clone) {
			card.setAttribute('aria-hidden', 'true');
			card.tabIndex = -1;
		} else {
			card.setAttribute('aria-label', 'Open ' + item.title);
			card.addEventListener('click', function () {
				openAchLightbox(items, index, card);
			});
		}

		return card;
	}

	function buildCertificateStrip() {
		if (!achievCertTrack) return [];

		var entries = [];
		var items = [];

		(achievContent.schools || []).forEach(function (school) {
			var data = achFolder(school.folder);
			var list = data.certs.length ? data.certs : data.featured;

			list.forEach(function (photo) {
				items.push({ src: photo.src, title: photo.title, school: school.school });
				entries.push({ photo: photo, index: items.length - 1 });
			});
		});

		var groupA = achEl('div', 'ach-cert-group');
		var groupB = achEl('div', 'ach-cert-group');
		groupB.setAttribute('aria-hidden', 'true');

		entries.forEach(function (entry) {
			groupA.appendChild(achCertCard(entry.photo, entry.index, items, false));
		});
		entries.forEach(function (entry) {
			groupB.appendChild(achCertCard(entry.photo, entry.index, items, true));
		});

		achievCertTrack.appendChild(groupA);
		achievCertTrack.appendChild(groupB);

		return items;
	}

	/* One tall card per school. `variant` is 'college' for the wide
	   campus card, or 'start' for the small kindergarten card. */
	function buildStageCard(school, variant, step) {
		var data = achFolder(school.folder);
		var photos = data.certs.concat(data.featured);
		var items = photos.map(function (photo) {
			return { src: photo.src, title: photo.title, school: school.school };
		});

		var media = achPickMedia(school, data);
		var mediaIndex = media ? photos.indexOf(media) : -1;
		var isCollege = variant === 'college';
		var mediaSrc = isCollege ? '' : (media ? (media.thumb || media.src) : (variant === 'start' ? school.photo : ''));

		var card = achEl('article', 'ach-stage-card' + (variant ? ' ach-stage-card--' + variant : ''));
		card.setAttribute('data-school', school.id || school.folder || '');
		card.setAttribute('data-step', String(step || 0));
		if (school.bg) card.style.setProperty('--ach-card-bg', 'url("' + school.bg + '")');

		var mediaWrap = achEl('div', 'ach-stage-media');

		if (mediaSrc) {
			var shot = mediaIndex >= 0 ? achEl('button', 'ach-stage-shot') : achEl('div', 'ach-stage-shot');
			if (mediaIndex >= 0) {
				shot.type = 'button';
				shot.setAttribute('aria-label', 'Open ' + media.title);
				shot.addEventListener('click', function () {
					openAchLightbox(items, mediaIndex, shot);
				});
			}

			var shotImg = document.createElement('img');
			shotImg.src = mediaSrc;
			shotImg.alt = '';
			shotImg.loading = 'lazy';
			shotImg.decoding = 'async';
			shot.appendChild(shotImg);
			mediaWrap.appendChild(shot);
		} else {
			if (!isCollege) {
				mediaWrap.appendChild(achEmpty(school.emptyLabel || 'Photo coming soon', 'fa-regular fa-image'));
			}
		}

		if (!isCollege) {
			mediaWrap.appendChild(achEl('span', 'ach-stage-tag', school.tag || 'Diploma'));
		}

		if (isCollege) {
			var overlay = achEl('div', 'ach-stage-overlay');
			var overlayCopy = achEl('div', 'ach-stage-overlay-copy');
			overlayCopy.appendChild(achEl('p', 'ach-stage-kicker', school.stage || ''));
			overlayCopy.appendChild(achEl('h3', 'ach-school-name', school.school));
			if (school.status) {
				var statusPill = achStatus(school.status);
				if (school.statusNote) statusPill.appendChild(achEl('span', 'ach-status-note', school.statusNote));
				overlayCopy.appendChild(statusPill);
			}
			overlay.appendChild(overlayCopy);

			var overlayBadge = achEl('span', 'ach-stage-logo');
			overlayBadge.appendChild(achLogo(school.logo, school.school, school.logoText));
			overlay.appendChild(overlayBadge);

			var overlayGroups = achGroupList(school);
			if (overlayGroups) overlay.appendChild(overlayGroups);
			mediaWrap.appendChild(overlay);
		}

		card.appendChild(mediaWrap);

		if (!isCollege) {
			var body = achEl('div', 'ach-stage-body');
			var head = achEl('header', 'ach-stage-head');

			if (school.photo && variant !== 'start') {
				head.appendChild(achPhoto(school.photo, school.school, 'ach-stage-portrait'));
			}

			var title = achEl('div', 'ach-stage-title');
			if (school.stage || school.level) title.appendChild(achEl('p', 'ach-stage-kicker', school.stage || school.level));
			title.appendChild(achEl('h3', 'ach-school-name', school.school));
			if (school.years) title.appendChild(achEl('p', 'ach-stage-years', school.years));
			if (school.status) title.appendChild(achStatus(school.status));
			head.appendChild(title);

			var badge = achEl('span', 'ach-stage-logo');
			badge.appendChild(achLogo(school.logo, school.school, school.logoText));
			head.appendChild(badge);

			body.appendChild(head);

			var groups = achGroupList(school);
			if (groups) {
				body.appendChild(groups);
			} else if (school.emptyLabel) {
				body.appendChild(achEmpty(school.emptyLabel));
			}

			card.appendChild(body);
		}

		return card;
	}

	/* ---------- Lightbox ---------- */

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
	if (achievContent && achievStageGrid) {
		var achSchools = achievContent.schools || [];
		var achTotal = buildCertificateStrip().length;
		var schoolById = {};

		achSchools.forEach(function (school) {
			schoolById[school.id] = school;
			var data = achFolder(school.folder);
			achTotal += data.certs.length + data.featured.length;
		});

		function buildPhotoCollage() {
			var picks = [];
			['SHS', 'JHS', 'ELEM', 'COLLEGE'].forEach(function (folder) {
				var data = achFolder(folder);
				(data.featured || []).forEach(function (photo) {
					if (photo && photo.src) picks.push(photo);
				});
			});

			var seen = {};
			picks = picks.filter(function (photo) {
				if (seen[photo.src]) return false;
				seen[photo.src] = true;
				return true;
			}).slice(0, 4);

			if (!picks.length) return null;

			var wrap = achEl('div', 'ach-collage');
			picks.forEach(function (photo) {
				var item = achEl('figure', 'ach-collage-item');
				var img = document.createElement('img');
				img.src = photo.thumb || photo.src;
				img.alt = photo.title || '';
				img.loading = 'lazy';
				img.decoding = 'async';
				item.appendChild(img);
				wrap.appendChild(item);
			});
			return wrap;
		}

		var achCollege = schoolById.college;
		var achSenior = schoolById['senior-high'];
		var achJunior = schoolById['junior-high'];
		var achElementary = schoolById.elementary;

		var achCollage = buildPhotoCollage();

		if (achElementary) achievStageGrid.appendChild(buildStageCard(achElementary, 'elementary', 1));
		if (achJunior) achievStageGrid.appendChild(buildStageCard(achJunior, 'junior', 2));
		if (achSenior) achievStageGrid.appendChild(buildStageCard(achSenior, 'senior', 3));
		if (achCollege) achievStageGrid.appendChild(buildStageCard(achCollege, 'college', 4));
		if (achievContent.start) achievStageGrid.appendChild(buildStageCard(achievContent.start, 'daycare', 5));
		if (achCollage) achievStageGrid.appendChild(achCollage);

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

		/* The reference board reads best at full size. Keep the natural
		   type/certificate sizes and let the section scroll instead of
		   shrinking the whole page to fit. */
		achPageEl.style.zoom = '';
		achSectionEl.classList.remove('is-fit');
		return;

		/* Below this width the cards become too tall; scrolling is the
		   only readable option. */
		if (window.innerWidth <= 1024) {
			return;
		}

		var sectionStyles = window.getComputedStyle(achSectionEl);
		var paddingY =
			(parseFloat(sectionStyles.paddingTop) || 0) +
			(parseFloat(sectionStyles.paddingBottom) || 0);
		var available = achSectionEl.clientHeight - paddingY;
		var natural = achPageEl.scrollHeight;
		if (!natural || available <= 0) {
			return;
		}

		var scale = Math.min(1, (available - 4) / natural);
		if (scale >= 0.995) {
			achSectionEl.classList.add('is-fit');
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

					/* Web fonts and photos settle just after the section opens;
					   re-measure so the fit is not left scaled down. */
					if (document.fonts && document.fonts.ready) {
						document.fonts.ready.then(scheduleAchievementFit);
					}
					window.clearTimeout(achFitTimer);
					achFitTimer = window.setTimeout(scheduleAchievementFit, 650);
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
			var count = Math.round(Math.min(100, Math.max(45, (width * height) / 20000)));
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
			/* One canvas pixel per CSS pixel is plenty for these tiny dots and
			   keeps the per-frame cost down. */
			var dpr = 1;
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

			/* 25fps is plenty for a slow twinkle and leaves the main thread
			   free for the card transitions. */
			if (now - last < 40) return;

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

		/* While the intro is up its full-screen blur would be re-rendered
		   every frame, so the sky waits until the site is entered. */
		if (document.body.classList.contains('is-intro')) {
			document.addEventListener('jvb:entered', start, { once: true });
		} else {
			start();
		}
	})();

	/* ---------- Home hero parallax ---------- */
	(function homeHeroParallax() {
		var homeSection = document.getElementById('home');
		var heroParallax = document.querySelector('.home-hero-parallax');
		if (!homeSection || !heroParallax) return;

		var queued = false;

		function paint() {
			var offset = (window.scrollY || 0) + (homeSection.scrollTop || 0);
			heroParallax.style.transform = 'translate3d(0,' + (offset * 0.25).toFixed(2) + 'px,0)';
			queued = false;
		}

		function queue() {
			if (queued) return;
			queued = true;
			window.requestAnimationFrame(paint);
		}

		window.addEventListener('scroll', queue, { passive: true });
		homeSection.addEventListener('scroll', queue, { passive: true });
	})();

	/* ---------- Start ---------- */
	updateActiveSection(0);
})();
