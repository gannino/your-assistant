# GitHub Actions Setup Guide

This guide explains how to set up and configure GitHub Actions for automated building and deployment of Your Assistant to GitHub Pages.

## Overview

The repository includes two GitHub Actions workflows:

1. **Test and Lint** (`.github/workflows/test.yml`) - Runs on every push and pull request
2. **Deploy to GitHub Pages** (`.github/workflows/deploy.yml`) - Automatically deploys to GitHub Pages

## Workflows

### 1. Test and Lint Workflow

**File**: `.github/workflows/test.yml`

**Triggers**:
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches

**Jobs**:
- **Test**: Runs on Ubuntu with Node.js 18.x and 20.x
  - Installs dependencies
  - Runs linting (`npm run lint:check`)
  - Runs formatting check (`npm run format:check`)
  - Builds the project (`npm run build`)
  - Runs tests (`npm test`)

**Purpose**: Ensures code quality, formatting consistency, and that the build process works correctly before deployment.

### 2. Deploy to GitHub Pages Workflow

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches

**Jobs**:
- **Build**: Creates optimized production build
  - Checks out code
  - Sets up Node.js 20 with npm caching
  - Installs dependencies (`npm ci`)
  - Builds project (`npm run build`)
  - Uploads build artifacts

- **Deploy**: Deploys to GitHub Pages
  - Uses the uploaded artifacts
  - Deploys to GitHub Pages environment

**Purpose**: Automatically builds and deploys the application to GitHub Pages on every push to the main branch.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Pages**
4. Under "Source", select **GitHub Actions**
5. Click **Save**

### 2. Configure Branch Protection (Optional but Recommended)

To ensure only tested code is deployed:

1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`/`master`
3. Enable:
   - Require a pull request before merging
   - Require approvals
   - Require status checks to pass before merging
   - Include administrators

### 3. Environment Variables (Optional)

If your application requires environment variables for production:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add any required secrets (e.g., API keys for production)
3. Update the workflow files to use these secrets if needed

## Deployment Process

### Automatic Deployment

1. **Push to main/master**: When you push to the main or master branch, the workflow automatically:
   - Runs tests and linting
   - Builds the production version
   - Deploys to GitHub Pages

2. **Pull Request**: When you create a pull request:
   - Tests and linting run
   - Build is created (but not deployed)
   - You can see the build artifacts in the Actions tab

### Manual Deployment

If you need to manually trigger a deployment:

1. Go to **Actions** tab in your repository
2. Find the "Deploy to GitHub Pages" workflow
3. Click **Run workflow**
4. Select the branch you want to deploy

## Monitoring Deployments

### View Deployment Status

1. Go to **Actions** tab
2. Look for workflow runs
3. Check the status of "Deploy to GitHub Pages"

### View Deployment URL

After successful deployment:

1. Go to **Settings** → **Pages**
2. The deployment URL will be shown
3. Format: `https://<username>.github.io/<repository-name>`

### View Build Logs

1. Go to **Actions** tab
2. Click on a workflow run
3. Expand job steps to see detailed logs

## Troubleshooting

### Build Failures

**Common Issues**:
- Missing dependencies in `package.json`
- TypeScript/ESLint errors
- Build script errors

**Solutions**:
- Check the Actions logs for specific error messages
- Run `npm run build` locally to reproduce
- Ensure all dependencies are properly listed

### Deployment Failures

**Common Issues**:
- Permission errors
- GitHub Pages not enabled
- Environment configuration issues

**Solutions**:
- Verify GitHub Pages is enabled in repository settings
- Check that the workflow has proper permissions
- Ensure the repository has the correct branch protection rules

### Test Failures

**Common Issues**:
- ESLint errors in code
- Prettier formatting issues
- Jest test failures
- Build script errors in `package.json`
- Missing dependencies
- Node.js version compatibility

**Solutions**:
- Run `npm run lint:check` locally to identify ESLint issues
- Run `npm run format:check` locally to identify formatting issues
- Run `npm test` locally to identify test failures
- Check that `npm run build` works locally
- Verify all dependencies are properly listed in `package.json`
- Ensure Node.js version matches the workflow matrix

## Customization

### Adding More Node.js Versions

Edit `.github/workflows/test.yml`:

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x, 22.x]  # Add more versions
```

### Adding More Build Steps

Edit `.github/workflows/deploy.yml`:

```yaml
- name: Additional build step
  run: npm run custom-build-script
```

### Environment-Specific Builds

For different environments (staging, production):

1. Create separate workflow files
2. Use different branch triggers
3. Configure different deployment targets

### Custom Domain

To use a custom domain:

1. Add a `CNAME` file to your repository root
2. Configure DNS settings with your domain provider
3. GitHub Pages will automatically use the custom domain

## Best Practices

1. **Use Branch Protection**: Require PR reviews and status checks
2. **Monitor Deployments**: Check Actions tab regularly
3. **Keep Dependencies Updated**: Regularly update Node.js and npm versions
4. **Test Locally**: Always test builds locally before pushing
5. **Use Semantic Commits**: Follow conventional commit standards
6. **Monitor Performance**: Check build times and optimize if needed

## Security Considerations

1. **Secrets Management**: Use GitHub Secrets for sensitive data
2. **Minimal Permissions**: Only grant necessary permissions to workflows
3. **Dependency Security**: Regularly audit dependencies for vulnerabilities
4. **Environment Isolation**: Use separate environments for staging/production

## Next Steps

After setting up GitHub Actions:

1. **Test the Workflow**: Push a small change to trigger the workflow
2. **Monitor the First Deployment**: Check that everything deploys correctly
3. **Set Up Monitoring**: Consider adding uptime monitoring for your deployed site
4. **Optimize Build Time**: Review and optimize build steps if needed
5. **Add More Checks**: Consider adding security scans or performance tests

## Support

If you encounter issues with GitHub Actions:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review the workflow logs for specific error messages
3. Check the [GitHub Community Forum](https://github.community/c/code-to-cloud/github-actions/41)
4. Create an issue in the repository with detailed error information