# aaakaind.github.io

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow (`.github/workflows/deploy.yml`) runs automatically when changes are pushed to the `main` branch.

### How Deployment Works

1. When code is pushed to the `main` branch, the GitHub Actions workflow is triggered
2. The workflow checks out the repository
3. It configures GitHub Pages settings
4. It uploads the site files as an artifact
5. Finally, it deploys the site to GitHub Pages

The site will be available at:
- Primary URL: https://aaakaind.github.io
- Custom domain: https://www.akaind.ca (when DNS is configured)

### Manual Deployment

You can also trigger a deployment manually:
1. Go to the Actions tab in the GitHub repository
2. Select the "Deploy static content to Pages" workflow
3. Click "Run workflow" and select the `main` branch

## Custom Domain Setup with CNAME

This repository includes a CNAME file for setting up a custom domain with GitHub Pages.

### What is a CNAME file?

A CNAME file is used by GitHub Pages to configure a custom domain for your site. When present, GitHub Pages will serve your site at the domain specified in the CNAME file instead of the default `aaakaind.github.io` domain.

### Current Setup

The CNAME file in this repository is currently set to: **www.akaind.ca**

### How to Configure Your Custom Domain

#### Step 1: Update the CNAME File

1. Edit the `CNAME` file in the root of this repository
2. Replace `www.example.com` with your actual custom domain (e.g., `www.yourdomain.com` or `yourdomain.com`)
3. The file should contain **only** your domain name, nothing else
4. Commit and push the changes

**Example CNAME file content:**
```
www.akaind.ca
```

#### Step 2: Configure Your Domain Registrar (DNS Settings)

You need to add DNS records at your domain registrar (e.g., GoDaddy, Namecheap, Google Domains, Cloudflare).

**Option A: Using a subdomain (www.yourdomain.com)**

Add a CNAME record:
- **Type:** CNAME
- **Host/Name:** www
- **Value/Points to:** aaakaind.github.io
- **TTL:** 3600 (or default)

**Option B: Using an apex domain (yourdomain.com)**

Add A records for GitHub Pages IP addresses:
- **Type:** A
- **Host/Name:** @ (or leave blank)
- **Value:** 185.199.108.153
- **TTL:** 3600

Add additional A records with these IPs:
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

Optionally, add a CNAME record for www:
- **Type:** CNAME
- **Host/Name:** www
- **Value:** aaakaind.github.io

#### Step 3: Enable Custom Domain in GitHub

1. Go to your repository settings on GitHub
2. Navigate to **Pages** section (Settings → Pages)
3. Under "Custom domain", enter your domain name
4. Click **Save**
5. Wait for DNS check to complete (can take up to 24-48 hours)
6. Once verified, enable **Enforce HTTPS** (recommended)

### Verification

After DNS propagation (which can take 24-48 hours), verify your setup:

1. Visit your custom domain in a browser
2. Check that it loads your GitHub Pages site
3. Verify HTTPS is working (you should see a lock icon)

### Troubleshooting

- **DNS not resolving:** DNS changes can take up to 48 hours to propagate globally
- **CNAME already exists:** Your CNAME file should contain only one domain name
- **SSL certificate errors:** Wait for GitHub to issue an SSL certificate (can take a few minutes after DNS verification)
- **Check DNS propagation:** Use tools like https://www.whatsmydns.net/ to check if your DNS changes have propagated

### Additional Resources

- [GitHub Pages Custom Domain Documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Verifying your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
