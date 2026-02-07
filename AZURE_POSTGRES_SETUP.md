# Azure Infrastructure Documentation — Ecommerce Project

## Resource Group

**Resource Group Name:** ecom-rg
**Location:** centralindia
**Subscription ID:** 95015e3e-a588-40c4-b017-a85e8b4ce313

---

# Current Production Storage Account (ACTIVE)

**Storage Account Name:** ecomrgstorage
**Storage Type:** StorageV2
**Location:** centralindia
**Access Tier:** Hot

**Primary Blob Endpoint:**
[https://ecomrgstorage.blob.core.windows.net/](https://ecomrgstorage.blob.core.windows.net/)

**Container Name:** product-images

**Container Public Access:** Enabled (blob level)

**Container Base URL:**
[https://ecomrgstorage.blob.core.windows.net/product-images/](https://ecomrgstorage.blob.core.windows.net/product-images/)

**Example Image URL:**
[https://ecomrgstorage.blob.core.windows.net/product-images/products/example.webp](https://ecomrgstorage.blob.core.windows.net/product-images/products/example.webp)

---

# Storage Account Credentials (ACTIVE)

**Storage Account Name:**
ecomrgstorage

**Storage Key (Primary):**
(Store securely in .env file — DO NOT commit to Git)

**Environment Variables Format:**

AZURE_STORAGE_ACCOUNT=ecomrgstorage
AZURE_STORAGE_KEY=YOUR_PRIMARY_KEY
AZURE_CONTAINER=product-images

---

# CORS Configuration (ACTIVE)

Allowed Origins:

[http://localhost:3000](http://localhost:3000)
[http://localhost:3001](http://localhost:3001)

Allowed Methods:

GET
PUT
POST
DELETE
HEAD
OPTIONS

Allowed Headers:

-

Exposed Headers:

x-ms-\*

---

# Old Storage Account (DELETED)

**Storage Account Name:** ecomalpha12345
**Status:** Deleted
**Resource Group:** ecom-rg
**Deletion Date:** 2026-02-06

**Old Blob Endpoint:**
[https://ecomalpha12345.blob.core.windows.net/](https://ecomalpha12345.blob.core.windows.net/)

**Old Container Name:**
product-images

**Migration Status:**
All blobs successfully migrated to new storage account ecomrgstorage.

---

# Backend Configuration (Node.js)

.env configuration:

AZURE_STORAGE_ACCOUNT=ecomrgstorage
AZURE_STORAGE_KEY=YOUR_PRIMARY_KEY
AZURE_CONTAINER=product-images

Upload URL format:

[https://ecomrgstorage.blob.core.windows.net/product-images/{filename}](https://ecomrgstorage.blob.core.windows.net/product-images/{filename})

---

# Frontend Configuration (Next.js)

Image Base URL:

[https://ecomrgstorage.blob.core.windows.net/product-images/](https://ecomrgstorage.blob.core.windows.net/product-images/)

Example usage:

const imageUrl = `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/${filename}`;

Environment variable:

NEXT_PUBLIC_BLOB_BASE_URL=[https://ecomrgstorage.blob.core.windows.net/product-images](https://ecomrgstorage.blob.core.windows.net/product-images)

---

# Azure CLI Commands Reference

Login:

az login

List storage accounts:

az storage account list --resource-group ecom-rg -o table

List containers:

az storage container list
--account-name ecomrgstorage
--account-key YOUR_KEY
-o table

List blobs:

az storage blob list
--account-name ecomrgstorage
--account-key YOUR_KEY
--container-name product-images
-o table

---

# Security Recommendations

DO NOT commit storage keys to GitHub.

Always use environment variables.

Rotate keys periodically:

az storage account keys renew
--account-name ecomrgstorage
--resource-group ecom-rg
--key primary

---

# Architecture Overview

Frontend: Next.js
Backend: Node.js + Express
Database: PostgreSQL (Azure setup pending)
File Storage: Azure Blob Storage

Flow:

User uploads image → Next.js → Node.js → Azure Blob Storage → URL saved in PostgreSQL → Frontend displays image

---

# Created By

Project Owner: Vicky Anand
Environment: Production
Cloud Provider: Microsoft Azure
Region: Central India

---

# Last Updated

2026-02-06
