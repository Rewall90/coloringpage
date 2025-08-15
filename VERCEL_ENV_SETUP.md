# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these environment variables in your Vercel project settings to fix the build error.

### Steps to Add Environment Variables:

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `coloringpage`
3. Navigate to: **Settings** → **Environment Variables**
4. Add the following variables:

### Required Variables (MUST ADD):

| Variable Name       | Value        | Environment                      |
| ------------------- | ------------ | -------------------------------- |
| `SANITY_PROJECT_ID` | `zjqmnotc`   | Production, Preview, Development |
| `SANITY_DATASET`    | `production` | Production, Preview, Development |

### Optional Variables (Add if needed):

| Variable Name       | Value                                                                                                                                                                                  | Environment                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `SANITY_TOKEN`      | `skUEtk3e3NAlADz1wcrtCp1ZC9LTwHemwLVInXv4v4EWDA62tG8VRHBXJnDYW9OLJyxtk03E4QaM1cp3kVBKPQFOjQm9MwIWoDyUKj7N5U3NNvMD6CzHLGSUOnK2M9aU4sQt5ba7BZA7WXd8RPTNtmEomJuAw0ohLmuCBwY7NCz1SnEFrtbB` | Production only (if your dataset is private) |
| `RESEND_API_KEY`    | `re_aqjuLFCF_Png87x6ins7VHQxWFQ1ZXK3Q`                                                                                                                                                 | Production, Preview                          |
| `RESEND_FROM_EMAIL` | `noreply@mysite.com`                                                                                                                                                                   | Production, Preview                          |
| `RESEND_TO_EMAIL`   | `admin@mysite.com`                                                                                                                                                                     | Production, Preview                          |
| `HUGO_ENV`          | `production`                                                                                                                                                                           | Production                                   |

### How to Add Each Variable:

1. Click **Add New Variable**
2. Enter the **Variable Name** (e.g., `SANITY_PROJECT_ID`)
3. Enter the **Value** (e.g., `zjqmnotc`)
4. Select which environments to apply to:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### After Adding Variables:

1. All variables are added successfully
2. Go to **Deployments** tab
3. Find the failed deployment
4. Click the **...** menu → **Redeploy**
5. The build should now succeed

## Alternative: Quick Fix via CLI

If you have Vercel CLI installed:

```bash
# Add required variables
vercel env add SANITY_PROJECT_ID production
vercel env add SANITY_DATASET production

# When prompted, enter the values:
# SANITY_PROJECT_ID: zjqmnotc
# SANITY_DATASET: production
```

## Verification

After adding the variables and redeploying, your build log should show:

```
📦 Loaded environment from: system environment variables
🔌 Sanity client initialized successfully
✅ Connection successful
```

Instead of the current error:

```
❌ Failed to initialize Sanity client: Configuration must contain `projectId`
```
