# Ascend: Level Up IRL

A free, gamified training app for iPhone. Setup asks about your body, goal, equipment and schedule, then builds a personal plan. Clear your Daily Quest each day to earn XP, level up, and climb from E-Rank to S-Rank.

## Features

- **Personal plan.** Pick your training days (1–6 a week), workout length, goal (lose fat, build muscle, recomp, get stronger), experience level, and equipment (bodyweight only, home gym, full gym, or any mix). Only exercises you can do with your equipment show up.
- **Daily Quest = today's workout.** On training days it's your workout. On other days it's a light recovery quest (walk, stretch, protein). Log each set with the reps you actually got. Swap any exercise for another option that uses the same movement.
- **Automatic progression.** Hit the top of the rep range on every set and the weight goes up next time. For bodyweight moves, you graduate to a harder version (incline push-up → push-up → decline → archer).
- **Strength potential.** Your estimated 1-rep max and rep maxes now, plus projections for 3 months, 6 months and 1 year, and a realistic natural ceiling. It uses published strength standards for your sex and bodyweight. The numbers firm up as you log workouts or take a max test.
- **Body and goals.** Calories (Mifflin-St Jeor), protein, body fat (U.S. Navy tape method, or a BMI estimate until you measure), a suggested goal weight with a date, and a "where you could be in 1/3/6/12 months" projection with a chart. Shows your natural muscle potential based on your height.
- **Progress photos.** Front, side and back photos with side-by-side comparison. They're stored only on your phone, never uploaded.
- **Game layer.** XP, levels, E→S ranks with rank-up screens, attributes (STR/END/AGI/VIT/INT) that grow from what you train, streaks, penalties for missed days, and 23 achievements (including hidden ones).
- **Gold & shop.** Earn gold from quests, achievements, a daily bonus and a weekly chest. Spend it on XP Boosts, Streak Shields, Stat Potions, color themes and titles.
- **Workout mode.** A rep counter ring, weight controls, an automatic rest timer, and countdown timers for timed exercises.
- **Look & feel.** A dark "System" interface with code-drawn night-city scenes, lightning and glowing emblems, plus sound effects you can turn off.

All numbers are estimates based on published formulas, not medical advice.

## Put it on your iPhone (free)

Do steps 1–4 on your **Windows PC** in Chrome or Edge at **github.com**. The GitHub iPhone app can't upload files. The app files are in the **Ascend app** folder on your Desktop.

### 1. Make a GitHub account
Go to **github.com** and click **Sign up**. Follow the steps and verify your email. A verified email is required for the website to publish.

### 2. Create the repository (the online folder for your app)
1. Click the **+** in the **top-right corner** of any GitHub page, then **New repository**.
2. **Repository name:** `ascend` (all lowercase, no spaces; this becomes part of your link).
3. Choose **Public**. Free accounts can only publish public repositories. Nobody can see your workouts or photos; those stay on your phone.
4. Switch **Add README** to **On**. This matters: without it, the **Add file** button in the next step won't appear.
5. Click **Create repository**.

### 3. Upload the app files
All the app's files sit in one folder with no subfolders, so you can upload them in one go.

1. On your new repository's page, above the list of files, click **Add file** → **Upload files**.
2. Click **choose your files**. In the window that opens, go to the **Ascend app** folder on your Desktop, press **Ctrl + A** to select all 18 files, and click **Open**. (Dragging the files onto the page works too.)
3. Wait until the list finishes loading. It should show all 18 files: `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `README.md`, the nine `.js` files (`app`, `art`, `calc`, `data`, `game`, `photos`, `plan`, `sound`, `util`) and four icon files.
4. Scroll down and click the green **Commit changes** button.

Check: the repository page should list **index.html** and **app.js** side by side. If you see them inside another folder, the site won't work.

### 4. Turn on the website (GitHub Pages)
1. In your repository, click **Settings** (the tab with a gear, in the row under the repository name). If you don't see it, click the **…** menu at the end of that row.
2. In the left sidebar, under **Code, planning, and automation**, click **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main**, leave the folder as **/ (root)**, and click **Save**.
5. Wait 1–10 minutes and refresh the page. A box will say **"Your site is live at …"** with a **Visit site** button. Your link looks like `https://YOUR-USERNAME.github.io/ascend/`.

### 5. Install it on your iPhone
1. On your iPhone, open that link in **Safari** (not Chrome).
2. Tap the **Share** button (square with an arrow), scroll down, and tap **Add to Home Screen** → **Add**.
3. Always open Ascend from the Home Screen icon.

Send friends the same link; they do step 5 only. Each person's data stays on their own phone. Use **Settings → Export** inside the app to back up (photos included).

### Updating the app later
Repeat step 3 with the changed files (GitHub replaces files with the same name), then wait a few minutes. The app picks up the new version the next time you open it with internet.

## Run it on your computer

```bash
py -m http.server 8765
```

Then open http://localhost:8765.

## Code layout

- `data.js`: exercise library, workout templates, strength standards, ranks
- `calc.js`: units, body fat, calories, body and strength projections
- `plan.js`: plan generation, daily quests, progressive overload
- `photos.js`: photo storage (IndexedDB) and resizing
- `game.js`: game rules: XP, gold, levels, quests, penalties, attributes, achievements, shop
- `art.js`: code-drawn scenes, emblems, exercise figures and icons
- `sound.js`: synthesized sound effects
- `app.js`: all screens, navigation and the workout flow
