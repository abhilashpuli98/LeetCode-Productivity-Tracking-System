<h1 align="center">
  <a href="https://chromewebstore.google.com/detail/leetcode-tracker/bnhnpmglielpbmnnhhbcfnljhijfppbm">LeetCode Productivity Tracking System</a> -Automatically Securely synchronize accepted LeetCode submissions to GitHub
  <br>
  <br>
</h1>

<div align="center">
  <a href="" rel="Download leetcode tracker extension"><img src="https://a0.anyrgb.com/pngimg/1382/116/chrome-web-store-chromebook-preview-google-chrome-computer-icon-google-apple-android-computer-software-material.png" alt="Leetcode tracker extension chrome store" width="300" /></a>
</div>



<h1 align="center">
  LeetCode Productivity Tracker
  <br>
</h1>

<div align="center">
  <strong>Status:</strong> Local / Development Version  
  <br>
  <em>Chrome Web Store publication planned</em>
</div>

---

## What is LeetCode Productivity Tracker?

<p>
LeetCode Productivity Tracker is a Chrome extension that automatically pushes your accepted LeetCode solutions to a GitHub repository once all test cases pass.
</p>

<p>
It is designed to help students and developers maintain a structured, consistent, and verifiable record of their problem-solving progress without manual effort.
</p>

---

## Why LeetCode Productivity Tracker?

<p>
<strong>1.</strong> Recruiters increasingly evaluate GitHub activity to assess consistency, problem-solving discipline, and technical growth.
GitHub has become a primary technical portfolio for developers, especially students preparing for internships and entry-level roles.
This extension ensures your practice translates directly into visible contributions.
</p>

<p>
<strong>2.</strong> Managing LeetCode solutions manually across repositories is time-consuming and error-prone.
LeetCode Productivity Tracker automates the entire workflow, allowing you to focus on learning and problem solving rather than repository management.
</p>

---

## How does LeetCode Productivity Tracker work?

<ol>
  <li>Install the extension locally using Chrome Developer Mode.</li>
  <li>Authenticate securely using GitHub OAuth.</li>
  <li>Select or configure a target GitHub repository.</li>
  <li>Solve problems on LeetCode.</li>
  <li>When a solution is accepted, it is automatically committed and pushed to GitHub.</li>
</ol>

---

## Why was this project built?

<p>
For students and early-career developers, securing technical interviews is often more challenging than clearing them.
Consistent problem solving and a visible public portfolio significantly improve interview shortlisting chances.
</p>

<p>
This project was built to bridge the gap between daily practice and professional visibility.
While several similar tools exist, many are outdated or incompatible with recent LeetCode interface changes.
This project focuses on maintainability, clarity, and practical student use.
</p>

---

## How to set up LeetCode Productivity Tracker for local development

<ol>
  <li>Fork this repository and clone it to your local machine.</li>
  <li>Create a new file named <code>environment.js</code> in the project root.</li>
  <li>Add the following configuration and replace <code>CLIENT_ID</code> and <code>CLIENT_SECRET</code> with your GitHub OAuth credentials:</li>
</ol>

<pre>
export const ENV = {
  URL: "https://github.com/login/oauth/authorize",
  ACCESS_TOKEN_URL: "https://github.com/login/oauth/access_token",
  REDIRECT_URL: "https://github.com/",
  REPOSITORY_URL: "https://api.github.com/repos/",
  USER_INFO_URL: "https://api.github.com/user",
  CLIENT_SECRET: "YOUR_CLIENT_SECRET",
  CLIENT_ID: "YOUR_CLIENT_ID",
  SCOPES: ["repo"],
  HEADER: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};
</pre>

<ol start="4">
  <li>Open <a href="chrome://extensions">chrome://extensions</a> in Chrome.</li>
  <li>Enable Developer Mode using the toggle in the top-right corner.</li>
  <li>Click <strong>Load unpacked</strong>.</li>
  <li>Select the project root directory.</li>
</ol>

<p>
The extension will now be installed and available locally.
</p>

---

## Project Scope and Audience

<p>
This project is primarily intended for:
</p>

<ul>
  <li>Students preparing for technical interviews</li>
  <li>Developers practicing data structures and algorithms</li>
  <li>Anyone seeking automated, consistent GitHub contribution tracking</li>
</ul>

---

## Disclaimer

<p>
This project is not affiliated with or endorsed by LeetCode or GitHub.
It is intended for educational, learning, and personal productivity purposes.
</p>

---

## License

<p>
This project is licensed under the MIT License. Refer to the LICENSE file for details.
</p>

---

## Contributions

Contributions are welcome and encouraged.

If you are a student or developer interested in improving this project, feel free to:
- Report bugs or suggest enhancements via issues
- Improve documentation or code quality
- Add support for additional languages or features
- Submit pull requests for review

Please ensure all contributions follow clean coding practices and include appropriate documentation where necessary.
---

## Connect

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Professional-blue?logo=linkedin)](https://www.linkedin.com/in/abhilash-puli)
[![Medium](https://img.shields.io/badge/Medium-Writing-black?logo=medium)](https://medium.com/@abhilashpuli)
[![Kaggle](https://img.shields.io/badge/Kaggle-Data%20Science-20BEFF?logo=kaggle)](https://www.kaggle.com/sherlock9)
[![GitHub](https://img.shields.io/badge/git.io-Profile-lightgrey?logo=github)](https://abhilashpuli98.github.io)

