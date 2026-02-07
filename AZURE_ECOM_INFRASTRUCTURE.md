# Azure Production Infrastructure Documentation

**Project:** Ecommerce Backend Deployment  
**Created by:** Vicky Anand  
**Date:** 2026-02-06 09:18 UTC  

---

# 1. Resource Group

**Name:** ecom-rg  
**Region:** Central India  

All Azure resources are grouped under this resource group.

---

# 2. Azure Container Registry

**Registry Name:** nodebackendregistry  
**Login Server:** nodebackendregistry.azurecr.io  
**SKU:** Basic  

**Image:**  
```
nodebackendregistry.azurecr.io/ecom-backend:v1
```

Used to store Docker images for backend deployment.

---

# 3. Azure Container App (Backend)

**Name:** ecom-backend  
**Environment:** ecom-env  
**Public URL:**  
```
https://ecom-backend.greenrock-fb1d6fc9.centralindia.azurecontainerapps.io
```

**Port:** 3000  
**Ingress:** External  

Backend runs Node.js with Express and Sequelize.

---

# 4. Azure PostgreSQL Flexible Server

**Server Name:** ecom-postgres-server  
**Host:** ecom-postgres-server.postgres.database.azure.com  
**Database:** ecomdb  
**Version:** PostgreSQL 14  
**SKU:** Standard_B1ms  

**Connection String Format:**

```
postgresql://USERNAME:PASSWORD@ecom-postgres-server.postgres.database.azure.com/ecomdb?sslmode=require
```

---

# 5. Azure Blob Storage

**Storage Account Name:** ecomrgstorage  
**Container Name:** product-images  

**Blob URL format:**

```
https://ecomrgstorage.blob.core.windows.net/product-images/<filename>
```

Used to store product images.

---

# 6. Backend Environment Variables

These are configured in Azure Container Apps:

```
DB_HOST=ecom-postgres-server.postgres.database.azure.com
DB_PORT=5432
DB_NAME=ecomdb
DB_USER=ecomadmin
DB_PASSWORD=********

AZURE_STORAGE_ACCOUNT=ecomrgstorage
AZURE_STORAGE_KEY=********
AZURE_CONTAINER=product-images

PORT=3000
```

---

# 7. Frontend Environment Variables

Frontend .env.local:

```
NEXT_PUBLIC_API_BASE_URL=https://ecom-backend.greenrock-fb1d6fc9.centralindia.azurecontainerapps.io
```

---

# 8. Docker Configuration

Dockerfile:

```
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

Build command:

```
docker buildx build --platform linux/amd64 -t nodebackendregistry.azurecr.io/ecom-backend:v1 --push .
```

---

# 9. Deployment Commands

Login to Azure:

```
az login
```

Login to registry:

```
az acr login --name nodebackendregistry
```

Deploy container app:

```
az containerapp create ...
```

Update container:

```
az containerapp update ...
```

---

# 10. Useful Azure Commands

View logs:

```
az containerapp logs show --name ecom-backend --resource-group ecom-rg --follow
```

---

# 11. Architecture Diagram

```
Frontend (Next.js)
        ↓
Azure Container Apps (Node backend)
        ↓
Azure PostgreSQL Flexible Server
        ↓
Azure Blob Storage
        ↓
Azure Container Registry
```

---

# 12. Production URLs

Backend:
https://ecom-backend.greenrock-fb1d6fc9.centralindia.azurecontainerapps.io

Blob Storage:
https://ecomrgstorage.blob.core.windows.net/product-images/

---

# END OF DOCUMENT
