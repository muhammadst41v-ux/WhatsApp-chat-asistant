# ChatBuddy – WhatsApp Assistant Setup Guide

Welcome to **ChatBuddy**, your 24/7 AI WhatsApp assistant for small businesses.
This guide walks you through connecting ChatBuddy to real WhatsApp using the official **Meta WhatsApp Cloud API**.

---

## 1. Quick Architecture Overview

```
[Customer on WhatsApp]
       │
       ▼ (Webhook POST /webhook/whatsapp)
[Meta Cloud API Servers]
       │
       ▼ (Via ngrok tunnel or public domain)
[ChatBuddy Backend (Express + SQLite)]
       │
       ├─► Validates X-Hub-Signature-256
       ├─► Checks Human Takeover flag (if owner is chatting, bot stays silent)
       ├─► Retrieves last 20 messages for context
       ├─► Calls Gemini 2.5 / 3.8 Flash with system prompt & catalog
       ├─► Auto-saves Orders & Bookings to SQLite + decrements product stock
       ├─► Sends customer reply via WhatsApp Cloud API
       └─► Sends notification alert to OWNER_PHONE on new orders/bookings
```

---

## 2. Meta Developer Account Setup

### Step 1: Create a Meta Developer App
1. Go to [Meta for Developers](https://developers.facebook.com/) and log in with your Facebook account.
2. Click **My Apps** in the top right, then click **Create App**.
3. Select **Other** as the use case ➔ Click **Next**.
4. Select **Business** as the app type ➔ Click **Next**.
5. Enter an App Name (e.g. `ChatBuddy Assistant`) and enter your contact email.
6. Connect or select your Meta Business Account (or let Meta create one automatically).
7. Click **Create App**.

---

## 3. Configure WhatsApp Cloud API

### Step 2: Add the WhatsApp Product
1. In your app dashboard, scroll down to the **Add products to your app** section.
2. Find **WhatsApp** and click **Set up**.
3. You will be redirected to the **WhatsApp > API Setup** page.

### Step 3: Get Test Credentials
On the **API Setup** page:
1. **Temporary access token**: Copy this token (`EAA...`). It lasts 24 hours for testing.
2. **Phone number ID**: Copy the number ID (e.g. `105938472918234`).
3. **To Phone Number**: In the "Step 2: Send and receive messages" section, select your personal phone number or add it as a test recipient. Meta will send a 6-digit verification code to your personal WhatsApp to approve it.
4. **App Secret**: Go to **App settings > Basic** in the left sidebar ➔ Click **Show** next to **App secret** and copy it.

---

## 4. Setting up ngrok (Local Webhook Testing)

Because Meta requires a public `https://` endpoint to send webhooks, use **ngrok** to tunnel your local port `3000`:

1. Download and install ngrok from [ngrok.com](https://ngrok.com/download) or install via terminal:
   ```bash
   npm install -g ngrok
   ```
2. Authenticate ngrok (one-time):
   ```bash
   ngrok config add-authtoken <your-ngrok-authtoken>
   ```
3. Start the tunnel on port 3000:
   ```bash
   ngrok http 3000
   ```
4. Copy the forwarding HTTPS URL provided by ngrok (e.g., `https://abc1-23-45-67.ngrok-free.app`).

---

## 5. Configure Webhook in Meta Dashboard

1. In the Meta App Dashboard, navigate to **WhatsApp > Configuration** in the left sidebar.
2. Find the **Webhook** section and click **Edit**.
3. Fill in the fields:
   - **Callback URL**: `https://<your-ngrok-url>/webhook/whatsapp`
     *(Example: `https://abc1-23-45-67.ngrok-free.app/webhook/whatsapp`)*
   - **Verify Token**: Any custom string of your choice (must match `WHATSAPP_VERIFY_TOKEN` in your `.env`, e.g. `chatbuddy_secure_verify_token_2026`).
4. Click **Verify and Save**.
   - *ChatBuddy will receive Meta's GET verification handshake and immediately respond with the `hub.challenge`.*
5. Under **Webhook fields**, click **Manage**.
6. Find the **messages** row and click **Subscribe**.

---

## 6. Environment Variables Configuration

Create a `.env` file in the root folder (or configure in your hosting platform) with the following variables:

```ini
# Gemini API Key for intelligent WhatsApp chat processing
GEMINI_API_KEY="AIzaSy..."

# Meta WhatsApp Cloud API credentials
WHATSAPP_TOKEN="EAAG..."
WHATSAPP_PHONE_NUMBER_ID="105938472918234"
WHATSAPP_VERIFY_TOKEN="chatbuddy_secure_verify_token_2026"
WHATSAPP_APP_SECRET="d1a89c..."

# Business Owner WhatsApp phone for order & booking notifications (E.164 format, e.g. +1...)
OWNER_PHONE="+15551234567"

# Session & Webhook security
SESSION_SECRET="chatbuddy_secure_session_token_123"

# Application public URL
APP_URL="https://your-domain.com"
```

---

## 7. Moving from Temporary to Permanent Token

Temporary tokens expire after 24 hours. For 24/7 production uptime, create a **System User Token**:

1. Go to **Meta Business Suite > Business Settings** (`business.facebook.com/settings`).
2. Under **Users**, click **System Users** ➔ Click **Add**.
3. Name it `ChatBuddy-Bot` and set the role to **Admin**.
4. Click **Add Assets** ➔ Select **Apps** ➔ Select your WhatsApp App ➔ Enable **Full control**.
5. Click **Generate New Token**:
   - Select your WhatsApp app.
   - Select token expiration: **Never**.
   - Check permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
6. Copy the generated permanent token and paste it into `WHATSAPP_TOKEN` in your `.env`.

---

## 8. Testing Your Assistant

1. **Demo Mode (No Meta setup required)**:
   - If WhatsApp credentials are not yet added, ChatBuddy runs in **Demo Mode**.
   - Open the **Test Chat** page in the dashboard to simulate customer chats with full Gemini reasoning, live inventory checking, and order extraction!
2. **Live WhatsApp Testing**:
   - Send a WhatsApp message from your approved phone to the Meta test phone number.
   - Example prompts:
     - *"Do you have Velvet Strawberry Cake in stock?"*
     - *"What are your delivery charges to Downtown?"*
     - *"I would like to order 1 Velvet Strawberry Cake. My name is Sarah, phone 555-234-8899, deliver to 48 Oak Ave."*
   - Watch the assistant reply on your phone within seconds, see the order appear in the **Orders** tab, and observe stock automatically decrement in the **Products** tab!
3. **Conversations & Human Takeover**:
   - Open the **Conversations** tab in the dashboard to see all active customer chats.
   - Toggle **Human Takeover** if you wish to pause the AI for a specific customer and respond manually directly from the dashboard!
