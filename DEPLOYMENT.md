# Azure Deployment Guide - CodeDiffPro

## Quick Start with AZD

### 1. Prerequisites
```bash
# Install Azure CLI
# macOS: brew install azure-cli
# Windows: choco install azure-cli or download from https://aka.ms/azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install Azure Developer CLI
# All platforms: https://aka.ms/azd/install

# Verify installations
az --version
azd --version
```

### 2. Initialize and Deploy

```bash
# From CodeDiffPro directory
cd CodeDiffPro

# Initialize AZD project
azd init

# Log in to Azure
az login

# Select subscription (if multiple)
az account set --subscription <subscription-id>

# Provision resources (creates Resource Group and Static Web App)
azd provision

# Deploy application
azd deploy
```

### 3. Access Your Application
After deployment completes, you'll get a URL like:
```
https://codediffpro-xxx.azurestaticapps.net
```

Access this URL in your browser to view your deployed application.

## Directory Structure

```
CodeDiffPro/
├── infra/                      # Infrastructure as Code
│   ├── main.bicep            # Azure Static Web App definition
│   ├── main.parameters.json   # Deployment parameters
│   └── README.md              # Infrastructure documentation
├── src/                        # Application source
├── dist/                       # Build output (created by npm run build)
├── azure.yaml                  # AZD configuration
├── vite.config.ts             # Vite build configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

## Common Deployment Tasks

### Update and Re-deploy
```bash
# After making code changes
npm run build
azd deploy
```

Or simply:
```bash
azd deploy
```

### View Deployment Status
```bash
azd show
```

### View Application Logs
```bash
azd logs --service web
```

### Clean Up All Resources
```bash
azd down
```

### Monitor Application
```bash
# View real-time logs
azd logs --service web --follow
```

## Environment Configuration

### Set environment variables for deployment
Create `.env` file in ProjectRoot:
```
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_RESOURCE_GROUP=codediffpro-rg
AZURE_ENV_NAME=codediffpro-<unique-suffix>
AZURE_LOCATION=eastus
```

### Update Bicep Parameters
Edit `infra/main.parameters.json`:

```json
{
  "parameters": {
    "location": {
      "value": "eastus"  // Changed to your preferred region
    },
    "appName": {
      "value": "codediffpro-myapp"  // Unique name
    },
    "skuName": {
      "value": "Free"  // or "Standard"
    }
  }
}
```

## GitHub Integration (CI/CD)

### Enable automatic deployments from GitHub

1. Generate GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token"
   - Select `public_repo` scope
   - Copy the token

2. Update `infra/main.bicep`:
```bicep
param repositoryUrl string = 'https://github.com/your-username/CodeDiffPro'
param branch string = 'main'
param repositoryToken string = 'your-github-token'
```

3. Re-provision:
```bash
azd provision
```

Azure will automatically create GitHub Actions workflow for automatic deployments on push.

## Troubleshooting

### Q: Deployment fails with "Resource already exists"
**A:** The resource name may already be taken. Change `appName` in `main.parameters.json`

### Q: Build fails with "vite build error"
**A:** Verify:
- Node.js version is 16+
- All dependencies are installed: `npm install`
- No TypeScript errors: `npx tsc --noEmit`

### Q: Can't access deployed site
**A:** 
- Verify Static Web App is in "Running" state: `azd show`
- Check browser console for errors
- Run `azd logs` to see build logs

### Q: Environment variables not working
**A:** 
- API keys must be added to Azure App Configuration
- Or set in Azure Portal > Static Web App > Configuration

## Local Development

Develop locally before deploying:
```bash
npm install
npm run build  # Test production build
npm run dev    # Run development server (localhost:3000)
npm run test:e2e  # Run Playwright tests
```

## Cost Optimization

- **Free SKU**: Great for development, limited to 1 GB/month bandwidth
- **Standard SKU**: $9.99/month, includes SSL and custom domains
- **Reserved Instances**: Available for cost savings on Standard plan

Monitor spending in Azure Portal > Cost Management + Billing

## Next Steps

1. ✅ Deploy to Azure Static Web Apps
2. 📝 Add custom domain
3. 🔒 Configure authentication
4. 🚀 Enable CI/CD with GitHub
5. 📊 Set up monitoring and alerts
6. 🔄 Configure auto-scaling

## Resources

- [Azure Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Developer CLI Docs](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Bicep Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
