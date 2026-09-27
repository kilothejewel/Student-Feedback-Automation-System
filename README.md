# Student Feedback Automation System

A feedback system for a training company. Students rate their course through a React web form, and an n8n workflow automatically validates each submission, flags poor ratings, stores the feedback in Google Sheets and emails the student a thank-you. No one has to copy responses by hand.

## How it works

```
React form ──POST JSON──▶ n8n Webhook
                              │
                     Validate Input ── invalid ──▶ 400 response (form shows an error)
                              │ valid
                     Is Rating <= 2?
                     ├─ yes ▶ status = "🚨 Needs Attention"
                     └─ no  ▶ status = "✅ Satisfactory"
                              │
                     Append row to Google Sheets
                              │
                     Send thank-you email to the student
                              │
                     200 response (form shows the thank-you screen)
```

1. The student fills in their name, email, course, a 1–5 star rating and a message. The form checks everything before sending.
2. The form sends the answers as JSON to an n8n webhook using the Fetch API.
3. n8n checks that every field is present, the email looks valid and the rating is between 1 and 5.
4. Ratings of 2 or lower are marked **Needs Attention**; 3 and above are marked **Satisfactory**.
5. The feedback and its status are added as a new row in Google Sheets.
6. The student receives a personalised thank-you email.
7. n8n replies to the form, which shows a thank-you screen (or an error message if something went wrong).

## Features

- **Responsive form** that works on desktop and mobile, with automatic light and dark mode
- **Client-side validation** with clear, per-field error messages
- **Accessible star rating** with labels (Poor to Excellent) and keyboard support
- **Server-side validation** in n8n, returning a 400 error for missing or invalid data
- **Conditional logic** that tags low ratings for follow-up
- **Google Sheets storage** for every submission
- **Automated thank-you emails**
- **Webhook settings panel** for pointing the form at a different n8n URL without restarting

## Tech stack

| Part | Tool |
| --- | --- |
| Front end | React 19, Vite 8 |
| Linting | Oxlint |
| Automation | n8n |
| Storage | Google Sheets |
| Notifications | Email (SMTP, e.g. Gmail) |

## Project structure

```
├── index.html                      # HTML shell that loads the React app
├── public/
│   └── favicon.svg                 # Browser tab icon
├── src/
│   ├── main.jsx                    # Starts React and loads the styles
│   ├── App.jsx                     # Page layout
│   ├── index.css                   # All styles (colour tokens, light/dark mode)
│   └── components/
│       ├── FeedbackForm.jsx        # The form: state, validation, submission
│       └── StarRating.jsx          # 1–5 star rating input
├── student_feedback_workflow.json  # Exported n8n workflow (import this into n8n)
├── .env.example                    # Template for your environment variables
├── package.json                    # Scripts and dependencies
└── vite.config.js                  # Vite configuration
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+
- An [n8n](https://n8n.io/) instance: local (below) or n8n Cloud
- A Google account (for Google Sheets and sending email)

### 1. Install and configure the front end

```bash
git clone https://github.com/kilothejewel/Student-Feedback-Automation-System.git
cd Student-Feedback-Automation-System
npm install
cp .env.example .env
```

Open `.env` and set `VITE_N8N_WEBHOOK_URL` to your n8n webhook URL (see step 3).

### 2. Start n8n

Run it locally with either of these, then open http://localhost:5678:

```bash
npx n8n
# or with Docker
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

### 3. Set up the workflow

1. **Create the Google Sheet.** Make a new spreadsheet with this header row in the first sheet:

   | studentName | email | courseName | rating | status | message | submittedAt |
   | --- | --- | --- | --- | --- | --- | --- |

2. **Import the workflow.** In n8n, go to **Workflows → Import from File** and choose `student_feedback_workflow.json`.
3. **Connect Google Sheets.** Open the **Google Sheets** node, add your Google credential and select your spreadsheet.
4. **Connect email.** Open the **Send Thank You Email** node and add an SMTP credential. For Gmail, use host `smtp.gmail.com`, port `465`, SSL on, and a [Google app password](https://support.google.com/accounts/answer/185833) (your normal password won't work). Set the **From** address to your own email.
5. **Activate the workflow** with the toggle in the top-right corner.
6. **Copy the production webhook URL** from the **Webhook Trigger** node (it ends in `/webhook/student-feedback`) into `VITE_N8N_WEBHOOK_URL` in your `.env`.

### 4. Run the app

```bash
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173) and submit some feedback. You should see a new row in your sheet and a thank-you email in your inbox.

> **Tip:** you can also change the webhook URL at runtime using **Webhook settings** below the form. It's saved in your browser.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build an optimised production version into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code with Oxlint |

## Data sent to the webhook

The form sends a `POST` request with this JSON body:

```json
{
  "studentName": "Jane Doe",
  "email": "jane.doe@example.com",
  "courseName": "Python for Data Science",
  "rating": 4,
  "message": "Clear explanations and great hands-on labs.",
  "submittedAt": "2026-09-27T10:00:00.000Z"
}
```

In n8n these fields arrive under `$json.body`, for example `$json.body.rating`.

| Response | Meaning |
| --- | --- |
| `200` | Feedback stored and email sent. The form shows the thank-you screen. |
| `400` | Missing or invalid fields. The form asks the student to review their answers. |
| Anything else / no response | The form shows a "couldn't send" message. |

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| Form says it couldn't send your feedback | n8n isn't running, the workflow isn't active, or the webhook URL is wrong. Check **Webhook settings** below the form. |
| It works once, then stops | You're using the test URL (`/webhook-test/...`), which only listens once. Activate the workflow and use the production URL (`/webhook/...`). |
| Every submission returns 400 | Workflow expressions must read from `$json.body`, not `$json`. |
| CORS error in the browser console | Make sure the Webhook node's **Allowed Origins** option is `*` or your app's URL. |
| Sheet rows are empty or misaligned | The sheet's header row must match the column names above exactly. |
| No email arrives | Check the SMTP credential (app password for Gmail) and your spam folder. |

## Contributing

Contributions are welcome, whether it's a bug fix, a new feature or better docs.

### Reporting a bug or suggesting a feature

Open an [issue](https://github.com/kilothejewel/Student-Feedback-Automation-System/issues) and include:

- what you expected to happen and what actually happened
- steps to reproduce it
- screenshots, browser console errors or the failing n8n execution, if relevant

### Making a change

1. **Fork** the repository and clone your fork.
2. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b fix/email-validation
   ```
   Use prefixes like `feat/`, `fix/` or `docs/`.
3. **Set up the project** by following [Getting started](#getting-started).
4. **Make your change.** Keep pull requests focused on one thing.
5. **Check your work:**
   ```bash
   npm run lint
   npm run build
   ```
   Then test the full flow in the browser: submit a high and a low rating and confirm the sheet row and email.
6. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/), as this repo already does:
   ```
   feat: add Slack alert for low ratings
   fix: show error when webhook returns 500
   docs: explain SMTP setup
   ```
7. **Push** your branch and open a **pull request** against `main`. Describe what changed, why, and how you tested it. Add screenshots for any UI change.

### Guidelines

- **Code style:** React function components with hooks. Put colours, spacing and radii in the CSS variables at the top of `src/index.css` instead of hard-coding values.
- **Accessibility:** every input needs a visible label, and anything clickable must work with the keyboard.
- **Changing the workflow:** edit it in n8n, then export it (**⋯ → Download**) and replace `student_feedback_workflow.json`. Keep node names unchanged unless you update the connections, and never commit credentials. n8n stores those separately, so exported files only contain credential names.
- **Secrets:** never commit your `.env` file. Add new environment variables to `.env.example` with a placeholder value.

## License

This project doesn't have a license yet, so all rights are reserved by the author. If you'd like to reuse the code, please open an issue first.