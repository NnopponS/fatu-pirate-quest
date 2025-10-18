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

## Supabase migrations

- Run `npm run supabase:migrate` to push the SQL files in `supabase/migrations` to the linked project before deploying.
- `npm run deploy` runs the migration step and then builds the frontend bundle.
- The GitHub Actions workflow at `.github/workflows/deploy.yml` executes the same sequence on every push to `main`. Set a repository secret named `SUPABASE_ACCESS_TOKEN` that contains a Supabase personal access token with database permissions so the workflow can authenticate.
- Locally you can either export `SUPABASE_ACCESS_TOKEN` or sign in once with `npx supabase login`; the script will reuse the CLI session.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
