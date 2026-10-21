# Design System Hub

Bentuk Apple HIG, diadaptasi ke HTML, CSS, dan JS.

Versi 1.0.0, 21 Oktober 2026. Pemilik: Dzaky.

---

## Cara pakai dokumen ini

- Dokumen ini acuan tunggal tampilan hub (Systems dan Maps). Kalau bertentangan dengan bagian 8 di `prompt-hub.md`, ikuti dokumen ini.
- Ini bukan salinan resmi Apple. Isinya konsep Apple Human Interface Guidelines (HIG), termasuk bahasa desain Liquid Glass di iOS 26 dan macOS Tahoe, yang diterjemahkan ke web, plus penyesuaian supaya lolos WCAG 2.2 AA.
- Tiap bagian berisi: konsep Apple, kenapa penting, cara di web, kode siap pakai, dan aturan.
- Semua angka kontras di dokumen ini hasil hitung rumus WCAG, bukan perkiraan.
- Urutan belajar yang disarankan ada di bagian 17. Kalau mau langsung praktik, mulai dari sana.
- Yang tidak termasuk: isi halaman Systems per domain (belum ditentukan), logo, ilustrasi.

## Daftar isi

1. Prinsip
2. Peta adaptasi Apple ke web
3. Arsitektur token dan CSS
4. Warna
5. Tipografi
6. Layout dan spacing
7. Bentuk
8. Material dan kedalaman
9. Gerak
10. Ikon
11. Aksesibilitas
12. Komponen dasar
13. Komponen overlay dan umpan balik
14. Komponen khusus Maps
15. Pola halaman
16. Penulisan
17. Urutan belajar
18. Checklist sebelum selesai
19. Glosarium
20. Referensi
21. Lampiran: perubahan yang perlu disalin ke `prompt-hub.md`

---

## 1. Prinsip

### 1.1 Tiga prinsip Apple sejak Liquid Glass (2025)

Apple merumuskan tiga prinsip untuk desain barunya: hierarchy, harmony, dan consistency.

| Prinsip | Arti di Apple | Arti di hub |
|---|---|---|
| Hierarchy | Konten jadi pusat. Kontrol melayang di atas konten dan tidak bersaing dengannya. | Peta dan data jadi fokus. Sidebar dan toolbar memakai material kaca. Warna aksen hanya untuk aksi penting. |
| Harmony | Bentuk saling mengikuti (concentric): sudut elemen dalam menyesuaikan sudut wadahnya. Jarak dan ritme konsisten. | Radius dalam = radius luar dikurangi padding. Semua jarak kelipatan 4px. |
| Consistency | Pola yang sama berperilaku sama di mana pun. | Satu komponen, satu cara pakai. Semua halaman Maps memakai renderer yang sama. |

### 1.2 Prinsip klasik yang tetap berlaku

- **Clarity**: teks mudah dibaca, ikon jelas maknanya, tidak ada hiasan yang tidak berguna.
- **Deference**: tampilan mengalah ke konten. Latar, garis, dan bayangan dibuat halus.
- **Depth**: lapisan dan gerak memberi tahu posisi dan hubungan antar elemen.

### 1.3 Aturan turunan untuk hub

1. Konten dulu, kontrol kemudian.
2. Satu warna aksen (tint). Jangan mewarnai semua hal, karena aksi yang benar-benar penting jadi tidak menonjol.
3. Kaca hanya untuk lapisan navigasi dan kontrol yang melayang. Jangan pakai kaca di area konten yang di-scroll seperti tabel dan list.
4. Tidak ada kaca di atas kaca.
5. Semua nilai dari token. Tidak ada angka mentah (warna hex, px acak) di file komponen.
6. Aksesibilitas bukan tambahan. Kontras, fokus keyboard, dan reduced motion wajib dari awal.
7. Pakai elemen HTML bawaan dulu (`button`, `dialog`, `details`, `input`), baru tambah JS kalau memang perlu.

---

## 2. Peta adaptasi Apple ke web

| Konsep Apple | Di web | Catatan |
|---|---|---|
| SF Pro | Stack `-apple-system, BlinkMacSystemFont, "Inter"` | SF Pro tampil asli di perangkat Apple. Perangkat lain memakai Inter. SF Pro tidak boleh di-host. |
| SF Symbols | Lucide (SVG) | SF Symbols tidak boleh dipakai di web. Lucide paling mirip: garis, ujung membulat. |
| Dynamic Type | Ukuran teks dalam `rem` | Ikut pengaturan ukuran font dan zoom browser. |
| Semantic colors | CSS custom properties (`--color-label`) | Satu nama, nilai berubah per mode. |
| Dark Mode, base dan elevated | Token per mode plus atribut `data-theme` | Gelap jadi default. Terang disiapkan. |
| Materials, Liquid Glass | `backdrop-filter: blur() saturate()` | Hanya blur. Efek lensa dan pantulan Liquid Glass tidak bisa ditiru penuh. |
| Continuous corners | `border-radius`, ditambah `corner-shape: squircle` | `corner-shape` baru ada di Chrome dan Edge 139 ke atas. Browser lain tetap sudut biasa. |
| Spring animation | Fungsi easing `linear()` hasil hitung | Kurva sudah dihitung di bagian 9. |
| Size classes | Media query dan container query | compact, regular, wide. |
| Reduce Motion | `prefers-reduced-motion` | Didukung semua browser modern. |
| Reduce Transparency | `prefers-reduced-transparency` plus saklar manual | Media query ini baru jalan di Chrome dan Edge. Safari dan Firefox belum. |
| Increase Contrast | `prefers-contrast: more` | Didukung semua browser modern. |
| Safe area | `env(safe-area-inset-*)` | Untuk iPhone dengan notch. |
| Sidebar | `<details name="nav">` | Accordion eksklusif tanpa JS. |
| Sheet, alert | `<dialog>` | Fokus dan tombol Esc sudah diurus browser. |
| Popover, menu | Popover API (`popover`, `popovertarget`) | Masuk top layer, tidak perlu z-index. |
| Segmented control | Grup `input type="radio"` | Keyboard otomatis jalan. |
| Toggle | `input type="checkbox" role="switch"` | |
| List grouped | `ul` dengan gaya inset grouped | |
| Haptics | Tidak ada padanan | Di desktop tidak relevan. |

---

## 3. Arsitektur token dan CSS

### 3.1 Apa itu token

Token adalah nama untuk keputusan desain. Contoh: daripada menulis `#0A84FF` di 30 tempat, kamu menulis `var(--color-tint)`. Kalau warna aksen berubah, cukup ubah satu baris.

### 3.2 Tiga lapis token

| Lapis | File | Isi | Contoh | Boleh dipakai komponen? |
|---|---|---|---|---|
| ref | `tokens/primitives.css` | Nilai mentah | `--ref-blue-dark: #0A84FF` | Tidak |
| sys | `tokens/colors.css`, `typography.css`, dll | Makna atau peran | `--color-tint`, `--text-body-size`, `--space-4` | Ya |
| comp | `components/*.css` | Khusus satu komponen | `--btn-height`, `--badge-fg` | Ya, di komponennya sendiri |

Kenapa tiga lapis: ganti mode atau ganti palet cukup mengubah pemetaan ref ke sys. File komponen tidak disentuh sama sekali.

### 3.3 Aturan penamaan

| Kelompok | Pola | Contoh |
|---|---|---|
| Warna | `--color-<peran>` | `--color-secondary-label` |
| Teks | `--text-<style>-<properti>` | `--text-body-size`, `--text-body-line` |
| Spacing | `--space-<n>` (n kali 4px) | `--space-4` = 16px |
| Radius | `--radius-<ukuran>` | `--radius-md` |
| Material | `--material-<tebal>-<properti>` | `--material-thick-bg` |
| Gerak | `--spring-<nama>`, `--duration-<nama>`, `--ease-<nama>` | `--spring-smooth` |
| Komponen | `--<komponen>-<properti>` | `--btn-height` |

Nama class komponen pakai pola sederhana: `.btn`, `.btn-filled`, `.btn-sm`. Tidak pakai BEM panjang. Token komponen ditulis di selector komponennya sendiri, bukan di `:root`.

### 3.4 Cascade layers

`@layer` mengatur prioritas CSS berdasarkan lapisan, bukan berdasarkan urutan file atau seberapa spesifik selector-nya. Hasilnya: gaya komponen tidak pernah kalah oleh reset, dan utility selalu menang tanpa `!important`.

Urutan lapisan (yang belakang paling kuat):

```css
/* assets/css/layers.css */
@layer reset, tokens, base, components, pages, utilities;
```

### 3.5 Satu file CSS untuk semua halaman

Tanpa build tool, cara paling rapi adalah satu file `app.css` yang mengimpor file lain dan menaruhnya ke lapisan masing-masing. Tiap halaman HTML cukup memanggil satu file.

```css
/* assets/css/app.css */
@import url("layers.css");

@import url("reset.css") layer(reset);

@import url("fonts.css") layer(tokens);
@import url("tokens/primitives.css") layer(tokens);
@import url("tokens/colors.css") layer(tokens);
@import url("tokens/typography.css") layer(tokens);
@import url("tokens/spacing.css") layer(tokens);
@import url("tokens/shape.css") layer(tokens);
@import url("tokens/materials.css") layer(tokens);
@import url("tokens/motion.css") layer(tokens);

@import url("base.css") layer(base);

@import url("components/button.css") layer(components);
@import url("components/field.css") layer(components);
@import url("components/toggle.css") layer(components);
@import url("components/segmented.css") layer(components);
@import url("components/sidebar.css") layer(components);
@import url("components/toolbar.css") layer(components);
@import url("components/list.css") layer(components);
@import url("components/table.css") layer(components);
@import url("components/tabs.css") layer(components);
@import url("components/badge.css") layer(components);
@import url("components/dialog.css") layer(components);
@import url("components/popover.css") layer(components);
@import url("components/toast.css") layer(components);
@import url("components/progress.css") layer(components);
@import url("components/empty.css") layer(components);
@import url("components/tile.css") layer(components);
@import url("components/inspector.css") layer(components);

@import url("pages/login.css") layer(pages);
@import url("pages/maps.css") layer(pages);

@import url("utilities.css") layer(utilities);
```

Di `<head>` tiap halaman:

```html
<link rel="stylesheet" href="/assets/css/app.css">
```

Catatan: `@import` membuat browser mengunduh `app.css` dulu, baru file lainnya secara paralel. Untuk app pribadi ini tidak masalah.

### 3.6 Pembaruan struktur folder CSS dan aset

Ini melengkapi struktur di `prompt-hub.md`:

```
public/
  dev/
    katalog.html             # katalog komponen untuk cek tampilan, tetap di balik login
  assets/
    icons/
      sprite.svg             # semua ikon Lucide yang dipakai, dalam satu file
    css/
      app.css                # satu-satunya file CSS yang dipanggil HTML
      layers.css
      reset.css
      fonts.css
      tokens/
        primitives.css
        colors.css
        typography.css
        spacing.css
        shape.css
        materials.css
        motion.css
      base.css
      components/
        button.css
        field.css
        toggle.css
        segmented.css
        sidebar.css
        toolbar.css
        list.css
        table.css
        tabs.css
        badge.css
        dialog.css
        popover.css
        toast.css
        progress.css
        empty.css
        tile.css             # kotak sistem di Maps
        inspector.css        # panel detail di Maps
      pages/
        login.css
        maps.css
      utilities.css
    js/
      prefs.js               # script biasa di <head>: baca preferensi mode dan transparansi
      dom.js                 # pembuat elemen dan ikon, dipakai bersama
      nav-config.js
      sidebar.js
      tabs.js
      dialog.js
      popover.js
      toast.js
      format.js              # format uang, waktu, tanggal
      api.js
      login.js
      maps-renderer.js
```

### 3.7 Aturan CSP yang mempengaruhi desain

Header keamanan di `vercel.json` memakai `default-src 'self'`. Akibatnya:

- Tidak boleh `<style>` di dalam HTML dan tidak boleh atribut `style=""`. Semua gaya di file CSS.
- Tidak boleh `<script>` inline. Semua JS di file `.js`.
- Gambar `data:` (misalnya ikon SVG di dalam `background-image: url("data:...")`) diblokir. Pakai sprite SVG atau file gambar biasa.
- Mengubah gaya lewat JS (`element.style.setProperty(...)`) tetap boleh karena tidak diblokir CSP.
- Isi teks dari data selalu pakai `textContent`, jangan `innerHTML`. Ini juga mencegah XSS.

### 3.8 Reset

```css
/* assets/css/reset.css */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
body { min-height: 100dvh; }
img, svg, video, canvas { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; color: inherit; }
button { background: none; border: 0; padding: 0; cursor: pointer; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
ul[role="list"], ol[role="list"] { list-style: none; padding: 0; }
table { border-collapse: collapse; }
[hidden] { display: none !important; }
```

### 3.9 Utilities

Lapisan paling kuat, berisi class kecil untuk tata letak cepat. Jaga tetap sedikit; kalau sebuah pola dipakai berulang, jadikan komponen.

```css
/* assets/css/utilities.css */
.stack { display: grid; gap: var(--stack-gap, var(--space-4)); }
.cluster { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cluster-gap, var(--space-2)); }
.push-end { margin-inline-start: auto; }
.full-width { width: 100%; }
```

Isi `base.css` dijelaskan bertahap di bagian 5 (tipografi), 6 (layout), 8 (material), 10 (ikon), dan 11 (aksesibilitas). Gabungkan semua potongan bertanda `base.css` ke satu file itu.

---

## 4. Warna

### 4.1 Konsep

- **Semantic color**: warna dinamai menurut fungsinya, bukan warnanya. `label` untuk teks utama, `separator` untuk garis pemisah. Kamu tidak pernah menulis "abu-abu" di komponen.
- **Mode gelap bukan kebalikan mode terang.** Bayangkan lampu ruangan diredupkan, bukan warna dibalik. Latar jadi gelap, teks jadi terang, tapi hubungan antar lapisan tetap sama.
- **Base dan elevated**: di mode gelap, Apple memakai dua set latar. Lapisan yang naik di atas lapisan lain (sheet, popover, dialog) memakai latar sedikit lebih terang, supaya terasa berada di depan. Bayangan kurang terlihat di latar gelap, jadi kedalaman ditunjukkan lewat warna latar.
- **Tint menyesuaikan mode**: warna aksen lebih terang di mode gelap dan lebih gelap di mode terang, supaya tetap terbaca.
- **Hierarki teks lewat transparansi**: `secondary-label` dan `tertiary-label` adalah putih (atau hitam) dengan alpha berbeda. Hasilnya otomatis menyatu dengan latar apa pun.

### 4.2 Nilai acuan Apple

Nilai di bawah adalah nilai standar Apple sejak iOS 13. iOS 26 sedikit menggeser beberapa warna aksen, jadi kalau butuh angka persis versi terbaru, cek Apple Design Resources. Untuk hub tidak masalah, karena tint nanti diganti palet milikmu (lihat 4.8).

**Abu-abu**

| Nama | Terang | Gelap |
|---|---|---|
| gray | #8E8E93 | #8E8E93 |
| gray2 | #AEAEB2 | #636366 |
| gray3 | #C7C7CC | #48484A |
| gray4 | #D1D1D6 | #3A3A3C |
| gray5 | #E5E5EA | #2C2C2E |
| gray6 | #F2F2F7 | #1C1C1E |

**Warna sistem**

| Nama | Terang | Gelap |
|---|---|---|
| blue | #007AFF | #0A84FF |
| green | #34C759 | #30D158 |
| indigo | #5856D6 | #5E5CE6 |
| orange | #FF9500 | #FF9F0A |
| pink | #FF2D55 | #FF375F |
| purple | #AF52DE | #BF5AF2 |
| red | #FF3B30 | #FF453A |
| teal | #30B0C7 | #40C8E0 |
| yellow | #FFCC00 | #FFD60A |
| mint | #00C7BE | #63E6E2 |
| cyan | #32ADE6 | #64D2FF |
| brown | #A2845E | #AC8E68 |

**Warna semantik**

| Nama | Terang | Gelap |
|---|---|---|
| label | #000000 | #FFFFFF |
| secondary-label | rgb(60 60 67 / 0.6) | rgb(235 235 245 / 0.6) |
| tertiary-label | rgb(60 60 67 / 0.3) | rgb(235 235 245 / 0.3) |
| quaternary-label | rgb(60 60 67 / 0.18) | rgb(235 235 245 / 0.16) |
| system-background | #FFFFFF | #000000 |
| secondary-system-background | #F2F2F7 | #1C1C1E |
| tertiary-system-background | #FFFFFF | #2C2C2E |
| system-grouped-background | #F2F2F7 | #000000 |
| secondary-system-grouped-background | #FFFFFF | #1C1C1E |
| tertiary-system-grouped-background | #F2F2F7 | #2C2C2E |
| separator | rgb(60 60 67 / 0.29) | rgb(84 84 88 / 0.6) |
| opaque-separator | #C6C6C8 | #38383A |
| system-fill | rgb(120 120 128 / 0.2) | rgb(120 120 128 / 0.36) |
| secondary-system-fill | rgb(120 120 128 / 0.16) | rgb(120 120 128 / 0.32) |
| tertiary-system-fill | rgb(118 118 128 / 0.12) | rgb(118 118 128 / 0.24) |
| quaternary-system-fill | rgb(116 116 128 / 0.08) | rgb(118 118 128 / 0.18) |

Latar elevated di mode gelap: #1C1C1E (utama), #2C2C2E (kedua), #3A3A3C (ketiga). Di mode terang, latar elevated sama dengan latar biasa.

### 4.3 Masalah kontras di nilai Apple

Apple mengandalkan pengaturan sistem (Increase Contrast) untuk pengguna yang butuh kontras tinggi. Di web, kita harus lolos WCAG AA dari awal. Syaratnya: teks biasa minimal 4.5:1, teks besar (24px ke atas, atau sekitar 19px tebal) minimal 3:1, komponen non-teks (border kontrol, ikon penting, cincin fokus) minimal 3:1.

Hasil hitung nilai Apple di mode gelap:

| Pasangan | Rasio | Hasil |
|---|---|---|
| `label` di #000000 | 21.00 | Lolos |
| `secondary-label` di #000000 | 6.36 | Lolos |
| `secondary-label` di #1C1C1E | 5.94 | Lolos |
| `secondary-label` di #2C2C2E | 5.29 | Lolos |
| `tertiary-label` di #000000 | 2.24 | Gagal untuk teks |
| `quaternary-label` di #000000 | 1.39 | Gagal untuk teks |
| Teks #0A84FF di #000000 | 5.76 | Lolos |
| Teks #0A84FF di #1C1C1E | 4.66 | Lolos |
| Teks #0A84FF di #2C2C2E | 3.82 | Gagal |
| Teks putih di atas #0A84FF (tombol biru) | 3.65 | Gagal |
| Teks #FF453A di #2C2C2E | 4.09 | Gagal |
| Teks putih di atas #FF453A (tombol merah) | 3.41 | Gagal |
| Teks #5E5CE6 (indigo) di #1C1C1E | 3.36 | Gagal |

Hasil hitung nilai Apple di mode terang:

| Pasangan | Rasio | Hasil |
|---|---|---|
| `secondary-label` (alpha 0.6) di #FFFFFF | 3.44 | Gagal |
| Teks #007AFF di #FFFFFF | 4.02 | Gagal |
| Teks putih di atas #007AFF | 4.02 | Gagal |
| Teks #34C759 (hijau) di #FFFFFF | 2.22 | Gagal |
| Teks #FF9500 (oranye) di #FFFFFF | 2.20 | Gagal |

Solusinya: warna aksen dipecah jadi beberapa token sesuai tugasnya.

| Token | Tugas | Gelap | Rasio terburuk |
|---|---|---|---|
| `--color-tint` | Ikon, indikator terpilih, cincin fokus, track toggle | #0A84FF | 3.82 di #2C2C2E (non-teks butuh 3:1, lolos) |
| `--color-tint-text` | Teks dan link berwarna aksen | #409CFF | 4.92 di #2C2C2E |
| `--color-tint-fill` | Latar tombol filled dengan teks putih | #0071E3 | 4.70 |
| `--color-error-text` | Teks error | #FF6961 | 4.94 di #2C2C2E |
| `--color-error-fill` | Latar tombol destructive dengan teks putih | #D70015 | 5.38 |
| `--color-control-border` | Border field dan kontrol | #7C7C80 | 3.35 di #2C2C2E |

#409CFF dan #FF6961 adalah warna versi Increase Contrast milik Apple, jadi tetap terasa Apple.

### 4.4 primitives.css

```css
/* assets/css/tokens/primitives.css */
:root {
  --ref-black: #000000;
  --ref-white: #FFFFFF;

  /* Abu-abu mode gelap */
  --ref-gray-dark: #8E8E93;
  --ref-gray2-dark: #636366;
  --ref-gray3-dark: #48484A;
  --ref-gray4-dark: #3A3A3C;
  --ref-gray5-dark: #2C2C2E;
  --ref-gray6-dark: #1C1C1E;

  /* Abu-abu mode terang */
  --ref-gray-light: #8E8E93;
  --ref-gray2-light: #AEAEB2;
  --ref-gray3-light: #C7C7CC;
  --ref-gray4-light: #D1D1D6;
  --ref-gray5-light: #E5E5EA;
  --ref-gray6-light: #F2F2F7;

  /* Warna sistem mode gelap */
  --ref-blue-dark: #0A84FF;
  --ref-green-dark: #30D158;
  --ref-indigo-dark: #5E5CE6;
  --ref-orange-dark: #FF9F0A;
  --ref-pink-dark: #FF375F;
  --ref-purple-dark: #BF5AF2;
  --ref-red-dark: #FF453A;
  --ref-teal-dark: #40C8E0;
  --ref-yellow-dark: #FFD60A;
  --ref-cyan-dark: #64D2FF;

  /* Warna sistem mode terang */
  --ref-blue-light: #007AFF;
  --ref-green-light: #34C759;
  --ref-indigo-light: #5856D6;
  --ref-orange-light: #FF9500;
  --ref-pink-light: #FF2D55;
  --ref-purple-light: #AF52DE;
  --ref-red-light: #FF3B30;
  --ref-teal-light: #30B0C7;
  --ref-yellow-light: #FFCC00;
  --ref-cyan-light: #32ADE6;

  /* Versi kontras tinggi dan turunan untuk lolos WCAG */
  --ref-blue-hc-dark: #409CFF;
  --ref-blue-deep: #0071E3;
  --ref-blue-hc-light: #0066D6;
  --ref-red-hc-dark: #FF6961;
  --ref-red-deep: #D70015;
  --ref-green-hc-light: #1E7A34;
  --ref-orange-hc-light: #C93400;
  --ref-control-border: #7C7C80;
}
```

### 4.5 colors.css

Mode gelap jadi default. Mode terang aktif kalau `<html data-theme="light">`. Belum ada mode otomatis; itu keputusan nanti.

```css
/* assets/css/tokens/colors.css */
:root {
  color-scheme: dark;

  /* Teks */
  --color-label: var(--ref-white);
  --color-secondary-label: rgb(235 235 245 / 0.6);
  --color-tertiary-label: rgb(235 235 245 / 0.3);
  --color-quaternary-label: rgb(235 235 245 / 0.16);
  /* Apple memakai tertiary-label untuk placeholder, tapi kontrasnya cuma 2.24. Dinaikkan supaya lolos AA. */
  --color-placeholder-text: var(--color-secondary-label);

  /* Latar */
  --color-system-background: var(--ref-black);
  --color-secondary-system-background: var(--ref-gray6-dark);
  --color-tertiary-system-background: var(--ref-gray5-dark);

  /* Latar terangkat: sheet, dialog, popover */
  --color-elevated-background: var(--ref-gray6-dark);
  --color-elevated-secondary-background: var(--ref-gray5-dark);
  --color-elevated-tertiary-background: var(--ref-gray4-dark);

  /* Latar grouped: list gaya Settings */
  --color-system-grouped-background: var(--ref-black);
  --color-secondary-system-grouped-background: var(--ref-gray6-dark);
  --color-tertiary-system-grouped-background: var(--ref-gray5-dark);

  /* Pemisah */
  --color-separator: rgb(84 84 88 / 0.6);
  --color-opaque-separator: #38383A;

  /* Isian kontrol */
  --color-system-fill: rgb(120 120 128 / 0.36);
  --color-secondary-system-fill: rgb(120 120 128 / 0.32);
  --color-tertiary-system-fill: rgb(118 118 128 / 0.24);
  --color-quaternary-system-fill: rgb(118 118 128 / 0.18);

  /* Aksen */
  --color-tint: var(--ref-blue-dark);
  --color-tint-text: var(--ref-blue-hc-dark);
  --color-tint-fill: var(--ref-blue-deep);
  --color-on-tint-fill: var(--ref-white);
  --color-tint-soft: color-mix(in srgb, var(--color-tint) 20%, transparent);

  /* Status */
  --color-success: var(--ref-green-dark);
  --color-success-text: var(--ref-green-dark);
  --color-warning: var(--ref-orange-dark);
  --color-warning-text: var(--ref-orange-dark);
  --color-error: var(--ref-red-dark);
  --color-error-text: var(--ref-red-hc-dark);
  --color-error-fill: var(--ref-red-deep);
  --color-info: var(--ref-cyan-dark);
  --color-info-text: var(--ref-cyan-dark);

  --color-on-error-fill: var(--ref-white);

  /* Kontrol */
  --color-control-border: var(--ref-control-border);
  --color-focus-ring: var(--color-tint);
  --color-scrim: rgb(0 0 0 / 0.5);
  --color-knob: var(--ref-white);          /* kenop toggle */
  --color-hover-mix: var(--ref-white);     /* dicampur ke latar saat hover */

  /* Warna kategori: garis koneksi, grafik, chip jenis integrasi */
  --color-cat-1: var(--ref-blue-dark);
  --color-cat-2: var(--ref-green-dark);
  --color-cat-3: var(--ref-orange-dark);
  --color-cat-4: var(--ref-purple-dark);
  --color-cat-5: var(--ref-teal-dark);
  --color-cat-6: var(--ref-pink-dark);
  --color-cat-7: var(--ref-yellow-dark);
  --color-cat-8: var(--ref-indigo-dark);
}

:root[data-theme="light"] {
  color-scheme: light;

  --color-label: var(--ref-black);
  /* Diubah dari 0.6 milik Apple supaya lolos 4.5:1 (hasil: 5.15 di putih, 4.82 di #F2F2F7) */
  --color-secondary-label: rgb(60 60 67 / 0.75);
  --color-tertiary-label: rgb(60 60 67 / 0.3);
  --color-quaternary-label: rgb(60 60 67 / 0.18);

  --color-system-background: var(--ref-white);
  --color-secondary-system-background: var(--ref-gray6-light);
  --color-tertiary-system-background: var(--ref-white);

  --color-elevated-background: var(--ref-white);
  --color-elevated-secondary-background: var(--ref-gray6-light);
  --color-elevated-tertiary-background: var(--ref-white);

  --color-system-grouped-background: var(--ref-gray6-light);
  --color-secondary-system-grouped-background: var(--ref-white);
  --color-tertiary-system-grouped-background: var(--ref-gray6-light);

  --color-separator: rgb(60 60 67 / 0.29);
  --color-opaque-separator: #C6C6C8;

  --color-system-fill: rgb(120 120 128 / 0.2);
  --color-secondary-system-fill: rgb(120 120 128 / 0.16);
  --color-tertiary-system-fill: rgb(118 118 128 / 0.12);
  --color-quaternary-system-fill: rgb(116 116 128 / 0.08);

  --color-tint: var(--ref-blue-light);
  --color-tint-text: var(--ref-blue-hc-light);
  --color-tint-fill: var(--ref-blue-hc-light);

  --color-success: var(--ref-green-light);
  --color-success-text: var(--ref-green-hc-light);
  --color-warning: var(--ref-orange-light);
  --color-warning-text: var(--ref-orange-hc-light);
  --color-error: var(--ref-red-light);
  --color-error-text: var(--ref-red-deep);
  --color-error-fill: var(--ref-red-deep);
  --color-info: var(--ref-cyan-light);
  --color-info-text: var(--ref-blue-hc-light);

  --color-scrim: rgb(0 0 0 / 0.3);
  --color-hover-mix: var(--ref-black);

  --color-cat-1: var(--ref-blue-light);
  --color-cat-2: var(--ref-green-light);
  --color-cat-3: var(--ref-orange-light);
  --color-cat-4: var(--ref-purple-light);
  --color-cat-5: var(--ref-teal-light);
  --color-cat-6: var(--ref-pink-light);
  --color-cat-7: var(--ref-yellow-light);
  --color-cat-8: var(--ref-indigo-light);
}

/* Pengguna minta kontras lebih tinggi lewat pengaturan sistem */
@media (prefers-contrast: more) {
  :root {
    --color-secondary-label: rgb(235 235 245 / 0.75);
    --color-separator: var(--color-opaque-separator);
    --color-control-border: var(--ref-gray-dark);
    --color-tint-text: var(--ref-blue-hc-dark);
    --color-error: var(--ref-red-hc-dark);
  }
  :root[data-theme="light"] {
    --color-secondary-label: rgb(60 60 67 / 0.85);
    --color-control-border: var(--ref-gray2-dark);
  }
}
```

### 4.6 Kapan pakai warna apa

| Elemen | Token |
|---|---|
| Latar halaman | `--color-system-background` |
| Panel, kartu, kotak di atas latar halaman | `--color-secondary-system-background` |
| Elemen di dalam panel | `--color-tertiary-system-background` |
| Latar dialog, sheet, popover | `--color-elevated-background` |
| Teks utama | `--color-label` |
| Teks pendukung (deskripsi, metadata) | `--color-secondary-label` |
| Teks nonaktif dan dekorasi | `--color-tertiary-label` |
| Placeholder field | `--color-placeholder-text` (diarahkan ke `secondary-label`) |
| Garis pemisah tipis | `--color-separator` |
| Garis yang harus terlihat jelas (border panel) | `--color-opaque-separator` |
| Latar tombol abu-abu, field, chip | `--color-tertiary-system-fill` |
| Hover baris tabel, item sidebar | `--color-quaternary-system-fill` |
| Item sidebar aktif | `--color-secondary-system-fill` |
| Link, teks aksen | `--color-tint-text` |
| Tombol utama | `--color-tint-fill` dengan teks `--color-on-tint-fill` |
| Baris atau kotak terpilih | `--color-tint-soft` |

### 4.7 Aturan warna

1. Teks yang berisi informasi hanya boleh `label` atau `secondary-label`. `tertiary-label` dan `quaternary-label` cuma untuk elemen nonaktif dan dekorasi.
2. Teks berwarna selalu pakai token berakhiran `-text`.
3. Latar berwarna dengan teks putih selalu pakai token berakhiran `-fill`.
4. Status tidak boleh hanya ditandai warna. Tambahkan ikon atau teks ("Gagal", "Berhasil").
5. Warna kategori (jenis integrasi di Maps) selalu dipasangkan dengan pola garis atau label.
6. Warna indigo dan ungu hanya untuk garis dan isian, tidak untuk teks kecil di panel (indigo di #1C1C1E cuma 3.36).
7. Teks kecil berwarna (badge berwarna, teks aksen) hanya di latar #000000 dan #1C1C1E. Di latar #2C2C2E ke atas, teks kecil memakai `label` atau `secondary-label`. Contoh: teks #409CFF di atas `tint-soft` lolos di #1C1C1E (4.70) tapi gagal di #2C2C2E (3.89). Ini sama dengan aturan di design system v1.0.0 milikmu.
8. Tidak boleh ada hex di file komponen. Kalau butuh warna baru, tambah di `primitives.css` lalu petakan di `colors.css`.

### 4.8 Mengganti tint dengan palet milikmu

Palet hub masih keputusan terbuka. Saat sudah dipilih:

1. Tambahkan warna palet di `primitives.css` (misalnya `--ref-indigo-pribadi`).
2. Ubah pemetaan `--color-tint`, `--color-tint-text`, `--color-tint-fill` di `colors.css`.
3. Cek kontras tiap token dengan fungsi di bagian 11.6. Target: `-text` minimal 4.5:1 di #2C2C2E, `-fill` minimal 4.5:1 dengan teks putih, `--color-tint` minimal 3:1 di #2C2C2E.
4. Kalau gagal, buat versi lebih terang (untuk `-text`) atau lebih gelap (untuk `-fill`) dari warna yang sama.

---

## 5. Tipografi

### 5.1 Konsep

- **Text styles**: Apple tidak memakai ukuran acak. Ada 11 gaya teks bernama (Large Title sampai Caption 2), masing-masing punya ukuran, jarak baris, dan ketebalan. Kamu memilih peran, bukan angka.
- **Optical size**: SF Pro punya dua varian, Text untuk ukuran kecil (huruf lebih renggang, lebih mudah dibaca) dan Display untuk ukuran besar (lebih rapat, lebih elegan). Sistem memilih otomatis. Inter versi 4 juga punya sumbu optical size, dan browser menerapkannya otomatis lewat `font-optical-sizing: auto` (nilai bawaan). Jadi kamu tidak perlu mengatur letter-spacing manual.
- **Dynamic Type**: pengguna Apple bisa memperbesar semua teks dari pengaturan. Padanannya di web adalah unit `rem` yang ikut ukuran font dan zoom browser.

### 5.2 Font stack dan kenapa urutannya penting

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
```

- `-apple-system` dikenali Safari dan Firefox di perangkat Apple, hasilnya SF Pro asli dari sistem.
- `BlinkMacSystemFont` dikenali Chrome dan Edge di Mac, hasilnya juga SF Pro.
- Di Windows dan Android, dua nama di atas tidak dikenali, jadi browser lanjut ke `"Inter"` yang kamu host sendiri.
- Jangan pakai `system-ui` di depan. Di Windows, `system-ui` jadi Segoe UI, sehingga Inter tidak pernah terpakai.
- Browser hanya mengunduh font yang benar-benar dipakai. Di Mac dan iPhone, file Inter tidak pernah diunduh.

### 5.3 fonts.css

```css
/* assets/css/fonts.css */
@font-face {
  font-family: "Inter";
  src: url("/assets/fonts/inter/InterVariable.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Inter";
  src: url("/assets/fonts/inter/InterVariable-Italic.woff2") format("woff2");
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
```

- `font-weight: 100 900` artinya satu file variable mencakup semua ketebalan.
- `font-display: swap` artinya teks langsung tampil dengan font cadangan, lalu berganti ke Inter setelah selesai diunduh.
- Unduh Inter dari situs resminya (rsms.me/inter), ambil file `InterVariable.woff2` dan `InterVariable-Italic.woff2`, plus file lisensinya.

### 5.4 Tabel text styles

| Style | Ukuran | Line height | Tebal biasa | Tebal tegas | Dipakai di hub untuk |
|---|---|---|---|---|---|
| Large Title | 34px | 41px | 400 | 700 | Judul beranda |
| Title 1 | 28px | 34px | 400 | 700 | Judul halaman |
| Title 2 | 22px | 28px | 400 | 700 | Judul bagian dalam halaman |
| Title 3 | 20px | 25px | 400 | 600 | Judul panel dan dialog |
| Headline | 17px | 22px | 600 | 700 | Judul baris penting, judul kotak |
| Body | 17px | 22px | 400 | 600 | Teks utama, isi field, tombol md dan lg |
| Callout | 16px | 21px | 400 | 600 | Item sidebar, deskripsi pendek |
| Subheadline | 15px | 20px | 400 | 600 | Isi tabel, label field, tombol sm |
| Footnote | 13px | 18px | 400 | 600 | Header tabel, judul section sidebar, teks bantuan |
| Caption 1 | 12px | 16px | 400 | 500 | Badge, chip protokol, waktu |
| Caption 2 | 11px | 13px | 400 | 600 | Legenda kecil, hindari untuk info penting |

- Ukuran mengikuti skala iOS. Skala macOS (body 13px) terlalu kecil untuk dibaca di browser.
- "Tebal tegas" dipakai saat teks perlu ditekankan tanpa naik ke style lain. Contoh: judul halaman pakai Title 1 tegas.
- Line height Apple untuk Body (22px untuk 17px) cocok untuk teks pendek. Untuk paragraf lebih dari tiga baris, pakai line height 1.5 supaya nyaman dibaca di layar lebar.

### 5.5 typography.css

```css
/* assets/css/tokens/typography.css */
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  --font-mono: ui-monospace, Menlo, Consolas, monospace;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* 1rem = 16px pada pengaturan bawaan browser */
  --text-large-title-size: 2.125rem;
  --text-large-title-line: 2.5625rem;
  --text-large-title-weight: var(--weight-regular);
  --text-large-title-weight-strong: var(--weight-bold);

  --text-title-1-size: 1.75rem;
  --text-title-1-line: 2.125rem;
  --text-title-1-weight: var(--weight-regular);
  --text-title-1-weight-strong: var(--weight-bold);

  --text-title-2-size: 1.375rem;
  --text-title-2-line: 1.75rem;
  --text-title-2-weight: var(--weight-regular);
  --text-title-2-weight-strong: var(--weight-bold);

  --text-title-3-size: 1.25rem;
  --text-title-3-line: 1.5625rem;
  --text-title-3-weight: var(--weight-regular);
  --text-title-3-weight-strong: var(--weight-semibold);

  --text-headline-size: 1.0625rem;
  --text-headline-line: 1.375rem;
  --text-headline-weight: var(--weight-semibold);
  --text-headline-weight-strong: var(--weight-bold);

  --text-body-size: 1.0625rem;
  --text-body-line: 1.375rem;
  --text-body-line-relaxed: 1.5;
  --text-body-weight: var(--weight-regular);
  --text-body-weight-strong: var(--weight-semibold);

  --text-callout-size: 1rem;
  --text-callout-line: 1.3125rem;
  --text-callout-weight: var(--weight-regular);
  --text-callout-weight-strong: var(--weight-semibold);

  --text-subheadline-size: 0.9375rem;
  --text-subheadline-line: 1.25rem;
  --text-subheadline-weight: var(--weight-regular);
  --text-subheadline-weight-strong: var(--weight-semibold);

  --text-footnote-size: 0.8125rem;
  --text-footnote-line: 1.125rem;
  --text-footnote-weight: var(--weight-regular);
  --text-footnote-weight-strong: var(--weight-semibold);

  --text-caption-1-size: 0.75rem;
  --text-caption-1-line: 1rem;
  --text-caption-1-weight: var(--weight-regular);
  --text-caption-1-weight-strong: var(--weight-medium);

  --text-caption-2-size: 0.6875rem;
  --text-caption-2-line: 0.8125rem;
  --text-caption-2-weight: var(--weight-regular);
  --text-caption-2-weight-strong: var(--weight-semibold);
}
```

### 5.6 Class text style (masuk ke base.css)

```css
/* assets/css/base.css, bagian tipografi */
html { background: var(--color-system-background); }

body {
  font-family: var(--font-sans);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  font-weight: var(--text-body-weight);
  color: var(--color-label);
  background: var(--color-system-background);
  -webkit-font-smoothing: antialiased;
}

.text-large-title { font-size: var(--text-large-title-size); line-height: var(--text-large-title-line); font-weight: var(--text-large-title-weight); }
.text-title-1     { font-size: var(--text-title-1-size);     line-height: var(--text-title-1-line);     font-weight: var(--text-title-1-weight); }
.text-title-2     { font-size: var(--text-title-2-size);     line-height: var(--text-title-2-line);     font-weight: var(--text-title-2-weight); }
.text-title-3     { font-size: var(--text-title-3-size);     line-height: var(--text-title-3-line);     font-weight: var(--text-title-3-weight); }
.text-headline    { font-size: var(--text-headline-size);    line-height: var(--text-headline-line);    font-weight: var(--text-headline-weight); }
.text-body        { font-size: var(--text-body-size);        line-height: var(--text-body-line);        font-weight: var(--text-body-weight); }
.text-callout     { font-size: var(--text-callout-size);     line-height: var(--text-callout-line);     font-weight: var(--text-callout-weight); }
.text-subheadline { font-size: var(--text-subheadline-size); line-height: var(--text-subheadline-line); font-weight: var(--text-subheadline-weight); }
.text-footnote    { font-size: var(--text-footnote-size);    line-height: var(--text-footnote-line);    font-weight: var(--text-footnote-weight); }
.text-caption-1   { font-size: var(--text-caption-1-size);   line-height: var(--text-caption-1-line);   font-weight: var(--text-caption-1-weight); }
.text-caption-2   { font-size: var(--text-caption-2-size);   line-height: var(--text-caption-2-line);   font-weight: var(--text-caption-2-weight); }

/* Versi tegas: tambahkan class .strong */
.text-large-title.strong { font-weight: var(--text-large-title-weight-strong); }
.text-title-1.strong     { font-weight: var(--text-title-1-weight-strong); }
.text-title-2.strong     { font-weight: var(--text-title-2-weight-strong); }
.text-title-3.strong     { font-weight: var(--text-title-3-weight-strong); }
.text-headline.strong    { font-weight: var(--text-headline-weight-strong); }
.text-body.strong        { font-weight: var(--text-body-weight-strong); }
.text-callout.strong     { font-weight: var(--text-callout-weight-strong); }
.text-subheadline.strong { font-weight: var(--text-subheadline-weight-strong); }
.text-footnote.strong    { font-weight: var(--text-footnote-weight-strong); }
.text-caption-1.strong   { font-weight: var(--text-caption-1-weight-strong); }
.text-caption-2.strong   { font-weight: var(--text-caption-2-weight-strong); }

.text-secondary { color: var(--color-secondary-label); }
.prose { line-height: var(--text-body-line-relaxed); max-width: var(--readable-width); }
.num { font-variant-numeric: tabular-nums; }
.mono { font-family: var(--font-mono); }

h1, h2, h3 { text-wrap: balance; }

a { color: var(--color-tint-text); text-decoration: none; }
a:hover { text-decoration: underline; }

::selection { background: color-mix(in srgb, var(--color-tint) 40%, transparent); }
```

Contoh pakai:

```html
<h1 class="text-title-1 strong">Peta Game</h1>
<p class="text-subheadline text-secondary">357 sistem dalam 9 bagian</p>
```

Tag HTML (`h1`, `h2`, `p`) dipilih berdasarkan struktur dokumen, class dipilih berdasarkan tampilan. Jangan memilih `h3` hanya karena ukurannya pas.

### 5.7 Dynamic Type versi web

- Semua ukuran teks dan spacing pakai `rem`.
- Jangan pernah set `html { font-size: 62.5% }` atau ukuran font dalam px di `html`. Itu mematikan pengaturan ukuran font pengguna.
- Hasilnya: kalau ukuran font browser dinaikkan, semua teks dan jarak ikut membesar dengan proporsi sama, mirip Dynamic Type.
- Tes wajib: zoom browser 200%, tidak ada teks terpotong atau saling tumpuk.

### 5.8 Angka dan format

- Angka di tabel, uang, dan data selalu tabular figures (`.num` atau `font-variant-numeric: tabular-nums`), supaya digit sejajar vertikal.
- Angka di tabel rata kanan.
- Format mengikuti design system milikmu: uang `Rp1.250.000`, minus `-Rp150.000`, waktu 24 jam `09.03`, tanggal `21 Okt 2026`.

`Intl.NumberFormat` dengan `style: "currency"` menghasilkan `Rp 1.250.000` (ada spasi), jadi uang diformat manual:

```js
// assets/js/format.js
const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const tanggal = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function rupiah(nilai) {
  const tanda = nilai < 0 ? "-" : "";
  return `${tanda}Rp${angka.format(Math.abs(nilai))}`;
}

export const formatAngka = (nilai) => angka.format(nilai);
export const formatJam = (waktu) => jam.format(waktu);
export const formatTanggal = (waktu) => tanggal.format(waktu);

// rupiah(1250000)  hasilnya "Rp1.250.000"
// rupiah(-150000)  hasilnya "-Rp150.000"
// formatJam(new Date(2026, 9, 21, 9, 3))  hasilnya "09.03"
// formatTanggal(new Date(2026, 9, 21))    hasilnya "21 Okt 2026"
```

### 5.9 Aturan tipografi

1. Pilih style dari tabel 5.4. Tidak ada ukuran font di luar tabel.
2. Dalam satu panel, maksimal tiga style berbeda. Lebih dari itu hierarki jadi kabur.
3. Paragraf maksimal selebar `--readable-width` (sekitar 75 karakter per baris).
4. Kapital hanya di awal kalimat dan nama. Tidak ada teks huruf besar semua, kecuali singkatan (API, ISO 20022).
5. Teks tebal untuk penekanan secukupnya, bukan untuk seluruh paragraf.
6. Kode, nomor referensi, dan nama protokol teknis boleh memakai `.mono`.

---

## 6. Layout dan spacing

### 6.1 Grid 4px

Apple memakai kelipatan 4 dan 8 untuk semua jarak. Hub memakai kelipatan 4px, ditulis dalam `rem` supaya ikut membesar bersama teks.

```css
/* assets/css/tokens/spacing.css */
:root {
  --space-0: 0;
  --space-0-5: 0.125rem;  /* 2px, hanya untuk penyesuaian halus */
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */

  /* Layout */
  --page-padding: var(--space-6);
  --sidebar-width: 16rem;      /* 256px */
  --toolbar-height: 3.5rem;    /* 56px */
  --inspector-width: 22rem;    /* 352px */
  --readable-width: 42rem;     /* 672px */
  --content-max: 80rem;        /* 1280px */

  /* Ukuran kontrol */
  --control-height-sm: 1.75rem;  /* 28px */
  --control-height-md: 2.25rem;  /* 36px */
  --control-height-lg: 2.75rem;  /* 44px */
  --row-height: 2.75rem;         /* baris list */
  --row-height-dense: 2.25rem;   /* baris tabel */
  --nav-item-height: 2.5rem;     /* item sidebar, 40px */
  --nav-section-height: 2rem;    /* judul section sidebar, 32px */
}

/* Layar sentuh: semua target minimal 44px seperti aturan Apple */
@media (pointer: coarse) {
  :root {
    --control-height-sm: 2.75rem;
    --control-height-md: 2.75rem;
    --row-height-dense: 2.75rem;
    --nav-item-height: 2.75rem;
  }
}

@media (width < 48rem) {
  :root { --page-padding: var(--space-4); }
}
```

### 6.2 Memilih jarak

| Hubungan | Jarak | Contoh |
|---|---|---|
| Di dalam satu komponen | `--space-1` sampai `--space-2` | Ikon ke label tombol |
| Elemen yang berkaitan erat | `--space-3` sampai `--space-4` | Label field ke field, antar field |
| Antar kelompok | `--space-6` sampai `--space-8` | Antar section dalam panel |
| Antar blok besar | `--space-12` sampai `--space-16` | Antar bagian halaman beranda |

Prinsipnya: jarak menunjukkan hubungan. Makin dekat, makin berkaitan. Ini cara Apple mengurangi garis pemisah.

### 6.3 Size classes

Apple membagi layar jadi compact dan regular. Hub memakai tiga kelas berdasarkan lebar:

| Kelas | Lebar | Layout |
|---|---|---|
| compact | di bawah 768px | Sidebar jadi laci (drawer) yang dibuka dari tombol menu di toolbar. Inspector jadi sheet. |
| regular | 768px sampai 1279px | Sidebar tetap di kiri. Inspector muncul sebagai sheet di atas konten. |
| wide | 1280px ke atas | Sidebar, konten, dan inspector berdampingan. |

Media query tidak bisa membaca custom property, jadi angka breakpoint ditulis langsung:

```css
@media (width < 48rem) { /* compact */ }
@media (48rem <= width < 80rem) { /* regular */ }
@media (width >= 80rem) { /* wide */ }
```

Untuk komponen yang ukurannya tergantung wadahnya (misalnya grid kotak sistem di Maps), pakai container query, bukan media query:

```css
.tile-grid-wrap { container-type: inline-size; }
.tile-grid { display: grid; gap: var(--space-3); grid-template-columns: repeat(2, minmax(0, 1fr)); }
@container (width >= 40rem) { .tile-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@container (width >= 60rem) { .tile-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
```

### 6.4 App shell

Kerangka yang sama dipakai semua halaman kecuali login.

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Peta Finance | Hub</title>
  <script src="/assets/js/prefs.js"></script>
  <link rel="stylesheet" href="/assets/css/app.css">
  <script type="module" src="/assets/js/sidebar.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Langsung ke konten</a>
  <div class="app">
    <aside class="sidebar material material-thick" id="sidebar"></aside>
    <main class="app-main" id="main" tabindex="-1">
      <header class="toolbar material material-thick">
        <!-- judul halaman dan aksi, lihat 12.14 -->
      </header>
      <div class="page">
        <!-- isi halaman -->
      </div>
    </main>
  </div>
</body>
</html>
```

- `prefs.js` adalah script biasa (bukan module) yang jalan sebelum CSS dipakai. Isinya membaca preferensi tersimpan (mode, transparansi) supaya tidak ada kedipan tampilan. Lihat 8.6.
- `sidebar.js` adalah module, jadi otomatis jalan setelah HTML selesai dibaca.

```css
/* assets/css/base.css, bagian layout */
.app {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100dvh;
}

.app-main { min-width: 0; }
.app-main:focus { outline: none; }

.page {
  padding: var(--page-padding);
  padding-bottom: calc(var(--page-padding) + env(safe-area-inset-bottom));
  max-width: var(--content-max);
}

@media (width >= 80rem) {
  .app[data-inspector="open"] {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr) var(--inspector-width);
  }
}

@media (width < 48rem) {
  .app { grid-template-columns: minmax(0, 1fr); }
}
```

### 6.5 Lebar baca dan kepadatan

- Teks paragraf: maksimal `--readable-width`.
- Tabel dan peta boleh selebar konten (`--content-max`).
- Jangan memaksa semua konten jadi satu kolom lebar di layar besar. Halaman berisi formulir cukup selebar `--readable-width`.

### 6.6 Safe area

Di iPhone dengan notch atau home indicator, tambahkan `viewport-fit=cover` di meta viewport (sudah ada di 6.4), lalu pakai `env(safe-area-inset-*)` untuk padding elemen yang menempel tepi layar. Di laptop nilainya 0, jadi aman dipakai di mana saja.

### 6.7 Anggaran tinggi sidebar (aturan tanpa scroll)

Hitungan untuk layar laptop tinggi 768px. Setelah dikurangi tab dan address bar browser, tinggi area halaman sekitar 640px.

| Bagian | Tinggi |
|---|---|
| Padding atas dan bawah sidebar | 24px |
| Header (nama app) | 48px |
| Dua judul section (Systems, Maps) | 2 x 32px = 64px |
| Footer (tombol keluar) dan jarak | 56px |
| Sisa untuk item section yang terbuka | 448px |
| Kapasitas item (40px per item) | 11 item, dipakai patokan aman 10 |

Karena hanya satu section terbuka, yang dihitung hanya section terbesar. Kalau ada section lebih dari 10 item, pecah jadi dua section. `sidebar.js` juga memberi peringatan di console kalau isi sidebar melebihi tinggi layar (lihat 12.13).

---

## 7. Bentuk

### 7.1 Tiga jenis bentuk Apple

Sejak Liquid Glass, Apple memakai tiga jenis bentuk:

| Jenis | Arti | Di hub |
|---|---|---|
| Fixed | Radius tetap, tidak tergantung wadah | Field, kotak sistem, panel |
| Capsule | Radius setengah tinggi, ujung bulat penuh | Tombol, chip, toggle, segmented control |
| Concentric | Radius dihitung dari radius wadah dikurangi padding | Elemen di dalam panel atau dialog |

### 7.2 shape.css

```css
/* assets/css/tokens/shape.css */
:root {
  --radius-xs: 4px;     /* checkbox, tag sangat kecil */
  --radius-sm: 8px;     /* item menu, item sidebar */
  --radius-md: 12px;    /* field, kotak sistem */
  --radius-lg: 16px;    /* list grouped, kartu */
  --radius-xl: 24px;    /* panel, dialog, popover besar, sidebar */
  --radius-full: 999px; /* capsule */

  --hairline: 1px;
}

/* Layar retina: garis tipis setengah piksel seperti Apple */
@media (min-resolution: 2dppx) {
  :root { --hairline: 0.5px; }
}
```

### 7.3 Concentric: rumus dan kode

Rumus: radius dalam = radius luar dikurangi padding di antaranya.

Contoh: dialog radius 24px dengan padding 8px. Tombol di dalamnya yang menempel ke tepi harus radius 16px. Kalau radius dalam terlalu besar, sudutnya terlihat terjepit (pinched). Kalau terlalu kecil, terlihat melebar (flared).

```css
.concentric {
  --radius-outer: var(--radius-xl);
  --pad: var(--space-2);
  border-radius: var(--radius-outer);
  padding: var(--pad);
}

.concentric > * {
  border-radius: max(var(--radius-xs), calc(var(--radius-outer) - var(--pad)));
}
```

`max()` menjaga radius dalam tidak pernah lebih kecil dari `--radius-xs`, karena kalau padding lebih besar dari radius luar, hasil pengurangan jadi nol atau minus.

| Wadah | Padding | Radius dalam |
|---|---|---|
| 24px (xl) | 8px | 16px (lg) |
| 24px (xl) | 12px | 12px (md) |
| 16px (lg) | 4px | 12px (md) |
| 16px (lg) | 8px | 8px (sm) |

### 7.4 Sudut halus (squircle)

Sudut Apple bukan lingkaran biasa, tapi kurva yang lebih halus (continuous corner atau squircle). CSS baru punya `corner-shape: squircle`, dan baru jalan di Chrome dan Edge versi 139 ke atas. Browser lain tetap memakai sudut biasa, jadi pakai sebagai peningkatan bertahap:

```css
@supports (corner-shape: squircle) {
  .btn, .field-input, .tile, .panel, .dialog {
    corner-shape: squircle;
  }
}
```

Kurva squircle terlihat sedikit lebih kotak dari lingkaran dengan radius sama. Kalau terasa kurang bulat, naikkan radius di dalam blok `@supports` itu saja.

### 7.5 Radius per komponen

| Komponen | Bentuk | Radius |
|---|---|---|
| Tombol | Capsule | `--radius-full` |
| Chip, badge | Capsule | `--radius-full` |
| Toggle, segmented control | Capsule | `--radius-full` |
| Field, search | Fixed | `--radius-md` |
| Item sidebar, item menu | Concentric terhadap panelnya | biasanya `--radius-sm` |
| Kotak sistem (Maps) | Fixed | `--radius-md` |
| List grouped, kartu | Fixed | `--radius-lg` |
| Sidebar, panel, dialog, popover | Fixed | `--radius-xl` |

---

## 8. Material dan kedalaman

### 8.1 Konsep

- **Material** adalah lapisan semi transparan yang memburamkan isi di belakangnya. Kamu tetap merasakan ada konten di bawah, tapi teks di atasnya tetap terbaca.
- **Liquid Glass** menambah efek lensa (membengkokkan cahaya di tepi), pantulan, dan warna yang menyesuaikan konten di bawahnya. Di web, yang bisa ditiru dengan wajar hanya blur, saturasi, garis tepi terang, dan bayangan. Jangan coba meniru efek lensa penuh; berat dan mudah merusak keterbacaan.
- Material hanya terlihat kalau ada sesuatu di belakangnya. Di atas latar hitam polos, material terlihat seperti panel abu gelap biasa. Itu normal.

### 8.2 Kapan memakai material

- Pakai untuk lapisan navigasi dan kontrol yang melayang: sidebar, toolbar, popover, menu, kontrol pemutar rute di Maps.
- Jangan pakai untuk area konten yang di-scroll seperti tabel dan list. Itu mengaburkan hierarki.
- Jangan menumpuk material di atas material.
- Jangan memberi warna aksen pada material. Material tetap netral.

### 8.3 Ketebalan dan batas teks

Hasil hitung kontras teks di atas material gelap, saat yang ada di belakangnya adalah konten putih (kondisi terburuk, tanpa memperhitungkan blur):

| Ketebalan | Latar | `label` | `secondary-label` | Boleh berisi |
|---|---|---|---|---|
| ultra-thin | #1C1C1E alpha 0.40 | 2.49 | 1.61 | Tanpa teks. Hanya dekorasi. |
| thin | alpha 0.58 | 4.23 | 2.29 | Tanpa teks. |
| regular | alpha 0.72 | 6.68 | 3.17 | Teks `label` saja (menu, popover). |
| thick | alpha 0.86 | 11.01 | 4.50 | Semua teks. Dipakai sidebar dan toolbar. |

Kesimpulan: sidebar dan toolbar wajib `thick` karena berisi teks sekunder. Popover dan menu yang isinya teks utama cukup `regular`.

### 8.4 materials.css

```css
/* assets/css/tokens/materials.css */
:root {
  --material-saturate: saturate(180%);

  --material-ultra-thin-bg: rgb(28 28 30 / 0.4);
  --material-ultra-thin-blur: 16px;
  --material-thin-bg: rgb(28 28 30 / 0.58);
  --material-thin-blur: 20px;
  --material-regular-bg: rgb(28 28 30 / 0.72);
  --material-regular-blur: 28px;
  --material-thick-bg: rgb(28 28 30 / 0.86);
  --material-thick-blur: 36px;

  /* Garis tepi dan kilau atas, tiruan sederhana pantulan kaca */
  --material-edge: rgb(255 255 255 / 0.08);
  --material-highlight: rgb(255 255 255 / 0.12);

  /* Bayangan. Di mode gelap bayangan lemah, kedalaman utama dari latar elevated */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
  --shadow-popover: 0 8px 24px rgb(0 0 0 / 0.4);
  --shadow-sheet: 0 24px 64px rgb(0 0 0 / 0.55);

  /* Urutan tumpukan untuk elemen yang tidak masuk top layer */
  --z-sticky: 10;
  --z-sidebar: 20;
  --z-toolbar: 30;
}

:root[data-theme="light"] {
  --material-ultra-thin-bg: rgb(242 242 247 / 0.4);
  --material-thin-bg: rgb(242 242 247 / 0.58);
  --material-regular-bg: rgb(242 242 247 / 0.72);
  --material-thick-bg: rgb(242 242 247 / 0.86);
  --material-edge: rgb(0 0 0 / 0.06);
  --material-highlight: rgb(255 255 255 / 0.5);
  --shadow-popover: 0 8px 24px rgb(0 0 0 / 0.12);
  --shadow-sheet: 0 24px 64px rgb(0 0 0 / 0.18);
}
```

Nilai alpha dan blur di atas adalah pendekatan. Apple tidak menerbitkan angka pasti. Kontras mode terang belum dihitung; cek ulang saat mode terang dibuat.

### 8.5 Class material (masuk ke base.css)

```css
/* assets/css/base.css, bagian material */
.material {
  --_bg: var(--material-regular-bg);
  --_blur: var(--material-regular-blur);
  background: var(--_bg);
  -webkit-backdrop-filter: blur(var(--_blur)) var(--material-saturate);
  backdrop-filter: blur(var(--_blur)) var(--material-saturate);
  border: var(--hairline) solid var(--material-edge);
  box-shadow: inset 0 1px 0 var(--material-highlight);
}
.material-ultra-thin { --_bg: var(--material-ultra-thin-bg); --_blur: var(--material-ultra-thin-blur); }
.material-thin       { --_bg: var(--material-thin-bg);       --_blur: var(--material-thin-blur); }
.material-regular    { --_bg: var(--material-regular-bg);    --_blur: var(--material-regular-blur); }
.material-thick      { --_bg: var(--material-thick-bg);      --_blur: var(--material-thick-blur); }
```

### 8.6 Fallback dan Reduce Transparency

Tiga situasi di mana kaca harus jadi panel padat:

1. Browser tidak mendukung `backdrop-filter`.
2. Pengguna menyalakan Reduce Transparency di sistem. Media query `prefers-reduced-transparency` baru didukung Chrome dan Edge. Safari dan Firefox belum.
3. Kamu sendiri mematikan transparansi lewat saklar di hub (untuk menutup kekurangan nomor 2).

```css
/* assets/css/base.css, lanjutan bagian material */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .material { background: var(--color-secondary-system-background); }
}

@media (prefers-reduced-transparency: reduce) {
  .material {
    background: var(--color-secondary-system-background);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

:root[data-transparency="reduced"] .material {
  background: var(--color-secondary-system-background);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
```

`prefs.js` membaca pilihan yang tersimpan sebelum halaman digambar:

```js
// assets/js/prefs.js (script biasa, bukan module, dipanggil di <head>)
try {
  const root = document.documentElement;
  const theme = localStorage.getItem("hub-theme");
  const transparency = localStorage.getItem("hub-transparency");
  if (theme === "light") root.dataset.theme = "light";
  if (transparency === "reduced") root.dataset.transparency = "reduced";
} catch {
  // localStorage bisa tidak tersedia (mode privat). Pakai bawaan.
}
```

Untuk menyimpan pilihan dari halaman pengaturan nanti:

```js
export function setTransparency(reduced) {
  const root = document.documentElement;
  if (reduced) root.dataset.transparency = "reduced";
  else delete root.dataset.transparency;
  try { localStorage.setItem("hub-transparency", reduced ? "reduced" : "normal"); } catch {}
}
```

### 8.7 Kedalaman

- **Latar elevated**: dialog, sheet, dan popover memakai `--color-elevated-background`. Di mode gelap ini lebih terang dari latar halaman, jadi terasa di depan.
- **Bayangan**: hanya untuk elemen yang melayang (popover, sheet). Jangan beri bayangan ke kartu biasa.
- **Top layer**: `<dialog>` yang dibuka dengan `showModal()` dan elemen dengan atribut `popover` otomatis tampil di lapisan paling atas halaman. Tidak perlu z-index sama sekali, dan tidak mungkin tertutup elemen lain.
- **z-index manual** hanya untuk elemen sticky (toolbar, header tabel) dan sidebar. Pakai token `--z-*`, jangan angka acak seperti 9999.

---

## 9. Gerak

### 9.1 Konsep

- Apple memakai animasi **spring**: gerak berbasis fisika pegas. Gerak terasa alami karena mengikuti kecepatan, bukan sekadar durasi tetap.
- Spring Apple diatur dengan dua angka: **duration** (seberapa cepat, disebut juga response) dan **bounce** (seberapa memantul). Bounce 0 berarti mulus tanpa pantulan.
- Spring bisa diinterupsi: kalau pengguna membalik aksi di tengah animasi, gerak berbalik dengan mulus. Di CSS, `transition` bisa diinterupsi, `@keyframes` tidak. Jadi perubahan state pakai `transition`.
- CSS punya fungsi easing `linear()` yang menerima banyak titik. Dengan titik hasil hitung rumus pegas, kita dapat kurva spring asli. `linear()` sudah didukung semua browser modern.

### 9.2 Cara kurva dihitung

- Model: pegas teredam dengan damping ratio = 1 dikurangi bounce.
- Waktu animasi CSS = waktu sampai pegas benar-benar diam (selisih dari posisi akhir kurang dari 0.1%).
- Waktu diam sebanding dengan response. Rasio waktu diam terhadap response: smooth 1.47, snappy 1.39, bouncy 1.64.
- Contoh: smooth dengan response 0.35 detik butuh durasi CSS 0.35 x 1.47 = sekitar 515ms.

### 9.3 Tiga spring

| Nama | Bounce | Puncak lewat | Durasi kecil (response 0.25s) | Durasi normal (response 0.35s) | Dipakai untuk |
|---|---|---|---|---|---|
| smooth | 0 | Tidak lewat | 370ms | 515ms | Bawaan. Panel, accordion, dialog, inspector. |
| snappy | 0.15 | 0.6% | 350ms | 490ms | Umpan balik interaksi: toggle, segmented, tombol ditekan. |
| bouncy | 0.3 | 4.6% | 410ms | 575ms | Jarang. Tanda sukses, elemen yang ingin terasa hidup. |

Durasi kecil untuk elemen kecil (chevron, toggle). Durasi normal untuk elemen besar (panel, dialog).

### 9.4 motion.css

```css
/* assets/css/tokens/motion.css */
:root {
  --spring-smooth: linear(0, 0.058, 0.18, 0.321, 0.455, 0.573, 0.671, 0.75, 0.812, 0.86, 0.897, 0.924, 0.944, 0.96, 0.971, 0.979, 0.985, 0.989, 0.992, 0.994, 0.996, 0.997, 0.998, 0.999, 1);
  --spring-smooth-duration-sm: 370ms;
  --spring-smooth-duration: 515ms;

  --spring-snappy: linear(0, 0.021, 0.075, 0.148, 0.233, 0.322, 0.411, 0.495, 0.573, 0.644, 0.707, 0.762, 0.81, 0.85, 0.884, 0.912, 0.935, 0.953, 0.967, 0.979, 0.987, 0.994, 0.998, 1.002, 1.004, 1.005, 1.006, 1.006, 1.006, 1.006, 1.005, 1.005, 1.004, 1.004, 1.003, 1.003, 1.002, 1.002, 1.002, 1.001, 1);
  --spring-snappy-duration-sm: 350ms;
  --spring-snappy-duration: 490ms;

  --spring-bouncy: linear(0, 0.029, 0.103, 0.204, 0.319, 0.436, 0.55, 0.653, 0.745, 0.823, 0.887, 0.938, 0.977, 1.006, 1.025, 1.037, 1.044, 1.046, 1.045, 1.042, 1.037, 1.032, 1.026, 1.021, 1.016, 1.012, 1.009, 1.005, 1.003, 1.001, 1, 0.999, 0.998, 0.998, 0.998, 0.998, 0.998, 0.998, 0.999, 0.999, 1);
  --spring-bouncy-duration-sm: 410ms;
  --spring-bouncy-duration: 575ms;

  /* Untuk perubahan warna dan opacity, bukan gerak */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);
  --ease-out: cubic-bezier(0, 0, 0.58, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --spring-smooth-duration-sm: 0ms;
    --spring-smooth-duration: 0ms;
    --spring-snappy-duration-sm: 0ms;
    --spring-snappy-duration: 0ms;
    --spring-bouncy-duration-sm: 0ms;
    --spring-bouncy-duration: 0ms;
  }
}
```

Saat Reduce Motion aktif, semua gerak spring jadi instan. Perubahan warna dan opacity (`--duration-fast`) tetap jalan karena tidak memicu mual.

Contoh pakai:

```css
.panel {
  transition: translate var(--spring-smooth-duration) var(--spring-smooth),
              opacity var(--duration-fast) var(--ease-out);
}
```

### 9.5 Animasi masuk dengan @starting-style

Elemen yang baru muncul (dialog, popover, toast) butuh nilai awal untuk dianimasikan. `@starting-style` memberi nilai awal itu tanpa JS:

```css
.toast {
  opacity: 1;
  translate: 0 0;
  transition: opacity var(--duration-fast) var(--ease-out),
              translate var(--spring-smooth-duration) var(--spring-smooth);
}

@starting-style {
  .toast {
    opacity: 0;
    translate: 0 1rem;
  }
}
```

### 9.6 Aturan gerak

1. Yang dianimasikan hanya `transform` (`translate`, `scale`, `rotate`) dan `opacity`. Keduanya ringan. Pengecualian: tinggi isi accordion sidebar.
2. Perubahan state pakai `transition`, bukan `@keyframes`, supaya bisa diinterupsi.
3. Tombol ditekan: `scale: 0.97` dengan spring snappy kecil.
4. Menutup lebih cepat dari membuka. Buka pakai durasi normal, tutup pakai durasi kecil.
5. Gerak harus punya arti: elemen muncul dari arah asalnya (sheet dari bawah, inspector dari kanan).
6. Tidak ada animasi berulang terus-menerus kecuali indikator loading.

### 9.7 Membuat kurva spring sendiri

Kalau butuh bounce lain, jalankan fungsi ini di console browser:

```js
function springLinear(bounce = 0, titik = 40) {
  const zeta = 1 - bounce;
  const w0 = 2 * Math.PI; // response 1 detik, bentuk kurva tidak tergantung durasi
  const x = (t) => {
    if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
  };
  let diam = 0;
  for (let t = 0; t < 5; t += 0.0005) {
    if (Math.abs(1 - x(t)) > 0.001) diam = t;
  }
  const nilai = Array.from({ length: titik + 1 }, (_, i) => +x((diam * i) / titik).toFixed(3));
  nilai[0] = 0;
  nilai[titik] = 1;
  return { easing: `linear(${nilai.join(", ")})`, rasioDurasi: +diam.toFixed(2) };
}

// Contoh: springLinear(0.2)
// Durasi CSS = response yang kamu mau (detik) x rasioDurasi
```

---

## 10. Ikon

### 10.1 Konsep

- SF Symbols dirancang menyatu dengan teks: ketebalan garisnya mengikuti ketebalan huruf di sebelahnya, dan ukurannya mengikuti text style.
- Hub memakai Lucide dengan aturan yang meniru perilaku itu: ukuran ikut text style, tebal garis disesuaikan ukuran.

### 10.2 Sprite SVG

Semua ikon disimpan di satu file `sprite.svg`. Tiap ikon jadi satu `<symbol>`.

```xml
<!-- assets/icons/sprite.svg -->
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="map" viewBox="0 0 24 24">
    <!-- salin isi <path>, <circle>, dll dari file SVG Lucide "map" -->
  </symbol>
  <symbol id="chevron-right" viewBox="0 0 24 24">
    <!-- isi dari Lucide "chevron-right" -->
  </symbol>
</svg>
```

Cara menyalin dari Lucide:

1. Unduh SVG ikon dari lucide.dev.
2. Ambil hanya elemen di dalam `<svg>` (biasanya `<path>`, `<circle>`, `<rect>`, `<line>`).
3. Jangan bawa atribut `stroke`, `stroke-width`, `fill`, dan sejenisnya. Semua diatur dari CSS.

Pemakaian di HTML:

```html
<svg class="icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#map"></use></svg>
```

### 10.3 CSS ikon (masuk ke base.css)

```css
/* assets/css/base.css, bagian ikon */
.icon {
  --icon-size: 1.25rem;
  --icon-stroke: 1.75;
  width: var(--icon-size);
  height: var(--icon-size);
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: var(--icon-stroke);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.icon-sm { --icon-size: 1rem;    --icon-stroke: 2; }
.icon-md { --icon-size: 1.25rem; --icon-stroke: 1.75; }
.icon-lg { --icon-size: 1.5rem;  --icon-stroke: 1.75; }
.icon-xl { --icon-size: 3rem;    --icon-stroke: 1.5; }
```

Properti `stroke`, `fill`, dan `stroke-width` diwariskan ke dalam `<use>`, jadi satu aturan CSS berlaku untuk semua ikon.

### 10.4 Ukuran dan pasangan teks

| Class | Ukuran | Tebal garis | Berdampingan dengan |
|---|---|---|---|
| `.icon-sm` | 16px | 2 | Footnote, Caption |
| `.icon-md` | 20px | 1.75 | Body, Callout, item sidebar |
| `.icon-lg` | 24px | 1.75 | Title 2, Title 3, tombol ikon toolbar |
| `.icon-xl` | 48px | 1.5 | Empty state |

Ikon kecil butuh garis lebih tebal supaya tidak hilang. Ikon besar butuh garis lebih tipis supaya tidak terlihat berat.

### 10.5 Daftar ikon hub

| Pemakaian | Nama ikon Lucide |
|---|---|
| Finance | `landmark` |
| Finance Self | `piggy-bank` |
| Health | `heart-pulse` |
| Logistics | `truck` |
| Game | `gamepad-2` |
| Game Story | `book-open` |
| Retail dan Manufaktur | `factory` |
| Energi | `zap` |
| Peta (umum) | `map` |
| Chevron accordion dan baris list | `chevron-right` |
| Chevron select | `chevron-down` |
| Aksi lain (menu) | `ellipsis` |
| Keluar | `log-out` |
| Cari | `search` |
| Tutup | `x` |
| Filter | `filter` |
| Putar, jeda, mundur, maju | `play`, `pause`, `skip-back`, `skip-forward` |
| Info | `info` |
| Peringatan | `triangle-alert` |
| Berhasil | `circle-check` |
| Gagal | `circle-x` |
| Kunci (login) | `lock` |
| Menu (layar kecil) | `panel-left` |

Nama ikon Lucide kadang berubah antar versi. Kalau nama tidak ditemukan, cari dengan kata kunci di lucide.dev.

### 10.6 Aturan ikon

1. Ikon dekoratif (ada teks di sebelahnya) wajib `aria-hidden="true"`.
2. Tombol yang isinya hanya ikon wajib punya `aria-label`.
3. Warna ikon ikut teks (`currentColor`). Untuk ikon berwarna aksen, ubah `color` elemen induknya.
4. Ikon di sidebar memakai `--color-tint`, seperti sidebar macOS.
5. Satu konsep satu ikon. Jangan pakai dua ikon berbeda untuk aksi yang sama.
6. Jangan campur set ikon lain dengan Lucide.

---

## 11. Aksesibilitas

### 11.1 Target WCAG 2.2 AA yang paling relevan

| Kriteria | Isi singkat | Cara di hub |
|---|---|---|
| 1.4.3 Kontras teks | Teks biasa 4.5:1, teks besar 3:1 | Token `-text` dan `-fill`, aturan warna 4.7 |
| 1.4.11 Kontras non-teks | Border kontrol, ikon penting, fokus 3:1 | `--color-control-border`, `--color-tint` |
| 1.4.1 Pemakaian warna | Warna bukan satu-satunya penanda | Status pakai ikon atau teks, koneksi pakai pola garis |
| 1.4.4 Ubah ukuran teks | Zoom 200% tanpa rusak | Semua `rem`, bagian 5.7 |
| 1.4.10 Reflow | Lebar 320px tanpa scroll samping | Size class compact, sidebar jadi laci |
| 2.1.1 Keyboard | Semua bisa dipakai tanpa mouse | Elemen HTML bawaan, pola tab di 12.11 |
| 2.4.7 Fokus terlihat | Ada penanda fokus jelas | Cincin fokus di 11.2 |
| 2.4.11 Fokus tidak tertutup | Elemen terfokus tidak tertutup elemen sticky | `scroll-padding-top` |
| 2.5.8 Ukuran target | Target minimal 24 x 24px | Kontrol minimal 28px, 44px di layar sentuh |
| 3.3.1 dan 3.3.2 | Error dijelaskan, field punya label | Komponen field 12.3 |
| 4.1.2 Nama, peran, nilai | Pembaca layar tahu fungsi elemen | HTML bawaan, ARIA hanya kalau perlu |

### 11.2 Fokus keyboard

```css
/* assets/css/base.css, bagian aksesibilitas */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* Elemen terfokus tidak tertutup toolbar sticky saat di-scroll otomatis */
html { scroll-padding-top: calc(var(--toolbar-height) + var(--space-4)); }
```

- `:focus-visible` hanya muncul saat navigasi pakai keyboard, tidak saat klik mouse. Ini mirip perilaku macOS.
- Cincin fokus memakai warna solid, bukan transparan, supaya kontrasnya tetap minimal 3:1 (#0A84FF di #2C2C2E: 3.82).
- Jangan pernah `outline: none` tanpa pengganti.

### 11.3 Skip link dan landmark

```css
.skip-link {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: calc(var(--z-toolbar) + 1);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-tint-fill);
  color: var(--color-on-tint-fill);
  translate: 0 -200%;
}
.skip-link:focus-visible { translate: 0 0; }
```

- Tiap halaman punya: `<nav aria-label="Navigasi utama">` (di sidebar), `<main id="main">`, dan `<aside aria-label="Detail sistem">` untuk inspector.
- `<html lang="id">` wajib, supaya pembaca layar memakai pelafalan bahasa Indonesia.
- Satu `h1` per halaman, urutan heading tidak melompat (h1, h2, h3).

### 11.4 Teks khusus pembaca layar

```css
.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

Dipakai untuk judul tabel (`caption`), legend grup radio, atau label tambahan yang secara visual sudah jelas dari konteks.

### 11.5 Live region

Perubahan yang muncul tanpa pindah halaman (toast, langkah rute di Maps, hasil pencarian) harus diumumkan ke pembaca layar:

```html
<div class="visually-hidden" aria-live="polite" id="announcer"></div>
```

```js
export function announce(pesan) {
  const el = document.getElementById("announcer");
  el.textContent = "";
  requestAnimationFrame(() => { el.textContent = pesan; });
}
```

Dikosongkan dulu supaya pesan yang sama tetap diumumkan ulang.

### 11.6 Cek kontras sendiri

Jalankan di console browser saat mengganti warna:

```js
function kontras(hexA, hexB) {
  const lum = (hex) => {
    const [r, g, b] = hex.replace("#", "").match(/../g)
      .map((h) => parseInt(h, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [tinggi, rendah] = [lum(hexA), lum(hexB)].sort((x, y) => y - x);
  return +((tinggi + 0.05) / (rendah + 0.05)).toFixed(2);
}

// Warna dengan alpha: campur dulu dengan latarnya
function campur(hexDepan, alpha, hexLatar) {
  const ke = (hex) => hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16));
  const d = ke(hexDepan), l = ke(hexLatar);
  return "#" + d.map((v, i) => Math.round(v * alpha + l[i] * (1 - alpha)).toString(16).padStart(2, "0")).join("");
}

// kontras("#409CFF", "#2C2C2E")                        hasilnya 4.92
// kontras(campur("#EBEBF5", 0.6, "#1C1C1E"), "#1C1C1E")  hasilnya 5.94
```

### 11.7 Pengujian rutin

Lakukan tiap selesai satu komponen atau halaman:

1. Pakai hanya keyboard: Tab, Shift+Tab, Enter, Spasi, Esc, tombol panah. Semua bisa dijangkau dan urutannya masuk akal.
2. Zoom browser 200%. Tidak ada yang terpotong.
3. Lebar jendela 320px. Tidak ada scroll ke samping (kecuali tabel dan tab yang memang boleh).
4. Nyalakan Reduce Motion, Increase Contrast, dan Reduce Transparency di pengaturan sistem. Tampilan menyesuaikan.
5. Pembaca layar: VoiceOver di Mac (Cmd+F5) atau NVDA di Windows (gratis). Cek label tombol ikon dan pengumuman live region.
6. Lighthouse di Chrome DevTools, bagian Accessibility. Target skor 100, tapi skor 100 tidak menjamin bebas masalah; langkah 1 sampai 5 tetap wajib.

---

## 12. Komponen dasar

Format tiap komponen: kegunaan, kode HTML, kode CSS, state, aturan. Semua kode memakai token dari bagian 4 sampai 10.

### 12.1 Tombol

**Kegunaan**: memicu aksi.

| Varian | Kapan | Contoh |
|---|---|---|
| `btn-filled` | Aksi utama. Maksimal satu per area. | Masuk, Simpan |
| `btn-tinted` | Aksi penting kedua | Ekspor, Putar rute |
| `btn-gray` | Aksi biasa | Batal, Filter |
| `btn-plain` | Aksi ringan, mirip link | Lihat semua |
| `btn-destructive` | Aksi merusak, selalu dengan konfirmasi | Hapus |

| Ukuran | Tinggi | Teks |
|---|---|---|
| `btn-sm` | 28px | Subheadline semibold |
| bawaan (md) | 36px | Body semibold |
| `btn-lg` | 44px | Body semibold |

```html
<button class="btn btn-filled" type="button">Simpan</button>
<button class="btn btn-tinted" type="button">Ekspor</button>
<button class="btn btn-gray btn-sm" type="button">
  <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#filter"></use></svg>
  Filter
</button>
<button class="btn btn-destructive" type="button">Hapus</button>
<button class="btn btn-filled" type="submit" aria-busy="true">Masuk</button>
```

```css
/* assets/css/components/button.css */
.btn {
  --btn-height: var(--control-height-md);
  --btn-pad-x: var(--space-4);
  --btn-font-size: var(--text-body-size);
  --btn-line: var(--text-body-line);
  --btn-bg: var(--color-tertiary-system-fill);
  --btn-fg: var(--color-label);
  --btn-hover: color-mix(in srgb, var(--btn-bg), var(--color-hover-mix) 8%);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--radius-full);
  background: var(--btn-bg);
  color: var(--btn-fg);
  font-size: var(--btn-font-size);
  line-height: var(--btn-line);
  font-weight: var(--weight-semibold);
  text-decoration: none;       /* tombol berupa <a> tidak bergaris bawah saat hover */
  white-space: nowrap;
  user-select: none;
  transition:
    background-color var(--duration-instant) var(--ease-out),
    scale var(--spring-snappy-duration-sm) var(--spring-snappy);
}

.btn-sm {
  --btn-height: var(--control-height-sm);
  --btn-pad-x: var(--space-3);
  --btn-font-size: var(--text-subheadline-size);
  --btn-line: var(--text-subheadline-line);
}
.btn-lg { --btn-height: var(--control-height-lg); --btn-pad-x: var(--space-5); }

.btn-filled { --btn-bg: var(--color-tint-fill); --btn-fg: var(--color-on-tint-fill); }
.btn-tinted { --btn-bg: var(--color-tint-soft); --btn-fg: var(--color-tint-text); }
.btn-gray   { --btn-bg: var(--color-tertiary-system-fill); --btn-fg: var(--color-label); }
.btn-plain  { --btn-bg: transparent; --btn-fg: var(--color-tint-text); --btn-pad-x: var(--space-2); }
.btn-destructive { --btn-bg: var(--color-error-fill); --btn-fg: var(--color-on-error-fill); }

/* Tombol berwarna penuh digelapkan saat hover supaya kontras teks putih tidak turun */
.btn-filled, .btn-destructive {
  --btn-hover: color-mix(in srgb, var(--btn-bg), black 15%);
}

@media (hover: hover) {
  .btn:hover:not(:disabled, [aria-disabled="true"]) { background: var(--btn-hover); }
}

.btn:active:not(:disabled, [aria-disabled="true"]) { scale: 0.97; }

.btn:disabled,
.btn[aria-disabled="true"] {
  --btn-bg: var(--color-quaternary-system-fill);
  --btn-fg: var(--color-tertiary-label);
  cursor: not-allowed;
}
.btn-plain:disabled,
.btn-plain[aria-disabled="true"] { --btn-bg: transparent; }

/* Loading: teks disembunyikan tapi lebar tombol tetap */
.btn[aria-busy="true"] {
  position: relative;
  color: transparent;
  pointer-events: none;
}
.btn[aria-busy="true"]::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid var(--btn-fg);
  border-right-color: transparent;
  animation: spin 0.8s linear infinite;
}
```

`@keyframes spin` ada di `progress.css` (13.5). Karena semua CSS digabung lewat `app.css`, keyframes bisa dipakai dari file mana pun.

**State**: biasa, hover (hanya perangkat dengan mouse), ditekan (mengecil 3%), fokus (cincin), nonaktif, loading.

**Aturan**:

1. Label berupa kata kerja, 1 sampai 3 kata: "Simpan", "Putar rute". Bukan "OK" atau "Klik di sini".
2. Selalu tulis `type="button"` kecuali memang tombol submit form.
3. Pakai `aria-disabled="true"` (bukan `disabled`) kalau tombol nonaktif perlu tetap bisa difokus untuk menjelaskan alasannya lewat teks di dekatnya.
4. Aksi destructive yang tidak bisa dibatalkan wajib lewat dialog konfirmasi (13.2).

### 12.2 Tombol ikon

**Kegunaan**: aksi di toolbar atau panel yang cukup diwakili ikon.

```html
<button class="icon-btn" type="button" aria-label="Tutup panel">
  <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#x"></use></svg>
</button>
```

```css
/* assets/css/components/button.css, lanjutan */
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: var(--control-height-md);
  height: var(--control-height-md);
  flex: none;
  border-radius: var(--radius-full);
  color: var(--color-secondary-label);
  transition:
    background-color var(--duration-instant) var(--ease-out),
    color var(--duration-instant) var(--ease-out),
    scale var(--spring-snappy-duration-sm) var(--spring-snappy);
}
@media (hover: hover) {
  .icon-btn:hover { background: var(--color-quaternary-system-fill); color: var(--color-label); }
}
.icon-btn:active { scale: 0.94; }
.icon-btn[aria-pressed="true"] { background: var(--color-tint-soft); color: var(--color-tint); }
```

**Aturan**: wajib `aria-label`. Kalau artinya tidak langsung jelas dari ikon, pakai tombol dengan teks.

### 12.3 Field teks

**Kegunaan**: input teks dengan label, teks bantuan, dan pesan error.

```html
<div class="field">
  <label class="field-label" for="password">Password</label>
  <input class="field-input" id="password" name="password" type="password"
         autocomplete="current-password" aria-describedby="password-help">
  <p class="field-help" id="password-help">Minimal 16 karakter.</p>
</div>

<!-- Saat error -->
<div class="field">
  <label class="field-label" for="password">Password</label>
  <input class="field-input" id="password" name="password" type="password"
         aria-invalid="true" aria-describedby="password-error">
  <p class="field-error" id="password-error">
    <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#circle-x"></use></svg>
    Password salah.
  </p>
</div>
```

```css
/* assets/css/components/field.css */
.field { display: grid; gap: var(--space-2); }

.field-label {
  font-size: var(--text-subheadline-size);
  line-height: var(--text-subheadline-line);
  font-weight: var(--weight-semibold);
}

.field-input {
  width: 100%;
  min-height: var(--control-height-md);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-md);
  background: var(--color-tertiary-system-fill);
  color: var(--color-label);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  transition: border-color var(--duration-fast) var(--ease-out);
}
.field-input::placeholder { color: var(--color-placeholder-text); }
.field-input:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
  border-color: var(--color-tint);
}
.field-input[aria-invalid="true"] { border-color: var(--color-error); }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }

.field-help,
.field-error {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-footnote-size);
  line-height: var(--text-footnote-line);
}
.field-help { color: var(--color-secondary-label); }
.field-error { color: var(--color-error-text); }
```

**Aturan**:

1. Label selalu terlihat di atas field. Placeholder bukan pengganti label.
2. Placeholder hanya untuk contoh format. Supaya tetap lolos kontras, `--color-placeholder-text` di `colors.css` diarahkan ke `--color-secondary-label`, bukan `tertiary-label` seperti Apple.
3. Ukuran teks field minimal 16px. Di bawah itu, Safari iPhone otomatis zoom saat field difokus. Body 17px sudah aman.
4. Error ditampilkan di bawah field, menjelaskan apa yang salah dan cara memperbaiki, disambungkan lewat `aria-describedby`.
5. Pakai `autocomplete` yang tepat (`current-password`, `email`, dan seterusnya).

### 12.4 Search field

```html
<search class="search">
  <svg class="icon icon-sm search-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#search"></use></svg>
  <input class="field-input search-input" type="search" placeholder="Cari sistem atau protokol"
         aria-label="Cari sistem atau protokol">
  <button class="icon-btn search-clear" type="button" aria-label="Hapus pencarian">
    <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#x"></use></svg>
  </button>
</search>
```

```css
/* assets/css/components/field.css, lanjutan */
.search { position: relative; display: block; min-width: 14rem; }
.search-input {
  border-radius: var(--radius-full);
  padding-inline: var(--space-8) var(--space-8);
}
.search-input::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }
.search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  translate: 0 -50%;
  color: var(--color-secondary-label);
  pointer-events: none;
}
.search-clear {
  position: absolute;
  right: var(--space-1);
  top: 50%;
  translate: 0 -50%;
  width: var(--control-height-sm);
  height: var(--control-height-sm);
}
/* Tombol hapus hanya muncul kalau ada isi */
.search-input:placeholder-shown + .search-clear { display: none; }
```

```js
// Pasang sekali per halaman
document.querySelectorAll(".search").forEach((box) => {
  const input = box.querySelector(".search-input");
  box.querySelector(".search-clear")?.addEventListener("click", () => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
});
```

Elemen `<search>` memberi tahu pembaca layar bahwa ini area pencarian. Tombol Esc di field `type="search"` juga mengosongkan isi di Chrome dan Edge.

### 12.5 Toggle (switch)

**Kegunaan**: menyalakan atau mematikan sesuatu yang langsung berlaku, tanpa tombol simpan.

```html
<label class="toggle">
  <span>Kurangi transparansi</span>
  <input class="toggle-input" type="checkbox" role="switch">
</label>
```

```css
/* assets/css/components/toggle.css */
.toggle {
  --toggle-on: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--row-height);
  cursor: pointer;
}

.toggle-input {
  appearance: none;
  position: relative;
  flex: none;
  width: 3.1875rem;   /* 51px, ukuran switch iOS */
  height: 1.9375rem;  /* 31px */
  margin: 0;
  border-radius: var(--radius-full);
  background: var(--color-system-fill);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}
.toggle-input::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.6875rem;   /* 27px */
  height: 1.6875rem;
  border-radius: 50%;
  background: var(--color-knob);
  box-shadow: var(--shadow-sm);
  transition: translate var(--spring-snappy-duration-sm) var(--spring-snappy);
}
.toggle-input:checked { background: var(--toggle-on); }
.toggle-input:checked::before { translate: 1.25rem 0; }
.toggle-input:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.toggle-input:disabled { opacity: 0.4; cursor: not-allowed; }
```

**Aturan**:

1. Warna nyala hijau seperti bawaan Apple. Penanda utama tetap posisi kenop putih, jadi tidak bergantung warna.
2. Label menjelaskan apa yang dinyalakan, bukan status ("Kurangi transparansi", bukan "Aktif").
3. Kalau perubahan baru berlaku setelah disimpan, pakai checkbox, bukan toggle.

### 12.6 Checkbox dan radio

Pakai elemen bawaan, cukup diwarnai dengan `accent-color`. Browser otomatis menjaga kontras tanda centang.

```css
/* assets/css/components/toggle.css, lanjutan */
input[type="checkbox"]:not([role="switch"]),
input[type="radio"] {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-tint);
  cursor: pointer;
}
```

```html
<label class="check"><input type="checkbox" name="eksternal"> Tampilkan pihak luar</label>
```

### 12.7 Segmented control

**Kegunaan**: memilih satu dari 2 sampai 5 pilihan yang mengubah tampilan (misalnya Peta atau Daftar).

```html
<fieldset class="segmented">
  <legend class="visually-hidden">Tampilan</legend>
  <label><input type="radio" name="tampilan" value="peta" checked><span>Peta</span></label>
  <label><input type="radio" name="tampilan" value="daftar"><span>Daftar</span></label>
</fieldset>
```

```css
/* assets/css/components/segmented.css */
.segmented {
  display: inline-flex;
  gap: var(--space-0-5);
  margin: 0;
  padding: var(--space-0-5);
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-tertiary-system-fill);
}
.segmented label { position: relative; }
.segmented input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.segmented span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: calc(var(--control-height-md) - var(--space-1));
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-subheadline-size);
  line-height: var(--text-subheadline-line);
  font-weight: var(--weight-medium);
  color: var(--color-secondary-label);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}
.segmented input:checked + span {
  background: var(--color-elevated-tertiary-background);
  color: var(--color-label);
  box-shadow: var(--shadow-sm);
}
.segmented input:focus-visible + span {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}
```

**Aturan**: maksimal 5 segmen dengan label pendek. Lebih dari itu pakai tabs (12.11) atau select (12.8). Tombol panah otomatis berpindah pilihan karena memakai radio.

### 12.8 Select

```html
<div class="select">
  <label class="field-label" for="jenis">Jenis integrasi</label>
  <div class="select-box">
    <select class="field-input" id="jenis">
      <option>Semua</option>
      <option>API sinkron</option>
      <option>Event</option>
    </select>
    <svg class="icon icon-sm select-chevron" aria-hidden="true"><use href="/assets/icons/sprite.svg#chevron-down"></use></svg>
  </div>
</div>
```

```css
/* assets/css/components/field.css, lanjutan */
.select { display: grid; gap: var(--space-2); }
.select-box { position: relative; }
.select-box select {
  appearance: none;
  padding-right: var(--space-8);
  cursor: pointer;
}
.select-chevron {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  translate: 0 -50%;
  color: var(--color-secondary-label);
  pointer-events: none;
}
```

- Ikon chevron memakai elemen SVG terpisah karena CSP memblokir ikon `data:` di `background-image`.
- Daftar pilihan yang terbuka tetap bawaan sistem dan otomatis gelap karena `color-scheme: dark`.
- Tambahkan `chevron-down` ke sprite.

### 12.9 List (inset grouped)

**Kegunaan**: daftar baris dalam kotak membulat, seperti aplikasi Settings. Dipakai untuk daftar koneksi di inspector, pengaturan, dan beranda.

```html
<section class="list-section">
  <h2 class="list-header">Mengirim ke</h2>
  <ul class="list list-has-icons" role="list">
    <li>
      <a class="list-row" href="#s-12">
        <svg class="icon icon-md list-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#landmark"></use></svg>
        <span class="list-title">Core Banking</span>
        <span class="list-value">REST</span>
        <svg class="icon icon-sm list-chevron" aria-hidden="true"><use href="/assets/icons/sprite.svg#chevron-right"></use></svg>
      </a>
    </li>
    <li>
      <div class="list-row">
        <svg class="icon icon-md list-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#landmark"></use></svg>
        <span class="list-title">Fraud Detection</span>
        <span class="list-value">Event</span>
      </div>
    </li>
  </ul>
  <p class="list-footer">Koneksi diurutkan berdasarkan nomor sistem.</p>
</section>
```

```css
/* assets/css/components/list.css */
.list-section { display: grid; gap: var(--space-2); }

.list-header,
.list-footer {
  padding-inline: var(--space-4);
  font-size: var(--text-footnote-size);
  line-height: var(--text-footnote-line);
  color: var(--color-secondary-label);
}
.list-header { font-weight: var(--weight-semibold); }

.list {
  --list-inset: var(--space-4);
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-secondary-system-grouped-background);
}
.list-has-icons { --separator-inset: calc(var(--list-inset) + 1.25rem + var(--space-3)); }

.list > li { position: relative; }
.list > li + li::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  left: var(--separator-inset, var(--list-inset));
  border-top: var(--hairline) solid var(--color-separator);
}

.list-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--row-height);
  padding: var(--space-2) var(--list-inset);
  color: var(--color-label);
  text-decoration: none;
}
.list-icon { color: var(--color-tint); }
.list-title { flex: 1; min-width: 0; }
.list-value { color: var(--color-secondary-label); }
.list-chevron { color: var(--color-tertiary-label); }

a.list-row { transition: background-color var(--duration-instant) var(--ease-out); }
@media (hover: hover) {
  a.list-row:hover { background: var(--color-quaternary-system-fill); text-decoration: none; }
}
a.list-row:active { background: var(--color-tertiary-system-fill); }
```

**Aturan**:

1. Garis pemisah dimulai sejajar teks, bukan dari tepi kotak (inset), sama seperti Apple.
2. Chevron hanya kalau baris membuka halaman atau panel lain.
3. Nilai di kanan memakai `secondary-label`.
4. Kalau list lebih dari sekitar 15 baris, pertimbangkan tabel atau pencarian.

### 12.10 Tabel

**Kegunaan**: data berkolom yang perlu dibandingkan, misalnya daftar sistem dengan nomor, nama, fungsi, dan jumlah koneksi.

```html
<div class="table-wrap">
  <table class="table">
    <caption class="visually-hidden">Daftar sistem bagian Matchmaking dan Ranked</caption>
    <thead>
      <tr>
        <th scope="col" class="num">No</th>
        <th scope="col">Sistem</th>
        <th scope="col">Fungsi</th>
        <th scope="col" class="num">Koneksi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="num">41</td>
        <td>Matchmaking Service</td>
        <td class="text-secondary">Mencari lawan dengan kemampuan setara</td>
        <td class="num">7</td>
      </tr>
    </tbody>
  </table>
</div>
```

Angka di contoh hanya ilustrasi.

```css
/* assets/css/components/table.css */
.table-wrap {
  max-height: 70dvh;
  overflow: auto;
  border-radius: var(--radius-lg);
  background: var(--color-secondary-system-background);
}

.table {
  width: 100%;
  font-size: var(--text-subheadline-size);
  line-height: var(--text-subheadline-line);
}

.table th {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  padding: var(--space-2) var(--space-3);
  background: var(--color-secondary-system-background);
  border-bottom: var(--hairline) solid var(--color-separator);
  text-align: start;
  font-size: var(--text-footnote-size);
  line-height: var(--text-footnote-line);
  font-weight: var(--weight-semibold);
  color: var(--color-secondary-label);
  white-space: nowrap;
}

.table td {
  height: var(--row-height-dense);
  padding: var(--space-2) var(--space-3);
  border-bottom: var(--hairline) solid var(--color-separator);
  vertical-align: middle;
}
.table tbody tr:last-child td { border-bottom: 0; }

.table .num { text-align: end; font-variant-numeric: tabular-nums; }

@media (hover: hover) {
  .table tbody tr:hover { background: var(--color-quaternary-system-fill); }
}
.table tbody tr[aria-selected="true"] { background: var(--color-tint-soft); }
```

**Aturan**:

1. Teks rata kiri, angka rata kanan dengan tabular figures.
2. Tidak ada garis vertikal dan tidak ada baris belang. Garis pemisah tipis sudah cukup.
3. Header tabel tetap terlihat saat di-scroll (sticky). Karena itu `.table-wrap` punya tinggi maksimum dan scroll sendiri.
4. Scroll di dalam tabel boleh. Aturan tanpa scroll hanya berlaku untuk sidebar.
5. Selalu ada `caption` (boleh disembunyikan visual) dan `scope="col"` di header.

### 12.11 Tabs

**Kegunaan**: berpindah antar bagian dalam satu halaman, misalnya tab per bagian di Maps (bisa 9 sampai 11 tab).

```html
<div class="tabs" role="tablist" aria-label="Bagian peta">
  <button class="tab" type="button" role="tab" id="tab-akun" aria-controls="panel-akun" aria-selected="true">
    Akun dan Sosial <span class="tab-count">38</span>
  </button>
  <button class="tab" type="button" role="tab" id="tab-match" aria-controls="panel-match" aria-selected="false" tabindex="-1">
    Matchmaking dan Ranked <span class="tab-count">41</span>
  </button>
</div>

<section class="tab-panel" role="tabpanel" id="panel-akun" aria-labelledby="tab-akun">...</section>
<section class="tab-panel" role="tabpanel" id="panel-match" aria-labelledby="tab-match" hidden>...</section>
```

Angka di contoh hanya ilustrasi.

```css
/* assets/css/components/tabs.css */
.tabs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  border-radius: var(--radius-full);
  background: var(--color-tertiary-system-fill);
}

.tab {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: calc(var(--control-height-md) - var(--space-2));
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-subheadline-size);
  line-height: var(--text-subheadline-line);
  font-weight: var(--weight-medium);
  color: var(--color-secondary-label);
  scroll-snap-align: start;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}
@media (hover: hover) {
  .tab:hover { color: var(--color-label); }
}
.tab[aria-selected="true"] {
  background: var(--color-elevated-tertiary-background);
  color: var(--color-label);
  box-shadow: var(--shadow-sm);
}
.tab-count {
  font-size: var(--text-caption-1-size);
  line-height: var(--text-caption-1-line);
  color: var(--color-secondary-label);
  font-variant-numeric: tabular-nums;
}
```

```js
// assets/js/tabs.js
export function initTabs(tablist) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];

  function select(tab, focus = true) {
    for (const t of tabs) {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    }
    tab.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (focus) tab.focus();
  }

  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab, false);
  });

  tablist.addEventListener("keydown", (event) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length]);
  });
}

document.querySelectorAll('[role="tablist"]').forEach((tablist) => initTabs(tablist));
```

**Aturan**:

1. Hanya tab terpilih yang bisa dicapai dengan Tab. Pindah antar tab pakai panah kiri dan kanan (pola roving tabindex).
2. Tab boleh scroll ke samping kalau tidak muat. Tab terpilih otomatis digeser ke area terlihat.
3. Angka di tab adalah jumlah sistem di bagian itu.

### 12.12 Badge dan chip

**Badge**: label kecil yang hanya menampilkan informasi (protokol, status). **Chip**: badge yang bisa diklik untuk filter.

```html
<span class="badge">REST</span>
<span class="badge" data-tone="tint">Sinkron</span>
<span class="badge" data-tone="success">
  <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#circle-check"></use></svg>
  Aktif
</span>

<button class="chip" type="button" aria-pressed="true">API sinkron</button>
<button class="chip" type="button" aria-pressed="false">Event</button>
```

```css
/* assets/css/components/badge.css */
.badge,
.chip {
  --badge-fg: var(--color-label);
  --badge-bg: var(--color-tertiary-system-fill);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0 var(--space-2);
  border-radius: var(--radius-full);
  background: var(--badge-bg);
  color: var(--badge-fg);
  font-size: var(--text-caption-1-size);
  line-height: var(--text-caption-1-line);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}
.badge { min-height: 1.375rem; }

.badge[data-tone="tint"]    { --badge-fg: var(--color-tint-text);    --badge-bg: var(--color-tint-soft); }
.badge[data-tone="success"] { --badge-fg: var(--color-success-text); --badge-bg: color-mix(in srgb, var(--color-success) 18%, transparent); }
.badge[data-tone="warning"] { --badge-fg: var(--color-warning-text); --badge-bg: color-mix(in srgb, var(--color-warning) 18%, transparent); }
.badge[data-tone="error"]   { --badge-fg: var(--color-error-text);   --badge-bg: color-mix(in srgb, var(--color-error) 18%, transparent); }

.chip {
  min-height: var(--control-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--text-footnote-size);
  line-height: var(--text-footnote-line);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.chip[aria-pressed="true"] { --badge-fg: var(--color-tint-text); --badge-bg: var(--color-tint-soft); }
@media (hover: hover) {
  .chip:hover { --badge-fg: var(--color-label); }
  .chip[aria-pressed="true"]:hover { --badge-fg: var(--color-tint-text); }
}
```

**Aturan**:

1. Badge berwarna selalu disertai ikon atau kata yang jelas.
2. Badge berwarna hanya di latar #000000 dan #1C1C1E (aturan warna 4.7 nomor 7). Hasil hitung di #1C1C1E: tint 4.70, success 5.90, warning 5.81, error 4.91. Di #2C2C2E, tint dan error gagal, jadi pakai badge netral.
3. Badge netral memakai teks `label`, bukan `secondary-label`, karena `secondary-label` di atas fill pada latar #2C2C2E hanya sekitar 4.4.
4. Chip filter memakai `aria-pressed` supaya pembaca layar tahu statusnya.

### 12.13 Sidebar

**Kegunaan**: navigasi utama ke Systems dan Maps. Aturan lengkap ada di `prompt-hub.md` bagian 7. Ringkasnya: dua section accordion, hanya satu terbuka, tidak boleh scroll.

**Data menu**, satu-satunya file yang diubah saat menambah halaman:

```js
// assets/js/nav-config.js
export const APP_NAME = "Hub";

export const NAV = [
  {
    id: "systems",
    label: "Systems",
    items: [
      { label: "Finance", href: "/systems/finance/", icon: "landmark" },
      { label: "Finance Self", href: "/systems/finance-self/", icon: "piggy-bank" },
      { label: "Health", href: "/systems/health/", icon: "heart-pulse" },
      { label: "Logistics", href: "/systems/logistics/", icon: "truck" },
      { label: "Game", href: "/systems/game/", icon: "gamepad-2" },
      { label: "Retail dan Manufaktur", href: "/systems/retail-manufaktur/", icon: "factory" },
      { label: "Energi", href: "/systems/energi/", icon: "zap" },
    ],
  },
  {
    id: "maps",
    label: "Maps",
    items: [
      { label: "Finance", href: "/maps/finance", icon: "landmark" },
      { label: "Health", href: "/maps/health", icon: "heart-pulse" },
      { label: "Retail dan Manufaktur", href: "/maps/retail-manufaktur", icon: "factory" },
      { label: "Energi", href: "/maps/energi", icon: "zap" },
      { label: "Game", href: "/maps/game", icon: "gamepad-2" },
      { label: "Game Story", href: "/maps/game-story", icon: "book-open" },
    ],
  },
];
```

**Pembuat elemen**, dipakai bersama sidebar, toast, dan renderer Maps:

```js
// assets/js/dom.js
const SPRITE = "/assets/icons/sprite.svg";
const SVG_NS = "http://www.w3.org/2000/svg";

export function icon(name, extraClass = "") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", `icon icon-md ${extraClass}`.trim());
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `${SPRITE}#${name}`);
  svg.append(use);
  return svg;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children); // string jadi teks biasa, aman dari XSS
  return node;
}
```

**Pembuat sidebar**:

```js
// assets/js/sidebar.js
import { el, icon } from "./dom.js";
import { APP_NAME, NAV } from "./nav-config.js";

const normalize = (path) => path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";

function renderSidebar(sidebar) {
  const current = normalize(location.pathname);
  const sections = NAV.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item, active: normalize(item.href) === current })),
  }));
  const anyActive = sections.some((s) => s.items.some((i) => i.active));

  const header = el("div", { class: "sidebar-header" },
    el("a", { class: "sidebar-title", href: "/" }, APP_NAME));

  const nav = el("nav", { class: "sidebar-nav", "aria-label": "Navigasi utama" },
    ...sections.map((section, index) => {
      // Section halaman aktif terbuka. Di beranda, section pertama terbuka.
      const open = section.items.some((i) => i.active) || (!anyActive && index === 0);
      return el("details", { class: "nav-section", name: "nav", open },
        el("summary", {}, el("span", {}, section.label), icon("chevron-right", "nav-chevron")),
        el("ul", { class: "nav-list", role: "list" },
          ...section.items.map((item) =>
            el("li", {},
              el("a", {
                class: "nav-item",
                href: item.href,
                title: item.label,
                "aria-current": item.active ? "page" : null,
              }, icon(item.icon), el("span", { class: "nav-label" }, item.label))))));
    }));

  const footer = el("form", { class: "sidebar-footer", method: "post", action: "/api/logout" },
    el("button", { class: "nav-item", type: "submit" }, icon("log-out"), el("span", { class: "nav-label" }, "Keluar")));

  sidebar.replaceChildren(header, nav, footer);
}

// Penjaga aturan tanpa scroll: memberi peringatan di console saat isi melebihi tinggi layar
function guardNoScroll(sidebar) {
  let timer;
  const check = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (sidebar.scrollHeight > sidebar.clientHeight + 1) {
        console.warn("[sidebar] Isi melebihi tinggi layar. Pecah section yang terlalu panjang (aturan tanpa scroll).");
      }
    }, 600); // tunggu animasi accordion selesai
  };
  new ResizeObserver(check).observe(sidebar);
  sidebar.addEventListener("toggle", check, true);
}

// Layar kecil: sidebar jadi laci yang dibuka dari tombol menu di toolbar
function setupDrawer(app, sidebar) {
  const main = document.getElementById("main");
  const toggles = [...document.querySelectorAll('[data-action="toggle-nav"]')];
  const isOpen = () => app.dataset.nav === "open";

  const setOpen = (open) => {
    app.dataset.nav = open ? "open" : "closed";
    if (main) main.inert = open;
    toggles.forEach((button) => button.setAttribute("aria-expanded", String(open)));
    if (open) sidebar.querySelector(".nav-item")?.focus();
  };

  toggles.forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!isOpen());
  }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggles[0]?.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (isOpen() && !sidebar.contains(event.target)) setOpen(false);
  });

  matchMedia("(width >= 48rem)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

const sidebar = document.getElementById("sidebar");
const app = document.querySelector(".app");
if (sidebar && app) {
  renderSidebar(sidebar);
  guardNoScroll(sidebar);
  setupDrawer(app, sidebar);
}
```

**Gaya**:

```css
/* assets/css/components/sidebar.css */
.sidebar {
  --radius-outer: var(--radius-xl);
  --pad: var(--space-2);
  position: sticky;
  top: var(--space-2);
  z-index: var(--z-sidebar);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: calc(100dvh - var(--space-4));
  margin: var(--space-2) 0 var(--space-2) var(--space-2);
  padding: var(--pad);
  border-radius: var(--radius-outer);
  overflow-y: auto;            /* jaring pengaman saja, desain tidak boleh sampai scroll */
  overscroll-behavior: contain;
}

.sidebar-header {
  display: flex;
  align-items: center;
  min-height: 3rem;
  padding: 0 var(--space-3);
}
.sidebar-title {
  font-size: var(--text-headline-size);
  line-height: var(--text-headline-line);
  font-weight: var(--text-headline-weight);
  color: var(--color-label);
  text-decoration: none;
}

.nav-section > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--nav-section-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  list-style: none;
  font-size: var(--text-footnote-size);
  line-height: var(--text-footnote-line);
  font-weight: var(--weight-semibold);
  color: var(--color-secondary-label);
  cursor: pointer;
}
.nav-section > summary::-webkit-details-marker { display: none; }
@media (hover: hover) {
  .nav-section > summary:hover { color: var(--color-label); }
}

.nav-chevron { transition: rotate var(--spring-snappy-duration-sm) var(--spring-snappy); }
.nav-section[open] .nav-chevron { rotate: 90deg; }

.nav-list {
  display: grid;
  gap: var(--space-0-5);
  padding-top: var(--space-1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--nav-item-height);
  padding: 0 var(--space-3);
  border-radius: max(var(--radius-xs), calc(var(--radius-outer) - var(--pad)));
  color: var(--color-label);
  text-decoration: none;
  font-size: var(--text-callout-size);
  line-height: var(--text-callout-line);
  transition: background-color var(--duration-instant) var(--ease-out);
}
.nav-item .icon { color: var(--color-tint); }
.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: start;
}
@media (hover: hover) {
  .nav-item:hover { background: var(--color-quaternary-system-fill); text-decoration: none; }
}
.nav-item[aria-current="page"] {
  background: var(--color-secondary-system-fill);
  font-weight: var(--weight-semibold);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: var(--hairline) solid var(--color-separator);
}

/* Animasi buka tutup accordion. Saat ini hanya jalan di Chrome dan Edge.
   Browser lain langsung buka tanpa animasi, tetap berfungsi normal. */
@supports (interpolate-size: allow-keywords) {
  .sidebar { interpolate-size: allow-keywords; }
  .nav-section::details-content {
    height: 0;
    overflow: clip;
    transition:
      height var(--spring-smooth-duration-sm) var(--spring-smooth),
      content-visibility var(--spring-smooth-duration-sm) allow-discrete;
  }
  .nav-section[open]::details-content { height: auto; }
}

/* Layar kecil: laci dari kiri */
@media (width < 48rem) {
  .sidebar {
    position: fixed;
    inset: var(--space-2) auto var(--space-2) var(--space-2);
    width: min(var(--sidebar-width), calc(100vw - var(--space-8)));
    height: auto;
    margin: 0;
    visibility: hidden;
    translate: calc(-100% - var(--space-4)) 0;
    transition:
      translate var(--spring-smooth-duration) var(--spring-smooth),
      visibility 0s linear var(--spring-smooth-duration);
  }
  .app[data-nav="open"] .sidebar {
    visibility: visible;
    translate: 0 0;
    transition: translate var(--spring-smooth-duration) var(--spring-smooth);
  }
  .app[data-nav="open"]::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-sidebar) - 1);
    background: var(--color-scrim);
  }
}
```

**Aturan**:

1. Tambah halaman cukup edit `nav-config.js`. Jangan menulis HTML sidebar di halaman.
2. Label maksimal sekitar 20 karakter. Label lebih panjang dipotong dengan elipsis dan isi lengkapnya muncul sebagai tooltip (`title`).
3. Maksimal sekitar 10 item per section (hitungan di 6.7). Lebih dari itu, pecah section.
4. Ikon item sesuai domain, sama antara Systems dan Maps supaya mudah dikenali.
5. Keluar memakai form `POST`, bukan link, supaya tidak bisa dipicu dari halaman lain.

### 12.14 Toolbar

**Kegunaan**: judul halaman dan aksi utama halaman. Melayang di atas konten yang di-scroll.

```html
<header class="toolbar material material-thick">
  <button class="icon-btn nav-toggle" type="button" data-action="toggle-nav"
          aria-label="Buka navigasi" aria-expanded="false" aria-controls="sidebar">
    <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#panel-left"></use></svg>
  </button>
  <div class="toolbar-title">
    <h1 class="text-title-3 strong">Peta Game</h1>
    <p class="text-footnote text-secondary">357 sistem dalam 9 bagian</p>
  </div>
  <div class="toolbar-actions">
    <!-- search, tombol filter, dan seterusnya -->
  </div>
</header>
```

```css
/* assets/css/components/toolbar.css */
.toolbar {
  position: sticky;
  top: var(--space-2);
  z-index: var(--z-toolbar);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--toolbar-height);
  margin: var(--space-2) var(--space-2) 0;
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
}
.toolbar-title { flex: 1; min-width: 0; }
.toolbar-title > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-toggle { display: none; }
@media (width < 48rem) {
  .nav-toggle { display: inline-grid; }
  .toolbar { padding-left: var(--space-2); }
}
```

**Aturan**: maksimal tiga aksi terlihat di toolbar. Aksi lain masuk menu (13.3).

---

## 13. Komponen overlay dan umpan balik

### 13.1 Dialog dan sheet

**Kegunaan**: tugas singkat yang memotong alur (filter lanjutan, pengaturan, konfirmasi). Di layar kecil otomatis jadi sheet dari bawah.

```html
<button class="btn btn-gray" type="button" data-open-dialog="dlg-filter">Filter</button>

<dialog class="dialog" id="dlg-filter" aria-labelledby="dlg-filter-title">
  <form method="dialog" class="dialog-body">
    <header class="dialog-header">
      <h2 class="text-title-3 strong" id="dlg-filter-title">Filter koneksi</h2>
      <button class="icon-btn" value="cancel" aria-label="Tutup">
        <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#x"></use></svg>
      </button>
    </header>
    <div class="dialog-content">
      <!-- isi -->
    </div>
    <footer class="dialog-footer">
      <button class="btn btn-gray" value="cancel">Batal</button>
      <button class="btn btn-filled" value="apply">Terapkan</button>
    </footer>
  </form>
</dialog>
```

- `<form method="dialog">` membuat tombol di dalamnya otomatis menutup dialog, dan nilai `value` tombol yang ditekan tersimpan di `dialog.returnValue`.
- Esc menutup dialog dan fokus kembali ke tombol pembuka. Semua itu bawaan browser.

```css
/* assets/css/components/dialog.css */
.dialog {
  --radius-outer: var(--radius-xl);
  --pad: var(--space-6);
  width: min(32rem, calc(100vw - var(--space-8)));
  max-height: calc(100dvh - var(--space-8));
  margin: auto;
  padding: 0;
  border: var(--hairline) solid var(--color-opaque-separator);
  border-radius: var(--radius-outer);
  background: var(--color-elevated-background);
  color: var(--color-label);
  box-shadow: var(--shadow-sheet);
  opacity: 1;
  scale: 1;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    scale var(--spring-smooth-duration-sm) var(--spring-smooth),
    display var(--duration-fast) allow-discrete,
    overlay var(--duration-fast) allow-discrete;
}
.dialog:not([open]) { opacity: 0; scale: 0.96; }
@starting-style {
  .dialog[open] { opacity: 0; scale: 0.96; }
}

.dialog::backdrop {
  background: var(--color-scrim);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}
.dialog-header,
.dialog-footer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--pad);
}
.dialog-header { justify-content: space-between; padding-bottom: var(--space-3); }
.dialog-footer { justify-content: flex-end; padding-top: var(--space-3); }
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--pad);
}

/* Layar kecil: sheet dari bawah */
@media (width < 48rem) {
  .dialog {
    width: 100%;
    max-width: none;
    margin: auto 0 0;
    border-radius: var(--radius-outer) var(--radius-outer) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
    translate: 0 0;
    transition:
      translate var(--spring-smooth-duration) var(--spring-smooth),
      display var(--spring-smooth-duration-sm) allow-discrete,
      overlay var(--spring-smooth-duration-sm) allow-discrete;
  }
  .dialog:not([open]) { translate: 0 100%; }
  @starting-style {
    .dialog[open] { translate: 0 100%; }
  }
  .dialog-footer > .btn { flex: 1; }
}
```

Animasi keluar memakai `display` dan `overlay` dengan `allow-discrete`. Di browser yang belum mendukung `overlay` (Safari), dialog hilang tanpa animasi keluar. Itu tidak masalah.

```js
// assets/js/dialog.js
document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-open-dialog]");
  if (opener) {
    document.getElementById(opener.dataset.openDialog)?.showModal();
    return;
  }

  // Klik di area gelap di luar kotak dialog menutup dialog
  const dialog = event.target;
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right
      && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close("cancel");
  }
});
```

**Aturan**:

1. Satu dialog satu tugas. Kalau isinya panjang dan butuh banyak langkah, buat halaman.
2. Judul dialog menjelaskan tugasnya ("Filter koneksi"), bukan "Info".
3. Tombol utama di kanan, batal di kiri, seperti macOS.
4. Jangan membuka dialog dari dalam dialog.

### 13.2 Alert (konfirmasi)

**Kegunaan**: konfirmasi aksi yang tidak bisa dibatalkan.

```html
<dialog class="dialog dialog-alert" id="dlg-reset" role="alertdialog"
        aria-labelledby="reset-title" aria-describedby="reset-desc">
  <form method="dialog" class="dialog-body">
    <div class="dialog-alert-text">
      <h2 class="text-headline" id="reset-title">Reset tampilan peta?</h2>
      <p class="text-subheadline text-secondary" id="reset-desc">Filter, pilihan tab, dan posisi peta kembali ke awal.</p>
    </div>
    <footer class="dialog-footer">
      <button class="btn btn-gray" value="cancel" autofocus>Batal</button>
      <button class="btn btn-destructive" value="confirm">Reset</button>
    </footer>
  </form>
</dialog>
```

```css
/* assets/css/components/dialog.css, lanjutan */
.dialog-alert { width: min(20rem, calc(100vw - var(--space-8))); }
.dialog-alert-text {
  display: grid;
  gap: var(--space-2);
  padding: var(--pad) var(--pad) 0;
  text-align: center;
}
.dialog-alert .dialog-footer > .btn { flex: 1; }
```

```js
const dialog = document.getElementById("dlg-reset");
dialog.addEventListener("close", () => {
  if (dialog.returnValue === "confirm") {
    // jalankan reset
  }
});
```

**Aturan**: fokus awal di tombol yang aman (`autofocus` di Batal). Judul berupa pertanyaan yang menyebut aksinya. Label tombol destructive mengulang kata kerjanya ("Reset", "Hapus"), bukan "Ya".

### 13.3 Popover dan menu

**Kegunaan**: daftar aksi tambahan atau isian kecil yang muncul di dekat tombol pemicunya.

```html
<button class="icon-btn" type="button" popovertarget="menu-peta" aria-label="Aksi lain">
  <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#ellipsis"></use></svg>
</button>

<div class="menu material material-regular" id="menu-peta" popover>
  <button class="menu-item" type="button">Salin tautan</button>
  <button class="menu-item" type="button">Tampilkan legenda</button>
  <hr class="menu-separator">
  <button class="menu-item menu-item-destructive" type="button" data-open-dialog="dlg-reset">Reset tampilan</button>
</div>
```

- Atribut `popover` membuat elemen otomatis tertutup saat klik di luar atau tekan Esc, dan masuk top layer.
- Tambahkan ikon `ellipsis` ke sprite.

Posisi menu dihitung dengan JS kecil karena fitur CSS anchor positioning belum merata di semua browser:

```js
// assets/js/popover.js
document.addEventListener("beforetoggle", (event) => {
  const pop = event.target;
  if (!(pop instanceof HTMLElement) || !pop.matches("[popover]") || event.newState !== "open") return;
  const trigger = document.querySelector(`[popovertarget="${pop.id}"]`);
  if (!trigger) return;
  const r = trigger.getBoundingClientRect();
  const minWidth = 200; // sama dengan min-width menu (12rem) plus jarak
  pop.style.setProperty("--pop-top", `${r.bottom + 8}px`);
  pop.style.setProperty("--pop-left", `${Math.max(r.right, minWidth)}px`);
}, true);
```

```css
/* assets/css/components/popover.css */
.menu {
  --radius-outer: var(--radius-lg);
  --pad: var(--space-1);
  position: fixed;
  inset: auto;
  top: var(--pop-top, 50%);
  left: var(--pop-left, 50%);
  translate: -100% 0;           /* tepi kanan menu sejajar tepi kanan tombol */
  transform-origin: top right;
  min-width: 12rem;
  margin: 0;
  padding: var(--pad);
  border-radius: var(--radius-outer);
  color: var(--color-label);
  box-shadow: var(--shadow-popover), inset 0 1px 0 var(--material-highlight);
  opacity: 1;
  scale: 1;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    scale var(--spring-snappy-duration-sm) var(--spring-snappy),
    display var(--duration-fast) allow-discrete,
    overlay var(--duration-fast) allow-discrete;
}
.menu:not(:popover-open) { opacity: 0; scale: 0.95; }
@starting-style {
  .menu:popover-open { opacity: 0; scale: 0.95; }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--control-height-md);
  padding: 0 var(--space-3);
  border-radius: max(var(--radius-xs), calc(var(--radius-outer) - var(--pad)));
  text-align: start;
  font-size: var(--text-callout-size);
  line-height: var(--text-callout-line);
}
/* Sorotan item seperti menu macOS: latar aksen, teks putih */
.menu-item:focus-visible { outline: none; }
.menu-item:focus-visible,
.menu-item:hover {
  background: var(--color-tint-fill);
  color: var(--color-on-tint-fill);
}
.menu-item-destructive { color: var(--color-error-text); }
.menu-separator {
  margin: var(--space-1) var(--space-3);
  border: 0;
  border-top: var(--hairline) solid var(--color-separator);
}
```

**Aturan**:

1. Menu berisi aksi, bukan navigasi utama.
2. Item destructive di paling bawah, dipisah garis.
3. Isi menu teks utama saja, karena material regular hanya aman untuk `label` (8.3).
4. Item dipindah dengan Tab. Kalau nanti butuh navigasi panah seperti menu sistem, tambahkan pola `role="menu"` lengkap.

### 13.4 Toast

**Kegunaan**: konfirmasi singkat yang tidak butuh tindakan ("Tautan disalin").

Toast memakai `el` dan `icon` dari `dom.js` (12.13).

```html
<!-- sekali di setiap halaman, sebelum </body> -->
<div class="toast-region" aria-live="polite"></div>
```

```js
// assets/js/toast.js
import { el, icon } from "./dom.js";

const IKON = { info: "info", success: "circle-check", warning: "triangle-alert", error: "circle-x" };

export function toast(pesan, { tone = "info", durasi = 4000 } = {}) {
  const region = document.querySelector(".toast-region");
  if (!region) return;
  const item = el("div", { class: "toast material material-thick", "data-tone": tone },
    icon(IKON[tone] ?? "info"), el("span", {}, pesan));
  region.append(item);

  setTimeout(() => {
    item.classList.add("is-leaving");
    const hapus = () => item.remove();
    item.addEventListener("transitionend", hapus, { once: true });
    setTimeout(hapus, 600); // cadangan kalau transisi tidak jalan
  }, durasi);
}

// Pemakaian: toast("Tautan disalin", { tone: "success" });
```

```css
/* assets/css/components/toast.css */
.toast-region {
  position: fixed;
  right: var(--space-4);
  bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  z-index: calc(var(--z-toolbar) + 1);
  display: grid;
  justify-items: end;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: min(24rem, calc(100vw - var(--space-8)));
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-callout-size);
  line-height: var(--text-callout-line);
  box-shadow: var(--shadow-popover), inset 0 1px 0 var(--material-highlight);
  pointer-events: auto;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    translate var(--spring-smooth-duration-sm) var(--spring-smooth);
}
@starting-style {
  .toast { opacity: 0; translate: 0 1rem; }
}
.toast.is-leaving { opacity: 0; translate: 0 0.5rem; }

.toast[data-tone="info"] .icon    { color: var(--color-info); }
.toast[data-tone="success"] .icon { color: var(--color-success); }
.toast[data-tone="warning"] .icon { color: var(--color-warning); }
.toast[data-tone="error"] .icon   { color: var(--color-error); }
```

**Aturan**:

1. Toast tidak boleh berisi tombol atau tautan. Isinya hilang sendiri, jadi aksi di dalamnya sulit dijangkau keyboard dan pembaca layar.
2. Error yang butuh tindakan tidak boleh lewat toast. Pakai pesan error di tempat kejadian atau alert.
3. Maksimal satu kalimat pendek. Maksimal dua toast tampil bersamaan.

### 13.5 Loading dan progress

```html
<!-- Spinner dengan teks -->
<div class="loading" role="status">
  <span class="spinner" aria-hidden="true"></span>
  <span>Memuat peta</span>
</div>

<!-- Progress yang diketahui persentasenya -->
<label class="text-footnote text-secondary" for="impor">Mengimpor data</label>
<progress class="progress" id="impor" max="100" value="40">40%</progress>
```

```css
/* assets/css/components/progress.css */
@keyframes spin { to { rotate: 1turn; } }

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8);
  color: var(--color-secondary-label);
  font-size: var(--text-subheadline-size);
  line-height: var(--text-subheadline-line);
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  flex: none;
  border-radius: 50%;
  border: 2px solid var(--color-tertiary-label);
  border-top-color: var(--color-label);
  animation: spin 0.8s linear infinite;
}
/* Spinner tetap berputar saat Reduce Motion, tapi pelan, karena ia penanda status */
@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 2.4s; }
}

.progress {
  appearance: none;
  width: 100%;
  height: 0.25rem;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-tertiary-system-fill);
  overflow: hidden;
}
.progress::-webkit-progress-bar { background: var(--color-tertiary-system-fill); }
.progress::-webkit-progress-value { background: var(--color-tint); border-radius: var(--radius-full); }
.progress::-moz-progress-bar { background: var(--color-tint); border-radius: var(--radius-full); }
```

**Aturan**:

1. Tampilkan loading hanya kalau proses lebih dari sekitar 400ms. Di bawah itu, kedipan spinner justru terasa lebih lambat.
2. Selalu ada teks yang menjelaskan apa yang dimuat.
3. Kalau persentase diketahui, pakai progress bar, bukan spinner.

```js
// Tunda loading 400ms
export async function denganLoading(wadah, kerja) {
  const timer = setTimeout(() => wadah.setAttribute("aria-busy", "true"), 400);
  try { return await kerja(); }
  finally { clearTimeout(timer); wadah.removeAttribute("aria-busy"); }
}
```

```css
/* Tampilkan .loading hanya saat wadahnya sibuk */
:not([aria-busy="true"]) > .loading { display: none; }
```

### 13.6 Empty state

**Kegunaan**: halaman atau bagian yang belum berisi, hasil pencarian kosong, atau gagal memuat.

```html
<div class="empty">
  <svg class="icon icon-xl" aria-hidden="true"><use href="/assets/icons/sprite.svg#landmark"></use></svg>
  <h2 class="text-title-3 strong">Belum ada isi</h2>
  <p class="text-subheadline text-secondary">Halaman Finance di Systems belum dibuat. Petanya sudah bisa dibuka.</p>
  <a class="btn btn-tinted" href="/maps/finance">Buka peta Finance</a>
</div>
```

```css
/* assets/css/components/empty.css */
.empty {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  max-width: var(--readable-width);
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
  text-align: center;
}
.empty > .icon { color: var(--color-secondary-label); margin-bottom: var(--space-2); }
.empty > .btn { margin-top: var(--space-3); }
```

| Situasi | Ikon | Judul | Isi | Aksi |
|---|---|---|---|---|
| Belum dibuat | ikon domain | Belum ada isi | Jelaskan kenapa dan apa yang bisa dilakukan | Tautan ke halaman terkait |
| Pencarian kosong | `search` | Tidak ada hasil | Sebut kata yang dicari, sarankan kata lain | Hapus pencarian |
| Gagal memuat | `triangle-alert` | Peta gagal dimuat | Jelaskan singkat, tanpa kode teknis | Coba lagi |

### 13.7 Tooltip

Apple memakai help tag kecil saat kursor diam di atas kontrol. Di hub, cukup atribut `title` sebagai pelengkap.

- `title` hanya muncul dengan mouse, tidak dengan keyboard atau layar sentuh. Jadi informasi penting tidak boleh hanya ada di `title`.
- Tombol ikon tetap wajib `aria-label`. `title` boleh berisi teks yang sama.
- Tidak membuat komponen tooltip sendiri untuk saat ini.

---

## 14. Komponen khusus Maps

Komponen ini menerjemahkan fitur template "Peta Integrasi Sistem Keuangan" ke design system ini.

### 14.1 Kotak sistem (tile)

**Kegunaan**: satu sistem di peta. Bisa diklik untuk melihat koneksinya.

```html
<div class="map-canvas">
  <button class="tile" type="button" aria-pressed="false" data-system="41">
    <span class="tile-head">
      <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#gamepad-2"></use></svg>
      <span class="tile-number num">41</span>
    </span>
    <span class="tile-name">Matchmaking Service</span>
  </button>

  <button class="tile" type="button" aria-pressed="false" data-system="120" data-external>
    <span class="tile-head">
      <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#gamepad-2"></use></svg>
      <span class="tile-number num">120</span>
    </span>
    <span class="tile-name">Payment Provider</span>
  </button>
</div>
```

Nomor di contoh hanya ilustrasi.

```css
/* assets/css/components/tile.css */
.map-canvas { position: relative; }

.tile {
  display: grid;
  align-content: start;
  gap: var(--space-1);
  min-height: 4.5rem;
  padding: var(--space-3);
  border: 1px solid var(--color-opaque-separator);
  border-radius: var(--radius-md);
  background: var(--color-secondary-system-background);
  color: var(--color-label);
  text-align: start;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    scale var(--spring-snappy-duration-sm) var(--spring-snappy);
}
.tile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-secondary-label);
}
.tile-head .icon { color: var(--color-tint); }
.tile-number {
  font-size: var(--text-caption-1-size);
  line-height: var(--text-caption-1-line);
}
.tile-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: var(--text-subheadline-size);
  line-height: var(--text-subheadline-line);
  font-weight: var(--weight-semibold);
}

@media (hover: hover) {
  .tile:hover { border-color: var(--color-control-border); }
}
.tile:active { scale: 0.98; }

/* Pihak luar: garis putus-putus, tanpa latar */
.tile[data-external] {
  border-style: dashed;
  border-color: var(--color-control-border);
  background: transparent;
}

/* Terpilih: garis aksen 2px tanpa menggeser layout */
.tile[aria-pressed="true"] {
  border-color: var(--color-tint);
  box-shadow: inset 0 0 0 1px var(--color-tint);
  background: var(--color-tint-soft);
}

/* Sistem yang terhubung dengan sistem terpilih */
.tile[data-related] { border-color: var(--color-tint); }

/* Saat ada yang terpilih, sistem lain diredupkan lewat latar, garis, dan warna,
   bukan opacity. Dengan opacity, nomor sistem (secondary-label) turun ke sekitar 2.2:1.
   Dengan cara ini teks tetap di atas 6:1. */
.map-canvas:has(.tile[aria-pressed="true"]) .tile:not([aria-pressed="true"], [data-related]) {
  background: transparent;
  border-color: var(--color-separator);
  color: var(--color-secondary-label);
}
.map-canvas:has(.tile[aria-pressed="true"]) .tile:not([aria-pressed="true"], [data-related]) .icon {
  color: var(--color-tertiary-label);
}
```

**Aturan**:

1. Kotak adalah `button` dengan `aria-pressed`, jadi bisa dipilih dengan keyboard dan statusnya terbaca pembaca layar.
2. Nomor sistem selalu terlihat. Nama maksimal dua baris.
3. Pihak luar dibedakan dengan garis putus-putus, bukan hanya warna.
4. Jangan meredupkan dengan `opacity`, karena teks ikut turun kontrasnya. Ubah latar, garis, dan warna seperti kode di atas.

### 14.2 Garis koneksi dan legenda

Jenis integrasi dibedakan dengan warna dan pola garis sekaligus, supaya tetap terbaca tanpa melihat warna. Nama jenis di bawah adalah contoh; sesuaikan dengan isi kolom `jenis_integrasi` di database.

| Jenis (contoh) | Warna | Pola | `stroke-dasharray` |
|---|---|---|---|
| API sinkron | `--color-cat-1` (biru) | Garis penuh | tidak ada |
| Event atau pesan | `--color-cat-2` (hijau) | Putus panjang | `8 4` |
| Batch atau file | `--color-cat-3` (oranye) | Titik | `2 4` |
| Streaming | `--color-cat-4` (ungu) | Putus titik | `8 4 2 4` |
| Lainnya | `--color-cat-5` (teal) | Putus pendek | `4 4` |

```html
<div class="map-canvas">
  <svg class="map-lines" aria-hidden="true">
    <path class="link" data-kind="sync" d="M 120 40 C 200 40, 200 160, 280 160"></path>
  </svg>
  <!-- kotak sistem -->
</div>

<ul class="legend" role="list">
  <li><svg class="legend-swatch" aria-hidden="true"><line class="link" data-kind="sync" x1="2" y1="6" x2="26" y2="6"></line></svg>API sinkron</li>
  <li><svg class="legend-swatch" aria-hidden="true"><line class="link" data-kind="event" x1="2" y1="6" x2="26" y2="6"></line></svg>Event atau pesan</li>
  <li><span class="legend-external" aria-hidden="true"></span>Pihak luar</li>
</ul>
```

```css
/* assets/css/pages/maps.css */
.map-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.link {
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: 0.8;
  transition: opacity var(--duration-fast) var(--ease-out), stroke-width var(--duration-fast) var(--ease-out);
}
.link[data-kind="sync"]   { stroke: var(--color-cat-1); }
.link[data-kind="event"]  { stroke: var(--color-cat-2); stroke-dasharray: 8 4; }
.link[data-kind="batch"]  { stroke: var(--color-cat-3); stroke-dasharray: 2 4; }
.link[data-kind="stream"] { stroke: var(--color-cat-4); stroke-dasharray: 8 4 2 4; }
.link[data-kind="other"]  { stroke: var(--color-cat-5); stroke-dasharray: 4 4; }

.map-canvas:has(.tile[aria-pressed="true"]) .link:not([data-related]) { opacity: 0.12; }
.link[data-related] { stroke-width: 2.5; opacity: 1; }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  font-size: var(--text-footnote-size);
  line-height: var(--text-footnote-line);
  color: var(--color-secondary-label);
}
.legend li { display: flex; align-items: center; gap: var(--space-2); }
.legend-swatch { width: 1.75rem; height: 0.75rem; }
.legend-external {
  width: 1.25rem;
  height: 0.875rem;
  border: 1px dashed var(--color-control-border);
  border-radius: var(--radius-xs);
}
```

**Aturan**: garis bersifat dekoratif (`aria-hidden`). Informasi koneksi yang sama wajib tersedia sebagai teks di inspector (14.3), supaya bisa dibaca pembaca layar dan disalin.

### 14.3 Inspector (panel detail sistem)

**Kegunaan**: detail sistem terpilih: fungsi, daftar "Mengirim ke" dan "Menerima dari" lengkap dengan jenis integrasi dan protokol.

Di layar wide, inspector jadi kolom ketiga. Di layar regular, melayang dari kanan. Di layar compact, jadi sheet dari bawah. Isinya bisa di-scroll, jadi memakai latar padat (elevated), bukan material.

```html
<!-- anak ketiga dari .app -->
<aside class="inspector" id="inspector" aria-labelledby="inspector-title" hidden>
  <header class="inspector-header">
    <div>
      <p class="text-footnote text-secondary num">Sistem 41</p>
      <h2 class="text-title-3 strong" id="inspector-title" tabindex="-1">Matchmaking Service</h2>
    </div>
    <button class="icon-btn" type="button" data-action="close-inspector" aria-label="Tutup detail">
      <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#x"></use></svg>
    </button>
  </header>

  <p class="text-subheadline text-secondary">Mencari lawan dengan kemampuan setara.</p>

  <section class="list-section">
    <h3 class="list-header">Mengirim ke</h3>
    <ul class="list" role="list">
      <li>
        <a class="list-row" href="#s-52">
          <span class="list-title"><span class="num text-secondary">52</span> Game Session Server</span>
          <span class="badge">
            <svg class="badge-line" aria-hidden="true"><line class="link" data-kind="sync" x1="1" y1="5" x2="15" y2="5"></line></svg>
            API sinkron
          </span>
          <span class="badge">gRPC</span>
        </a>
      </li>
    </ul>
  </section>

  <section class="list-section">
    <h3 class="list-header">Menerima dari</h3>
    <!-- list sejenis -->
  </section>
</aside>
```

```css
/* assets/css/components/inspector.css */
.inspector {
  display: grid;
  align-content: start;
  gap: var(--space-5);
  padding: var(--space-5);
  border: var(--hairline) solid var(--color-opaque-separator);
  border-radius: var(--radius-xl);
  background: var(--color-elevated-background);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.inspector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.inspector-header h2:focus { outline: none; }

/* List di dalam panel elevated memakai latar elevated kedua (#2C2C2E) supaya terpisah dari panel.
   Karena itu badge di sini netral, dan jenis integrasi ditandai potongan garis seperti di peta. */
.inspector .list { background: var(--color-elevated-secondary-background); }
.badge-line { width: 1rem; height: 0.625rem; flex: none; }

@media (width >= 80rem) {
  .inspector {
    position: sticky;
    top: var(--space-2);
    height: calc(100dvh - var(--space-4));
    margin: var(--space-2) var(--space-2) var(--space-2) 0;
  }
}

@media (width < 80rem) {
  .inspector {
    position: fixed;
    z-index: calc(var(--z-toolbar) + 1);
    top: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-2);
    width: min(var(--inspector-width), calc(100vw - var(--space-4)));
    box-shadow: var(--shadow-sheet);
    transition: translate var(--spring-smooth-duration) var(--spring-smooth);
  }
  @starting-style {
    .inspector:not([hidden]) { translate: calc(100% + var(--space-4)) 0; }
  }
}

@media (width < 48rem) {
  .inspector {
    top: auto;
    left: var(--space-2);
    width: auto;
    max-height: 70dvh;
  }
  @starting-style {
    .inspector:not([hidden]) { translate: 0 calc(100% + var(--space-4)); }
  }
}
```

```js
// Potongan untuk maps-renderer.js
const app = document.querySelector(".app");
const inspector = document.getElementById("inspector");
let tileTerakhir = null;

export function bukaInspector(tile) {
  tileTerakhir = tile;
  inspector.hidden = false;
  app.dataset.inspector = "open";
  document.getElementById("inspector-title").focus();
}

export function tutupInspector() {
  inspector.hidden = true;
  delete app.dataset.inspector;
  tileTerakhir?.focus();
}

inspector.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="close-inspector"]')) tutupInspector();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !inspector.hidden) tutupInspector();
});
```

**Aturan**:

1. Saat dibuka, fokus pindah ke judul inspector. Saat ditutup, fokus kembali ke kotak sistem yang tadi dipilih.
2. Jenis integrasi di inspector ditandai potongan garis yang sama dengan garis di peta, plus teks. Ini menyambungkan daftar dengan gambar peta tanpa bergantung pada teks berwarna.

### 14.4 Pemutar rute

**Kegunaan**: memutar rute alur per langkah (misalnya alur pembayaran dari aplikasi sampai bank). Kontrol melayang di bawah peta, jadi memakai material.

```html
<div class="route-player material material-thick" role="group" aria-label="Pemutar rute">
  <div class="route-info">
    <p class="text-footnote text-secondary">Rute: Pembelian item di toko</p>
    <p class="text-subheadline strong">Langkah <span class="num">3</span> dari <span class="num">8</span>: Toko ke Payment Gateway</p>
  </div>
  <div class="route-controls">
    <button class="icon-btn" type="button" data-route="prev" aria-label="Langkah sebelumnya">
      <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#skip-back"></use></svg>
    </button>
    <button class="icon-btn route-play" type="button" data-route="play" aria-label="Putar" aria-pressed="false">
      <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#play"></use></svg>
    </button>
    <button class="icon-btn" type="button" data-route="next" aria-label="Langkah berikutnya">
      <svg class="icon icon-md" aria-hidden="true"><use href="/assets/icons/sprite.svg#skip-forward"></use></svg>
    </button>
  </div>
</div>
```

```css
/* assets/css/pages/maps.css, lanjutan */
.route-player {
  position: sticky;
  bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: fit-content;
  max-width: calc(100% - var(--space-4));
  margin: var(--space-4) auto 0;
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-popover), inset 0 1px 0 var(--material-highlight);
}
.route-info { min-width: 0; }
.route-info > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.route-controls { display: flex; gap: var(--space-1); }
.route-play { background: var(--color-tint-soft); color: var(--color-tint); }

/* Sistem dan garis pada langkah aktif */
.tile[data-step="active"] { box-shadow: 0 0 0 3px var(--color-tint); }
.link[data-step="active"] { stroke-width: 3; opacity: 1; }

@media (prefers-reduced-motion: no-preference) {
  .tile[data-step="active"] { animation: step-pulse 0.6s var(--ease-in-out) 2; }
}
@keyframes step-pulse {
  50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-tint) 40%, transparent); }
}
```

**Aturan**:

1. Rute tidak berjalan sendiri. Pengguna yang menekan Putar, dan bisa menjeda kapan saja.
2. Tiap pindah langkah, teks langkah diumumkan lewat `announce()` (11.5).
3. Saat diputar, ikon berganti `pause` dan `aria-label` berganti "Jeda".
4. Jeda otomatis kalau pengguna memilih sistem lain atau membuka inspector.

### 14.5 Pencarian dan filter di Maps

- Search di toolbar menyaring kotak sistem berdasarkan nomor, nama, dan protokol. Kotak yang tidak cocok disembunyikan dengan atribut `hidden`, bukan dihapus.
- Jumlah hasil diumumkan: "12 sistem cocok".
- Filter jenis integrasi memakai chip (12.12) di dalam popover atau di bawah toolbar.
- Kalau hasil kosong, tampilkan empty state "Tidak ada hasil" (13.6).

---

## 15. Pola halaman

### 15.1 Login

Satu-satunya halaman tanpa sidebar. Satu kartu kaca di atas latar bergradasi halus, supaya efek material terlihat.

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Masuk | Hub</title>
  <link rel="stylesheet" href="/assets/css/app.css">
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script type="module" src="/assets/js/login.js"></script>
</head>
<body class="login-page">
  <main class="login-card material material-thick">
    <svg class="icon icon-xl login-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#lock"></use></svg>
    <h1 class="text-title-2 strong">Hub</h1>
    <p class="text-subheadline text-secondary">Masukkan password untuk melanjutkan.</p>

    <form class="login-form" method="post" action="/api/login">
      <div class="field">
        <label class="field-label" for="password">Password</label>
        <input class="field-input" id="password" name="password" type="password"
               autocomplete="current-password" required autofocus>
      </div>
      <div class="cf-turnstile" data-sitekey="SITE_KEY_TURNSTILE" data-theme="dark"></div>
      <p class="field-error" id="login-error" role="alert" hidden>
        <svg class="icon icon-sm" aria-hidden="true"><use href="/assets/icons/sprite.svg#circle-x"></use></svg>
        <span class="login-error-text"></span>
      </p>
      <button class="btn btn-filled btn-lg login-submit" type="submit">Masuk</button>
    </form>
  </main>
</body>
</html>
```

- Site key Turnstile memang publik, boleh ada di HTML. Secret key tetap hanya di server.
- Widget Turnstile menambahkan field tersembunyi `cf-turnstile-response` ke form secara otomatis.

```js
// assets/js/login.js
const form = document.querySelector(".login-form");
const input = form.querySelector("#password");
const button = form.querySelector('[type="submit"]');
const error = document.getElementById("login-error");
const errorText = error.querySelector(".login-error-text");

// Kembali ke halaman asal, tapi hanya path di situs ini (cegah open redirect)
function tujuanAman() {
  const next = new URLSearchParams(location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

function tampilkanError(pesan) {
  errorText.textContent = pesan;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", "login-error");
  input.select();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;
  input.removeAttribute("aria-invalid");
  button.setAttribute("aria-busy", "true");

  try {
    const res = await fetch("/api/login", { method: "POST", body: new FormData(form) });
    if (res.ok) {
      location.assign(tujuanAman());
      return;
    }
    const data = await res.json().catch(() => ({}));
    tampilkanError(data.message ?? "Tidak bisa masuk. Coba lagi.");
  } catch {
    tampilkanError("Koneksi terputus. Periksa internet lalu coba lagi.");
  } finally {
    button.removeAttribute("aria-busy");
    window.turnstile?.reset();
  }
});
```

```css
/* assets/css/pages/login.css */
.login-page {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-4);
  background:
    radial-gradient(60rem 40rem at 15% 10%, color-mix(in srgb, var(--color-tint) 22%, transparent), transparent 60%),
    radial-gradient(50rem 40rem at 90% 90%, color-mix(in srgb, var(--color-cat-4) 16%, transparent), transparent 60%),
    var(--color-system-background);
}

.login-card {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  width: min(24rem, 100%);
  padding: var(--space-8) var(--space-6);
  border-radius: var(--radius-xl);
  text-align: center;
}
.login-icon { color: var(--color-secondary-label); }
.login-form {
  display: grid;
  gap: var(--space-4);
  width: 100%;
  margin-top: var(--space-3);
  text-align: start;
}
.login-submit { width: 100%; }
```

Pesan dari server yang disarankan:

| Situasi | Pesan |
|---|---|
| Password salah | Password salah. |
| Terkunci karena terlalu banyak percobaan | Terlalu banyak percobaan. Coba lagi dalam 15 menit. |
| Turnstile gagal | Verifikasi gagal. Muat ulang halaman lalu coba lagi. |
| Error server | Tidak bisa masuk. Coba lagi. |

**Penting untuk gerbang login**: `login.js` ada di `/assets/js/`, padahal daftar pengecualian di `prompt-hub.md` bagian 6 hanya membuka `/assets/fonts/*`, `/assets/css/*`, `/assets/icons/*`. Tambahkan `/assets/js/login.js` (file itu saja, bukan seluruh folder js) ke daftar pengecualian middleware.

### 15.2 Beranda

```
toolbar        : judul "Hub"
isi            : Large Title, lalu dua list inset grouped
  list Systems : tiap baris ikon domain, nama, status ("Belum dibuat"), chevron
  list Maps    : tiap baris ikon domain, nama, jumlah sistem, chevron
```

Beranda memakai komponen yang sudah ada: list (12.9). Tidak perlu komponen baru.

### 15.3 Halaman Maps

```
toolbar        : menu (layar kecil), judul peta + jumlah sistem, search, tombol filter, segmented Peta/Daftar, menu aksi lain
tabs           : satu tab per bagian dengan jumlah sistem
kanvas         : grid kotak sistem + lapisan garis SVG
legenda        : di bawah kanvas
pemutar rute   : melayang di bawah kanvas
inspector      : kolom kanan (wide), panel kanan (regular), sheet bawah (compact)
```

```html
<main class="app-main" id="main" tabindex="-1">
  <header class="toolbar material material-thick"><!-- 12.14 --></header>
  <div class="page maps-page">
    <div class="tabs" role="tablist" aria-label="Bagian peta"><!-- 12.11 --></div>
    <section class="tab-panel" role="tabpanel" id="panel-akun" aria-labelledby="tab-akun">
      <div class="tile-grid-wrap">
        <div class="map-canvas tile-grid"><!-- 14.1, 14.2 --></div>
      </div>
      <ul class="legend" role="list"><!-- 14.2 --></ul>
    </section>
    <div class="route-player material material-thick"><!-- 14.4 --></div>
  </div>
</main>
<aside class="inspector" id="inspector" hidden><!-- 14.3 --></aside>
```

```css
/* assets/css/pages/maps.css, lanjutan */
.maps-page {
  display: grid;
  gap: var(--space-5);
}
```

### 15.4 Halaman Systems (sementara)

Isi tiap system belum ditentukan. Sementara: toolbar dengan judul domain, lalu empty state "Belum ada isi" dengan tautan ke peta domain yang sama (13.6).

### 15.5 State data

Semua halaman yang memuat data dari `/api` wajib menangani empat keadaan:

| Keadaan | Tampilan |
|---|---|
| Memuat | `.loading` setelah 400ms (13.5) |
| Berhasil | Konten |
| Kosong | Empty state (13.6) |
| Gagal | Empty state gagal memuat dengan tombol "Coba lagi" |

Sesi habis ditangani terpusat di `api.js`:

```js
// assets/js/api.js
export async function api(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });

  if (res.status === 401) {
    location.assign(`/login?next=${encodeURIComponent(location.pathname)}`);
    throw new Error("Sesi habis");
  }
  if (!res.ok) throw new Error(`Gagal memuat (${res.status})`);
  return res.json();
}
```

---

## 16. Penulisan

Apple menganggap teks bagian dari desain. Teks yang jelas mengurangi kebutuhan ikon, warna, dan penjelasan tambahan.

### 16.1 Aturan

1. Kalimat pendek. Satu kalimat satu gagasan.
2. Huruf kapital hanya di awal kalimat dan nama, termasuk untuk judul, tombol, dan menu ("Filter koneksi", bukan "Filter Koneksi"). Nama domain dan nama sistem tetap seperti aslinya (Finance, Payment Gateway).
3. Tombol berupa kata kerja.
4. Sapaan "kamu" kalau memang perlu menyapa. Lebih baik lagi kalimat tanpa sapaan.
5. Pesan error menjawab dua hal: apa yang terjadi dan apa yang bisa dilakukan. Tidak menyalahkan, tidak menampilkan kode teknis.
6. Angka ditulis sebagai angka ("8 koneksi"), dengan format dari 5.8.
7. Istilah konsisten di seluruh hub.

### 16.2 Contoh

| Hindari | Pakai |
|---|---|
| Error 401 | Sesi habis. Masuk lagi untuk melanjutkan. |
| Submit | Masuk |
| Apakah Anda yakin? | Reset tampilan peta? |
| Tidak ada data | Belum ada sistem di bagian ini. |
| Loading... | Memuat peta |
| Klik di sini | Buka peta Finance |
| Berhasil!!! | Tautan disalin |
| Terjadi kesalahan | Peta gagal dimuat. Coba lagi. |

### 16.3 Istilah baku hub

| Istilah | Arti | Jangan pakai |
|---|---|---|
| Sistem | Satu kotak di peta | Modul, node, aplikasi |
| Bagian | Satu tab di peta | Kategori, section |
| Kelompok | Kumpulan sistem dalam satu bagian | Grup |
| Koneksi | Hubungan antar dua sistem | Relasi, link |
| Jenis integrasi | Cara dua sistem terhubung (API sinkron, event, batch) | Tipe koneksi |
| Protokol | Teknologi koneksi (REST, gRPC, ISO 20022) | Format |
| Rute | Alur beberapa langkah lintas sistem | Flow, jalur |
| Pihak luar | Sistem milik organisasi lain | Eksternal, third party |

---

## 17. Urutan belajar

Mengikuti aturan project-first: tiap target selesai dalam 1 sampai 3 jam dan menghasilkan sesuatu yang bisa dilihat. Semua hasil dikumpulkan di `public/dev/katalog.html`, halaman katalog yang menampilkan setiap token dan komponen. Halaman ini tetap di balik login.

| No | Target | Baca bagian | Estimasi | Deliverable |
|---|---|---|---|---|
| 1 | Fondasi: `layers.css`, `reset.css`, `fonts.css`, `primitives.css`, `colors.css`, `typography.css`, bagian tipografi `base.css` | 3, 4, 5 | 2 sampai 3 jam | Katalog menampilkan semua warna semantik dan 11 text style |
| 2 | Token sisa: spacing, shape, material, motion, plus sprite ikon | 6 sampai 10 | 2 sampai 3 jam | Katalog menampilkan skala spacing dan radius, 4 material di atas gambar, 3 spring pada kotak yang bergerak |
| 3 | App shell, sidebar, toolbar | 6.4, 12.13, 12.14 | 2 sampai 3 jam | Beranda dengan sidebar accordion tanpa scroll, laci di layar kecil |
| 4 | Tombol, tombol ikon, field, search, select | 12.1 sampai 12.4, 12.8 | 2 sampai 3 jam | Katalog menampilkan semua varian dan state |
| 5 | Toggle, checkbox, segmented, badge, chip, tabs | 12.5 sampai 12.7, 12.11, 12.12 | 2 sampai 3 jam | Katalog lengkap, tabs bisa dipakai dengan keyboard |
| 6 | List dan tabel | 12.9, 12.10 | 1 sampai 2 jam | Beranda memakai list, tabel contoh di katalog |
| 7 | Dialog, alert, popover, toast, loading, empty state | 13 | 2 sampai 3 jam | Semua overlay bisa dibuka dan ditutup dengan Esc |
| 8 | Halaman login | 15.1 | 1 sampai 2 jam | Login lengkap dengan semua pesan error |
| 9 | Komponen Maps | 14, 15.3 | Bersamaan dengan target 5 di `prompt-hub.md` | `/maps/finance` memakai kotak sistem, garis, inspector, pemutar rute |
| 10 | Audit aksesibilitas | 11 | 1 sampai 2 jam | Daftar temuan beserta perbaikannya |

**Koreksi estimasi di `prompt-hub.md`**: target 3 di sana (font, token, base, sidebar) ditulis 2 sampai 3 jam. Dengan design system selengkap ini, isinya setara langkah 1 sampai 3 di atas, jadi realistisnya 6 sampai 9 jam atau tiga sesi.

---

## 18. Checklist sebelum selesai

### 18.1 Per komponen

- [ ] Hanya memakai token. Tidak ada hex, dan tidak ada px selain 1px border dan ukuran tetap yang memang dari Apple (toggle 51 x 31).
- [ ] Semua state ada: biasa, hover, ditekan, fokus, nonaktif. Plus loading dan error kalau relevan.
- [ ] Bisa dipakai penuh dengan keyboard.
- [ ] Kontras lolos: teks 4.5:1, non-teks 3:1. Dicek dengan fungsi di 11.6 kalau memakai warna baru.
- [ ] Reduce Motion: tidak ada gerak berpindah tempat.
- [ ] Zoom 200%: tidak terpotong.
- [ ] Ada contoh di katalog.

### 18.2 Per halaman

- [ ] `<html lang="id">` dan judul tab berpola "Nama halaman | Hub".
- [ ] Satu `h1`, heading berurutan.
- [ ] Skip link ke `#main`.
- [ ] Sidebar tidak scroll di tinggi area halaman 640px.
- [ ] Empat state data tertangani (15.5).
- [ ] Tidak ada `<style>`, atribut `style=""`, atau `<script>` inline (CSP).
- [ ] Lebar 320px tanpa scroll samping.
- [ ] Hanya satu tombol filled per area.
- [ ] Material hanya di lapisan navigasi dan kontrol, tidak di konten yang di-scroll.
- [ ] Lighthouse Accessibility tanpa temuan.

---

## 19. Glosarium

| Istilah | Arti |
|---|---|
| Token | Nama untuk keputusan desain (warna, ukuran, jarak) yang dipakai ulang lewat CSS custom property |
| Custom property | Variabel CSS, ditulis `--nama` dan dipakai dengan `var(--nama)` |
| Cascade layer | Fitur `@layer` untuk mengatur prioritas CSS per lapisan |
| Semantic color | Warna yang dinamai menurut fungsinya, bukan rupanya |
| Tint | Warna aksen utama aplikasi |
| Elevated | Latar untuk lapisan yang naik di atas lapisan lain (dialog, popover) |
| Material | Lapisan semi transparan yang memburamkan isi di belakangnya |
| `backdrop-filter` | Properti CSS untuk memberi efek (blur, saturasi) pada area di belakang elemen |
| Spring | Animasi berbasis fisika pegas |
| `linear()` | Fungsi easing CSS yang menerima banyak titik, dipakai untuk meniru kurva spring |
| Concentric | Aturan radius dalam = radius luar dikurangi padding |
| Squircle | Sudut membulat halus khas Apple, di CSS lewat `corner-shape: squircle` |
| Capsule | Bentuk dengan ujung setengah lingkaran penuh |
| Top layer | Lapisan paling atas halaman tempat `<dialog>` modal dan popover tampil, tanpa z-index |
| `@starting-style` | Aturan CSS untuk nilai awal animasi saat elemen baru muncul |
| `:focus-visible` | Selector untuk fokus yang berasal dari keyboard |
| Rasio kontras | Perbandingan terang dua warna menurut rumus WCAG, dari 1:1 sampai 21:1 |
| WCAG | Standar aksesibilitas web dari W3C. Hub menargetkan versi 2.2 level AA |
| ARIA | Atribut tambahan (`aria-label`, `role`) untuk menjelaskan elemen ke pembaca layar |
| Live region | Area yang perubahannya diumumkan otomatis oleh pembaca layar |
| Roving tabindex | Pola keyboard di mana hanya satu item dalam grup yang bisa dicapai dengan Tab, sisanya dengan panah |
| `rem` | Unit relatif terhadap ukuran font dasar browser, biasanya 16px |
| Tabular figures | Angka dengan lebar sama, supaya sejajar di tabel |
| Size class | Kelompok ukuran layar (compact, regular, wide) yang menentukan layout |
| Container query | Gaya yang bergantung pada lebar wadah, bukan lebar layar |
| Progressive enhancement | Fitur baru dipakai kalau browser mendukung, tanpa merusak browser lain |
| CSP | Content Security Policy, header keamanan yang membatasi sumber script, gaya, dan gambar |

---

## 20. Referensi

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- HIG Color: https://developer.apple.com/design/human-interface-guidelines/color
- HIG Dark Mode: https://developer.apple.com/design/human-interface-guidelines/dark-mode
- HIG Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- HIG Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- WWDC25, Get to know the new design system: https://developer.apple.com/videos/play/wwdc2025/356/
- Apple Design Resources: https://developer.apple.com/design/resources/
- Inter: https://rsms.me/inter/
- Lucide: https://lucide.dev
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ARIA pola Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- MDN `linear()`: https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear
- MDN `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- MDN Popover API: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- MDN `@starting-style`: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
- MDN `corner-shape`: https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape
- Dukungan `prefers-reduced-transparency`: https://web-platform-dx.github.io/web-features-explorer/features/prefers-reduced-transparency

---

## 21. Lampiran: perubahan yang perlu disalin ke `prompt-hub.md`

1. **Bagian 6, Gerbang**: tambahkan `/assets/js/login.js` ke daftar yang boleh diakses tanpa sesi.
2. **Bagian 8, Design system**: ganti isinya dengan rujukan ke dokumen ini. Tambahan penting: token warna `-text` dan `-fill` (4.3), placeholder memakai `secondary-label` (12.3), material hanya untuk lapisan navigasi (8.2).
3. **Bagian 9, Struktur folder**: tambahkan isi 3.6, ditambah file JS `prefs.js`, `dom.js`, `popover.js`, dan `login.js`.
4. **Bagian 12, Urutan kerja**: estimasi target 3 jadi 6 sampai 9 jam (tiga sesi), sesuai bagian 17.

