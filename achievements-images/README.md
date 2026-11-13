# Achievements photos

Everything here feeds the **Achievements** section. You do not edit
`index.html`, `style.css` or `script.js` to add a photo — drop it in, run one
command, refresh.

## Folders

| Folder | What goes in it |
|---|---|
| `logo/` | One logo per school: `kaj.png`, `bcs.png`, `bis.png`, `uc.png`. |
| `ELEM/` | Elementary certificates. |
| `ELEM/graduation/` | The elementary graduation certificate. |
| `JHS/` | Junior high certificates. |
| `JHS/graduation/` | Large images shown together below the certificates, e.g. `01-with-dad.jpg` and `02-grade-10-graduation-certificate.jpg`. |
| `SHS/` | Senior high certificates and photos. |
| `SHS/graduation/` | The senior high graduation photo. |
| `COLLEGE/` | Scholarship photo(s); everything here shows large. |

File names can have spaces and capital letters. They sort naturally, so keep
the number prefix for order:

```
achievements-images/
  logo/
    kaj.png   bcs.png   bis.png   uc.png
  ELEM/
    01-grade-4-q1-honors.jpg
    02-grade-5-q1-honors.jpg
    ...
    07-division-science-spelling-bee.jpg
    graduation/elementary-graduation-certificate.jpg
  JHS/
    01-with-honors-grade-9.jpg
    ...
    08-project-runway-1st-place.jpg
    graduation/01-with-dad.jpg
    graduation/02-grade-10-graduation-certificate.jpg
  SHS/
    01-with-high-honors-grade-11.jpg
    ...
    17-katibayan-diploma.jpg
    graduation/senior-high-graduation-photo.jpg
  COLLEGE/
    01-bagong-pilipinas-merit-scholarship.jpg
```

### How placement works

- `graduation/` → large image, shown **below the small certificate strip**.
  Two or more images in the folder sit side by side.
- Anywhere else → small clickable certificate thumbnail.
- In `COLLEGE/`, every image is treated as the large scholarship image.

You can also make a file in a school folder the big graduation image by putting
the word **grad** or **graduation** in its name. The word "grade" does not count,
so `with-honors-grade-9.jpg` stays a normal thumbnail.

The lightbox title comes from the filename (`03-grade-5-q3-honors.jpg` →
"Grade 5 q3 honors"), so descriptive names make the viewer nicer. Keep the
number prefix for order.

## Adding a batch

1. Copy the photos into the right folder.
2. Run:

   ```bash
   npm run achievements
   ```

   The first time only, run `npm install` in the project root so the thumbnail
   tool (`sharp`) is available.
3. Refresh the page.
4. Commit `achievements-images/`, `achievements-images.js` and the generated
   `achievements-images/thumbs/` folder so the deployed site has the previews.

The command:

- creates fast-loading previews in `thumbs/` (the full image only loads when
  someone clicks);
- trims transparent margins from the school logos and shrinks oversized ones;
- records each image's real aspect ratio so landscape and portrait photos keep
  their own shape instead of being forced into a portrait frame;
- writes `achievements-images.js` (the list the page reads);
- removes previews for deleted photos;
- warns about missing logos or unsupported files.

Open `achievements-images.js` only to check the result — it is generated and
will be rewritten. Headings, award bullets and labels live in
`../achievements-data.js`.

## Supported files

JPG, PNG, WebP and AVIF. HEIC/HEIF photos from an iPhone must be exported as
JPG first (the script will warn and skip them).

## Layout behaviour

On screens wider than 900px the board is automatically scaled down a little to
fit the viewport with no scrolling at all. Phones fall back to vertical scrolling
because scaling the full record down far enough would make the text unreadable.
