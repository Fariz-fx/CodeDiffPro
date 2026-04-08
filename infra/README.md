# Infrastructure - Azure Static Web App

This folder contains the Infrastructure as Code (IaC) for deploying CodeDiffPro to Azure Static Web Apps using Azure Developer CLI (azd).

## Files

- **main.bicep** - Bicep template defining Azure Static Web App resource
- **main.parameters.json** - Parameters for the Bicep template

## Prerequisites

1. **Azure CLI** installed ([Install Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli))
2. **Azure Developer CLI (azd)** installed ([Install azd](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd))
3. **Node.js** 16+ installed
4. An **Azure subscription**

## Setup Instructions

### 1. Initialize AZD Environment
```bash
azd init
```

### 2. Set Up Azure Resources
```bash
azd provision
```
This will:
- Create a resource group
- Create an Azure Static Web App

### 3. Deploy Application
```bash
azd deploy
```
This will:
- Build your React application (`npm run build`)
- Deploy the built files to Azure Static Web App

## Configuration

Edit `main.parameters.json` to customize:
- **location** - Azure region for deployment (default: eastus)
- **appName** - Name of your static web app
- **skuName** - Pricing tier (Free, Standard)

## Environment Variables

Create `.env` file in the root with:
```bash
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=codediffpro-rg
AZURE_ENV_NAME=codediffpro
AZURE_REGION=eastus
```

## Common Commands

### View deployment status
```bash
azd show
```

### View application logs
```bash
azd logs
```

### Clean up resources
```bash
azd down
```

### Re-deploy
```bash
azd deploy
```

## GitHub Integration (Optional)

To enable CI/CD with GitHub:

1. Update `main.bicep`:
   - Set `repositoryUrl` to your GitHub repo URL
   - Set `branch` to desired branch
   - Generate GitHub Personal Access Token and set `repositoryToken`

2. Azure will automatically create GitHub Actions workflow for automatic deployments

## Output Locations

After deployment, the following information is available:
- **Static Web App URL** - Access your deployed app
- **Resource Group** - Contains all Azure resources created

## Build Output

The application builds to `dist/` directory (configured in Vite). Azure Static Web Apps will serve files from this directory.

## Troubleshooting

### Build fails
- Ensure `package.json` has `build` script defined
- Verify `vite.config.ts` is correctly configured
- Check Node.js version (16+)

### Deployment fails
- Run `azd logs` to view error messages
- Verify Azure subscription has quota for resources
- Check resource group permissions

## References

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Developer CLI Documentation](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Bicep Language Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
