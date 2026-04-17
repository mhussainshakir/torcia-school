# Google Drive API Setup Guide (اردو میں)

## Google Drive API کیوں؟

- Firebase Storage **paid** hai, isliye hum Google Drive use karenge
- Har student ko **15GB FREE** space milti hai Google Drive main
- PDFs, images, aur videos yahan store honge

---

## Step 1: Google Cloud Console پر جائیں

1. **Google Cloud Console** kholें: https://console.cloud.google.com/
2. Apni **Google account** se login करें
3. Agar pehle se project nahi hai to **"Select a project"** click करें
4. **"New Project"** पर क्लिक करके नया project बनाएं
5. Project name: `Torcia School System`
6. **"Create"** button दबाएं

---

## Step 2: Google Drive API Enable करें

1. Left side menu मे **"APIs & Services"** पर क्लिक करें
2. **"Library"** पर क्लिक करें
3. Search box मे **"Google Drive API"** لکھیں
4. **"Google Drive API"** पर क्लिक करें
5. **"Enable"** button दबाएं

---

## Step 3: API Key बनाएं

1. Left side menu मे **"APIs & Services"** फिर **"Credentials"** पर क्लिक करें
2. **"Create Credentials"** पर क्लिक करें
3. **"API key"** चुनें
4. Naya API key ban जाएगा - इसे **copy करें** (yeh aapki API key hai)
5. Example: `AIzaSyXXXXXXXXXXXXXXXXXXXXX`

---

## Step 4: API Key Restrictions (Zaroori Nahi)

Agar aap security badhana chahte hain:

1. Created API key पर क्लिक करें
2. **"API restrictions"** section मे जाएं
3. **"Restrict key"** चुनें
4. **"Google Drive API"** को select करें
5. **"Save"** करें

---

## Step 5: API Key Copy करें

✅ Aapki Google Drive API key ready hai!

Example API key:
```
AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXX
```

**IMPORTANT:** Yeh API key ko **secure rakhein** - kisi ko share na karein.

---

## Step 6: App Main Integration

### Agar aap Admin hain:

1. App खोलें
2. **Admin Dashboard** (`/admin`) पर जाएं
3. **Settings** section मे **"Google Drive API Key"** field मिलेगा
4. Wahan apni API key paste करें
5. **Save** करें

### Agar aap Student hain:

1. App खोलें
2. **Dashboard** पर जाएं
3. **Settings** section मे **"Google Drive API Key"** field मिलेगा
4. Wahan apni API key paste करें
5. **Save** करें

---

## Google Drive API Key Kaise Use Hoti Hai?

| Action | Kaise Kaam Karta Hai |
|--------|----------------------|
| PDF Upload | Google Drive API se file upload hoti hai |
| Image Upload | Image Google Drive मे save hoti hai |
| Video Upload | Video Google Drive मे store hoti hai |
| File Download | Google Drive API se file download hoti hai |

---

## Troubleshooting

### Agar API key kaam nahi kar rahi:

1. Check karें कि Google Drive API **enabled** hai
2. Check karें कि API key **copy** sahi se hui hai
3. Check karें कि **restrictions** sahi set hain

### Agar "API not enabled" error:

1. Google Cloud Console खोलें
2. APIs & Services > Library जाएं
3. Google Drive API को **Enable** करें

---

## Security Tips

⚠️ **Important:**
- API key ko **public** mat karein
- API key ko **.env.local** file मे bhi store karें
- Production मे **API restrictions** use karein

---

## Contact Support

Agar koi problem hai to:
- Email: support@torcia.com
- Documentation: /docs/google-drive-setup

---

**Last Updated:** April 2026
**Version:** 1.0
