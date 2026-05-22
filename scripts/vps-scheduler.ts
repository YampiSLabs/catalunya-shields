import { execSync } from "child_process";
import http from "http";

const PORT = process.env.PORT || 3000;
const GITHUB_PAT = process.env.GITHUB_PAT;
const REPO_URL = "https://github.com/YampiSLabs/catalunya-shields.git";

// Simple healthcheck server for Dokploy
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "healthy", time: new Date().toISOString() }));
});

server.listen(PORT, () => {
  console.log(`Healthcheck server listening on port ${PORT}`);
});

// Scheduler function
async function runUpdate() {
  console.log(`[${new Date().toISOString()}] Starting automated update...`);
  try {
    // Configure Git credentials using GITHUB_PAT
    if (GITHUB_PAT) {
      const authenticatedUrl = REPO_URL.replace("https://", `https://oauth2:${GITHUB_PAT}@`);
      execSync(`git remote set-url origin "${authenticatedUrl}"`, { stdio: "inherit" });
      execSync(`git config --global user.name "YampiSLabs Bot"`, { stdio: "inherit" });
      execSync(`git config --global user.email "bot@yampi.eu"`, { stdio: "inherit" });
    } else {
      console.warn("WARNING: GITHUB_PAT not set. Push might fail if repository is private or requires auth.");
    }

    // Pull latest
    console.log("Pulling latest...");
    execSync("git pull origin master", { stdio: "inherit" });

    // Run the download & optimize pipeline
    console.log("Normalizing...");
    execSync("pnpm normalize", { stdio: "inherit" });

    console.log("Downloading 10 shields...");
    execSync("pnpm download:commons -- --limit=10", { stdio: "inherit" });

    console.log("Optimizing...");
    execSync("pnpm optimize:shields", { stdio: "inherit" });

    console.log("Generating outputs...");
    execSync("pnpm generate:outputs", { stdio: "inherit" });

    console.log("Running tests...");
    execSync("pnpm test run", { stdio: "inherit" });

    // Git commit & push
    const status = execSync("git status --porcelain").toString().trim();
    if (status) {
      console.log("Changes detected. Committing and pushing...");
      execSync("git add .", { stdio: "inherit" });
      const commitMsg = `feat(auto): download and optimize new municipal shields - ${new Date().toISOString().split("T")[0]}`;
      execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });
      execSync("git push origin master", { stdio: "inherit" });
      console.log("Updates pushed successfully!");
    } else {
      console.log("Everything is up to date.");
    }
  } catch (error: any) {
    console.error("Error during automated update:", error.message || error);
  }
}

// Calculate time until next midnight to run exactly every 24h
function scheduleNextRun() {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setDate(now.getDate() + 1);
  nextRun.setHours(0, 0, 0, 0); // Next midnight

  const msToNextRun = nextRun.getTime() - now.getTime();
  console.log(`Next run scheduled in ${Math.round(msToNextRun / 1000 / 60)} minutes (at ${nextRun.toISOString()})`);

  setTimeout(() => {
    runUpdate().then(scheduleNextRun);
  }, msToNextRun);
}

// Trigger initial update on startup and start scheduler
console.log("Scheduler started. Running initial update...");
runUpdate().then(scheduleNextRun);
