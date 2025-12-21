---
description: How to deploy your app to Apple TestFlight
---

Getting your app on TestFlight involves turning it from a development project into a standalone "bundle".

## 1. Prerequisites
- **Apple Developer Account**: You MUST have a paid Apple Developer Program membership ($99/year).
- **EAS CLI**: Install the Expo Application Services tool.
  // turbo
  `npm install -g eas-cli`

## 2. Configuration
1. Login to your Expo account:
   `eas login`
2. Configure your project for builds:
   `eas build:configure`
   - Select `ios` when prompted.

## 3. The Build Process
Run the build command:
`eas build -p ios --profile preview` (Internal testing) 
OR 
`eas build -p ios` (For TestFlight/App Store)

- Expo will handle your certificates and provisioning profiles automatically.
- This will take 10-20 minutes on Expo's servers.

## 4. Submitting to TestFlight
Once the build is done, you will get a link to a `.ipa` file.
1. Use **Transporter** (on Mac) or the EAS CLI to upload:
   `eas submit -p ios`
2. Go to [App Store Connect](https://appstoreconnect.apple.com/).
3. Create your app entry.
4. Select the build in the "TestFlight" tab and add internal testers.

## Important: The "Server" Question
- **Metro Server**: You do NOT need your computer or a server running for a TestFlight app. The code is "bundled" inside the app itself.
- **Data Sync**: Currently, your app saves data only on the device. If you want a "server running all the time" so your iPad and Phone share the same meal plan, you need a **Hosted Backend** (like Supabase or Firebase).
