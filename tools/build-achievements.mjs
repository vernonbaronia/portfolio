#!/usr/bin/env node
/* =========================================================
   Achievement gallery builder
   ---------------------------------------------------------
   Scans achievements-images/ and writes achievements-images.js
   (the file the website reads). Also creates small .webp
   previews in achievements-images/thumbs/ so the page stays fast.

   Usage:  node tools/build-achievements.mjs
           npm run achievements
   ========================================================= */

import { readdir, stat, mkdir, writeFile, unlink, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const IMAGE_ROOT = path.join(ROOT, 'achievements-images');
const THUMB_ROOT = path.join(IMAGE_ROOT, 'thumbs');
const OUTPUT_FILE = path.join(ROOT, 'achievements-images.js');

const FOLDERS = ['ELEM', 'JHS', 'SHS', 'COLLEGE'];
const LOGO_KEYS = ['kaj', 'bcs', 'bis', 'uc'];
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;
const UNSUPPORTED_EXT = /\.(heic|heif|tiff?)$/i;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

let sharp = null;
try {
	const mod = await import('sharp');
	sharp = mod.default;
} catch (error) {
	console.warn(
		'\n  ! sharp is not installed, so previews will not be generated.\n' +
			'    Run "npm install" once, then run this script again.\n' +
			'    The page will fall back to the full-size images.\n'
	);
}

function toUrlPath(filePath) {
	return path.relative(ROOT, filePath).split(path.sep).join('/');
}

async function ensureDir(dir) {
	await mkdir(dir, { recursive: true });
}

async function exists(filePath) {
	try {
		await stat(filePath);
		return true;
	} catch {
		return false;
	}
}

async function walk(dir) {
	const out = [];
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return out;
	}

	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...(await walk(full)));
		} else if (IMAGE_EXT.test(entry.name)) {
			out.push(full);
		} else if (UNSUPPORTED_EXT.test(entry.name)) {
			console.warn(`  ! Skipping ${toUrlPath(full)} — convert HEIC/TIFF photos to JPG first.`);
		}
	}

	return out;
}

function prettyTitle(filePath) {
	const base = path.basename(filePath, path.extname(filePath));
	const cleaned = base
		.replace(/^\d+\s*[-_. ]*\s*/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!cleaned) return 'Certificate';
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function isGraduation(filePath) {
	const base = path.basename(filePath, path.extname(filePath));
	const relative = path.relative(IMAGE_ROOT, filePath).toLowerCase().split(path.sep).join('/');
	// A "graduation" subfolder always wins; otherwise look for the word
	// grad/graduation in the filename. The word boundary keeps "grade 9"
	// certificates in the small-tile grid.
	return /(^|\/)graduation\//.test(relative) || /\bgrad(uat\w*)?\b/i.test(base);
}

async function makePreview(src, dest, width, quality) {
	if (!sharp) return null;

	try {
		const [srcStat, destStat] = await Promise.all([
			stat(src),
			stat(dest).catch(() => null)
		]);

		if (destStat && destStat.mtimeMs >= srcStat.mtimeMs) {
			return toUrlPath(dest);
		}

		await ensureDir(path.dirname(dest));
		await sharp(src)
			.rotate()
			.resize({ width, fit: 'inside', withoutEnlargement: true })
			.webp({ quality, effort: 4 })
			.toFile(dest);

		return toUrlPath(dest);
	} catch (error) {
		console.warn(`  ! Could not create a preview for ${toUrlPath(src)}: ${error.message}`);
		return null;
	}
}

async function makeLogoPreview(src, key) {
	if (!sharp) return null;
	const dest = path.join(THUMB_ROOT, 'logo', `${key}.webp`);

	try {
		const [srcStat, destStat] = await Promise.all([
			stat(src),
			stat(dest).catch(() => null)
		]);

		if (destStat && destStat.mtimeMs >= srcStat.mtimeMs) {
			return toUrlPath(dest);
		}

		await ensureDir(path.dirname(dest));
		await sharp(src)
			.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 12 })
			.resize({ height: 160, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 92, alphaQuality: 100, effort: 4 })
			.toFile(dest);

		return toUrlPath(dest);
	} catch (error) {
		console.warn(`  ! Could not create the ${key.toUpperCase()} logo preview: ${error.message}`);
		return null;
	}
}

/* The supplied logo files are full-page transparent scans. Trim the empty
   page and keep only a reasonably sized logo, without touching the artwork. */
async function optimizeLogoSource(file) {
	if (!sharp) return;

	try {
		const before = await stat(file);
		const meta = await sharp(file).metadata();
		if ((meta.width || 0) <= 1200 && (meta.height || 0) <= 1200) return;

		const { data, info } = await sharp(file)
			.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 12 })
			.resize({ height: 800, fit: 'inside', withoutEnlargement: true })
			.png({ compressionLevel: 9, adaptiveFiltering: true })
			.toBuffer({ resolveWithObject: true });

		if (!info.width || !info.height || info.width < 40 || info.height < 40) return;

		const temp = `${file}.tmp`;
		await writeFile(temp, data);
		await rename(temp, file);

		console.log(
			`  · Trimmed ${toUrlPath(file)} — ` +
				`${Math.round(before.size / 1024)} KB → ${Math.round(data.length / 1024)} KB`
		);
	} catch (error) {
		console.warn(`  ! Could not optimise ${toUrlPath(file)}: ${error.message}`);
	}
}

function logoKeyFor(filePath) {
	const base = path
		.basename(filePath, path.extname(filePath))
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
	const tokens = base.split(/\s+/);
	return LOGO_KEYS.find((key) => tokens.includes(key)) || null;
}

async function buildLogos() {
	const dir = path.join(IMAGE_ROOT, 'logo');
	const files = (await walk(dir)).sort(collator.compare);
	const logos = {};
	const untouched = [];

	for (const file of files) {
		const key = logoKeyFor(file);
		if (!key) {
			untouched.push(file);
			continue;
		}
		if (logos[key]) {
			console.warn(`  ! Two logo files match "${key.toUpperCase()}" — using ${path.basename(logos[key].src)}.`);
			continue;
		}
		await optimizeLogoSource(file);
		const preview = await makeLogoPreview(file, key);
		logos[key] = {
			src: toUrlPath(file),
			thumb: preview || toUrlPath(file)
		};
	}

	if (untouched.length) {
		console.warn(
			'  ! These logos were ignored because their names do not start with kaj / bcs / bis / uc:\n' +
				untouched.map((file) => `      ${toUrlPath(file)}`).join('\n')
		);
	}

	for (const key of LOGO_KEYS) {
		if (!logos[key]) console.warn(`  ! No logo found for "${key.toUpperCase()}" in achievements-images/logo/.`);
	}

	return logos;
}

async function imageSize(file) {
	if (!sharp) return null;

	try {
		const meta = await sharp(file).metadata();
		let width = meta.width || 0;
		let height = meta.height || 0;
		if (meta.orientation >= 5 && meta.orientation <= 8) {
			const swap = width;
			width = height;
			height = swap;
		}
		if (!width || !height) return null;
		return { width, height };
	} catch {
		return null;
	}
}

async function buildFolder(folder) {
	const dir = path.join(IMAGE_ROOT, folder);
	const files = (await walk(dir)).sort(collator.compare);
	const certs = [];
	const featured = [];

	for (const file of files) {
		const src = toUrlPath(file);
		const relativeDir = path.relative(dir, file).toLowerCase().split(path.sep).join('/');
		const inLargeFolder = /(^|\/)(photos?|graduation)\//.test(relativeDir);
		const isCollege = folder === 'COLLEGE';

		const goesToFeatured = inLargeFolder || isCollege || isGraduation(file);
		const width = goesToFeatured ? 1000 : 420;
		const quality = goesToFeatured ? 82 : 72;
		const preview = await makePreview(
			file,
			path.join(THUMB_ROOT, folder, path.relative(dir, file)).replace(/\.(jpe?g|png|webp|avif)$/i, '.webp'),
			width,
			quality
		);

		const item = {
			src,
			thumb: preview || src,
			title: prettyTitle(file)
		};

		const size = await imageSize(file);
		if (size) {
			item.width = size.width;
			item.height = size.height;
		}

		if (goesToFeatured) {
			featured.push(item);
		} else {
			certs.push(item);
		}
	}

	return { certs, featured };
}

async function cleanOrphans(expected) {
	if (!sharp) return;
	if (!(await exists(THUMB_ROOT))) return;

	const actual = (await walk(THUMB_ROOT)).map(toUrlPath);
	const expectedSet = new Set(expected);

	for (const rel of actual) {
		if (!expectedSet.has(rel)) {
			await unlink(path.join(ROOT, rel)).catch(() => {});
			console.log(`  · Removed stale preview ${rel}`);
		}
	}
}

async function main() {
	console.log('\n  Building achievement gallery…\n');

	await ensureDir(THUMB_ROOT);

	const logos = await buildLogos();
	const folders = {};
	const expectedThumbs = [];

	for (const key of Object.keys(logos)) {
		expectedThumbs.push(logos[key].thumb);
	}

	for (const folder of FOLDERS) {
		const result = await buildFolder(folder);
		folders[folder] = result;
		for (const item of [...result.certs, ...result.featured]) {
			expectedThumbs.push(item.thumb);
		}
		const total = result.certs.length + result.featured.length;
		console.log(
			`  ${folder.padEnd(8)} ${String(total).padStart(2)} image${total === 1 ? '' : 's'}` +
				`  (${result.certs.length} certificate${result.certs.length === 1 ? '' : 's'}` +
				`, ${result.featured.length} large)`
		);
		result.featured.forEach((item) => {
			console.log(`           ↳ large image: ${item.src} — "${item.title}"`);
		});
	}

	await cleanOrphans(expectedThumbs);

	const media = {
		generated: new Date().toISOString(),
		logos,
		folders
	};

	const banner =
		'/* AUTO-GENERATED by tools/build-achievements.mjs — do not edit by hand. */\n' +
		'/* Drop photos into achievements-images/ and run: npm run achievements */\n\n';

	await writeFile(
		OUTPUT_FILE,
		`${banner}window.ACHIEVEMENT_MEDIA = ${JSON.stringify(media, null, '\t')};\n`,
		'utf8'
	);

	console.log(`\n  Wrote ${toUrlPath(OUTPUT_FILE)}\n`);
}

main().catch((error) => {
	console.error('\n  Build failed:', error);
	process.exitCode = 1;
});
