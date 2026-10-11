# EIE-Workflow

Visual no-code/low-code workflow automation platform. Connect applications, APIs, databases, AI services, communication platforms, and webhooks through an intuitive visual canvas.

---

## 🚀 GitHub Push par Auto-Deploy (Website Update on Push)

जब भी आप इस रिपॉजिटरी में `git push` करेंगे, आपकी वेबसाइट अपने आप बिल्ड होकर लाइव अपडेट हो जाएगी।

Whenever you push to `main` or `master` branch on GitHub, GitHub Actions will automatically run `npm run build` and update the live website.

### 📌 GitHub Pages Setup (सिर्फ 1 बार करना है / One-time setup)

अगर आपकी वेबसाइट GitHub Pages पर होस्टेड है, तो GitHub रिपॉजिटरी में यह सेटिंग्स चेक करें:

1. **GitHub Repository** खोलें → **Settings** टैब पर जाएं।
2. बायीं तरफ **Pages** पर क्लिक करें।
3. **Build and deployment** सेक्शन में **Source** चुनें:
   - **विकल्प 1 (सर्वोत्तम / Recommended):** **`GitHub Actions`** चुनें।
     - पुश करते ही `.github/workflows/deploy.yml` अपने आप साइट को लाइव कर देगा।
   - **विकल्प 2:** **`Deploy from a branch`** चुनें।
     - Branch: `main` या `gh-pages`
     - Folder: `/docs` (अगर `main` चुना है) या `/ (root)` (अगर `gh-pages` चुना है)
4. **Actions Permissions (ज़रूरी / Important):**
   - **Settings** → **Actions** → **General** → **Workflow permissions** में जाकर **"Read and write permissions"** सेलेक्ट करें और **Save** करें। इससे GitHub Actions को नया बिल्ड पब्लिश करने की अनुमति मिल जाती है।

---

## 🛠️ Local Development & Manual Build

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production site (creates dist/ and docs/)
npm run build

# 4. Preview build locally
npm run preview
```

---

## 🌐 Supported Hosting Platforms

- **GitHub Pages:** Automated via `.github/workflows/deploy.yml` (supports GitHub Actions, `main/docs`, and `gh-pages` branch).
- **Vercel:** Automated via `vercel.json` (`dist` output directory & SPA rewrites).
- **Netlify:** Automated via `netlify.toml` (`dist` publish directory & 200 redirects).
- **Cloud Run / Full-Stack Node.js:** Supported via `server.ts`.
