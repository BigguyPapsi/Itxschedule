// สคริปต์ deploy เว็บขึ้น GitHub Pages
//
// ไม่ใช้ package `gh-pages` เพราะตอนที่ branch gh-pages ยังไม่มี มันจะสร้าง branch จาก main
// แล้วลาก .gitignore / .env / .npmrc ติดไปด้วย (ขั้นตอน remove ของมัน glob ไม่ติด dotfile)
// พอ .gitignore ที่มี `node_modules/` อยู่ใน branch ปลายทาง `git add` จะข้าม
// dist/assets/node_modules/** ทั้งก้อน = ไฟล์ฟอนต์ .ttf (Ionicons, NotoSansLao) ไม่ถูก push
// → บนเว็บจริงฟอนต์ลาวและไอคอนหาย แต่ตอน dev ปกติ
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const branch = "gh-pages";

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("ไม่พบ dist/index.html — รัน `npm run build:web` ก่อน");
  process.exit(1);
}

const git = (args, cwd) => execFileSync("git", args, { cwd, stdio: "inherit" });
const remote = execFileSync("git", ["remote", "get-url", "origin"], {
  cwd: root,
  encoding: "utf8",
}).trim();

// GitHub Pages จะไม่ serve โฟลเดอร์ที่ขึ้นต้นด้วย _ ถ้าไม่ปิด Jekyll (bundle อยู่ใน _expo/)
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

const dotGit = path.join(dist, ".git");
fs.rmSync(dotGit, { recursive: true, force: true });
try {
  git(["init", "-q"], dist);
  git(["checkout", "-q", "-B", branch], dist);
  // -f เพื่อไม่ให้ global gitignore ของเครื่องมากรอง node_modules ออกอีก
  git(["add", "-A", "-f", "."], dist);
  git(["commit", "-q", "-m", "Deploy web build"], dist);
  git(["push", "-q", "-f", remote, `${branch}:${branch}`], dist);
} finally {
  fs.rmSync(dotGit, { recursive: true, force: true });
}

console.log(`Published dist/ -> ${branch}`);
