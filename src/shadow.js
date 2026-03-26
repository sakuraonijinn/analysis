// ==UserScript==
// @name         Web Dashboard Injector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Inject a transparent password form to redirect to dashboard
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // === CONFIG ===
  const dashboardUrl = "https://your-web-app-dashboard.com"; // Redirect URL after login
  const triggerElement = document.createElement("div");
  triggerElement.textContent = "🔐 Inject Login Form";
  triggerElement.style.position = "fixed";
  triggerElement.style.top = "10px";
  triggerElement.style.right = "10px";
  triggerElement.style.zIndex = "99998";
  triggerElement.style.cursor = "pointer";
  triggerElement.style.padding = "10px";
  triggerElement.style.background = "transparent";

  // Append trigger button to page
  document.body.appendChild(triggerElement);

  // Overlay UI
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  document.body.appendChild(overlay);

  // Login form inside overlay
  const loginForm = document.createElement("div");
  loginForm.id = "loginForm";
  loginForm.innerHTML = `
    <form id="hiddenForm">
      <input type="text" id="username" placeholder="Username" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <button id="closeBtn">✕</button>
  `;
  overlay.appendChild(loginForm);

  // Show overlay when button is clicked
  triggerElement.addEventListener("click", () => {
    overlay.style.display = "block";
  });

  // Close overlay on X button
  document.getElementById("closeBtn").addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // Handle form submission
  document.getElementById("hiddenForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Redirect to dashboard after login (replace with your web app's auth logic)
    fetch(dashboardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => {
      if (response.ok) {
        overlay.style.display = "none";
        // Redirect to dashboard
        window.location.href = dashboardUrl;
      } else {
        alert("Login failed!");
      }
    });
  });
})();
