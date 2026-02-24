param location string = resourceGroup().location
param appName string = uniqueString(resourceGroup().id)
param skuName string = 'Free'
param repositoryUrl string = ''
param branch string = 'main'
param repositoryToken string = ''

// Create Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: appName
  location: location
  sku: {
    name: skuName
    tier: skuName
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
      skipGithubActionWorkflowGeneration: true
    }
  }
}

// Output the Static Web App URL
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output staticWebAppName string = staticWebApp.name
output resourceId string = staticWebApp.id
