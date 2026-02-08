# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy (Recommended)

1. Visit: https://vercel.com/new
2. Import this repository: `https://github.com/siamshariar/demo-blog-post-2`
3. Click "Deploy" (no environment variables needed)
4. Done! Your app will be live in ~2 minutes

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
cd /var/www/demo-2
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? demo-blog-post-2
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

## ⚙️ Vercel Configuration

The project includes `vercel.json` with optimal settings:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

## 🔧 Build Settings

Vercel will automatically detect Next.js and use:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 20.x (recommended)

## 🌍 Environment Variables

No environment variables required for the demo! The app uses mock data.

If you want to connect to a real API later:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL=https://your-api.com`

## 📊 Performance Features

After deployment, Vercel provides:

✅ **Edge Network**: Global CDN for instant access  
✅ **Automatic HTTPS**: SSL certificates included  
✅ **Preview Deployments**: Every git push gets a preview URL  
✅ **Analytics**: Built-in performance monitoring  
✅ **ISR Support**: Incremental Static Regeneration enabled  

## 🎯 Post-Deployment Testing

Once deployed, test these features:

1. **Homepage**: Should load with 12 posts instantly
2. **Infinite Scroll**: Scroll down to load more
3. **Instant Modal**: Click any post → Opens <50ms
4. **SEO Page**: Right-click post → Open in new tab
5. **Browser Back**: Navigate between posts → Back button works
6. **Share URL**: Copy URL from modal → Share → Opens correctly

## 🔍 Monitoring

Check your deployment health:

```bash
# View deployment logs
vercel logs [deployment-url]

# Check build status
vercel inspect [deployment-url]
```

## 🐛 Troubleshooting

### Build Fails

1. Check Node version (should be 18.x or 20.x)
2. Clear build cache: Vercel Dashboard → Settings → Clear Cache
3. Verify all dependencies in package.json

### Modal Not Working

- This is a client-side feature, works after hydration
- Check browser console for errors
- Ensure JavaScript is enabled

### Slow Loading

- First load is slightly slower (server-side rendering)
- Subsequent navigation is instant (cached)
- Check Vercel Analytics for performance insights

## 📱 Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Update DNS records as shown
4. SSL automatically provisioned

## 🔄 Continuous Deployment

Every push to `main` branch automatically deploys to production:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel deploys automatically!
```

Pull requests get preview URLs automatically.

## 🎉 Success Checklist

After deployment, verify:

- [ ] Homepage loads with posts
- [ ] Infinite scroll works
- [ ] Modal opens instantly
- [ ] Direct URLs work for SEO
- [ ] Browser back/forward works
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain configured (if added)

---

**Need help?** Check [Vercel Documentation](https://vercel.com/docs) or [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
