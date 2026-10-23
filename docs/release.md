# Випуск (збірка й поширення)

Збірка не підписана й не нотаризована (немає Apple Developer акаунта, Mac App Store не
використовується). Артефакти — `.dmg` і `.zip` для Apple Silicon (arm64) та Intel (x64).

## 1. Піднімання версії

```bash
npm version patch   # або minor / major; змінює "version" у package.json
```

Версія потрапляє в назви файлів: `Image Resizer-<версія>-arm64.dmg` тощо.

## 2. Підготовка залежностей (один раз)

`sharp` має окремі нативні бінарники для кожної архітектури. Щоб зібрати x64-версію на Apple Silicon
(і навпаки), встановіть бінарники обох платформ:

```bash
npm install --os=darwin --cpu=x64 sharp --legacy-peer-deps
npm install --os=darwin --cpu=arm64 sharp --legacy-peer-deps
```

Прапорець `--legacy-peer-deps` потрібен, бо в цьому середовищі `npm` без нього інколи падає з
помилкою `Cannot read properties of null (reading 'edgesOut')`.

## 3. Збірка

```bash
npm test          # переконайтеся, що всі тести проходять
npm run dist      # tsc + electron-builder
```

Результат — у папці `release/` (вона в `.gitignore`):

| Файл | Архітектура |
| --- | --- |
| `Image Resizer-<версія>-arm64.dmg`, `Image Resizer-<версія>-arm64-mac.zip` | Apple Silicon |
| `Image Resizer-<версія>.dmg`, `Image Resizer-<версія>-mac.zip` | Intel |

Налаштування збірки — у полі `build` у `package.json`: `mac.identity: null` (без підпису), `sharp` і
`@img/*` у `asarUnpack` (нативні модулі не можна читати з `app.asar`), іконка `build/icon.icns`.
Іконку можна перегенерувати командою `node scripts/make-icon.mjs`.

## 4. Перевірка зібраної програми

1. Переконайтеся, що `sharp` розпакований: `release/mac-arm64/Image Resizer.app/Contents/Resources/app.asar.unpacked/node_modules/@img/` містить `sharp-darwin-arm64` і `sharp-libvips-darwin-arm64`.
2. Запустіть пакет як звичайний `.app` і перегляньте вікно:

   ```bash
   open -n "release/mac-arm64/Image Resizer.app"
   ```

3. Обробіть папку-фікстуру з HEIC: оберіть її в програмі й натисніть Run. Мають з'явитися файли
   `<name>_<W>x<H>.jpg`, зокрема для `.heic`.

## 5. Перший запуск на іншому Mac (Gatekeeper)

Завантажений файл без підпису macOS блокує. Користувач має:

1. Відкрити `.dmg` й перетягнути **Image Resizer** у `Applications` (для `.zip` — розпакувати).
2. Клацнути програму **правою кнопкою → Open → Open** (достатньо один раз).

Якщо macOS усе одно відмовляє, зняти карантинний атрибут:

```bash
xattr -cr "/Applications/Image Resizer.app"
```

## 6. Поширення

Передайте `.dmg` (або `.zip`) потрібної архітектури — через GitHub Releases, хмарне сховище чи
месенджер — разом із нагадуванням про крок 5. Визначити архітектуру Mac: меню  → **Про цей Mac**
(Apple M… = arm64, Intel = x64).
