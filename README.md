# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/76096bf3-c8e5-42ba-a837-9de1d7fbe278

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/76096bf3-c8e5-42ba-a837-9de1d7fbe278) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/76096bf3-c8e5-42ba-a837-9de1d7fbe278) and click on Share -> Publish.

## Firebase configuration

- Create a Firebase Realtime Database and copy its base URL (ending with `.firebasedatabase.app`).
- Update `.env` with `VITE_FIREBASE_DB_URL="<your database url>"`. For local testing you can point to the same production instance or a local emulator.
- Set `VITE_CHECKIN_SECRET` to the shared secret used to sign QR codes so that check-ins can be validated on the client.
- Running `npm run build` will compile the frontend; no additional backend migrations are required.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## In-app QR check-in & map links

- ???????????????? "????????????? QR" ??????????????? Browser API (BarcodeDetector) ????????????????????????? ???????????????????????????????????????????????????????????
- ?????????????????????????? Google Maps ??????????????? ??????????????????????
