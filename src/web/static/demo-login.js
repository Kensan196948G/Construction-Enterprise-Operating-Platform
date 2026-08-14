(function () {
  "use strict";

  const form = document.getElementById("demoLoginForm");
  const keyInput = document.getElementById("keyId");
  const secretInput = document.getElementById("secret");
  const submitButton = document.getElementById("demoLoginBtn");
  const quickButton = document.getElementById("demoQuickLoginBtn");
  const error = document.getElementById("demoLoginError");

  if (!form || !keyInput || !secretInput || !submitButton || !quickButton || !error) {
    return;
  }

  if (keyInput.value.trim() !== "" && secretInput.value !== "") {
    quickButton.hidden = false;
    quickButton.addEventListener("click", () => {
      form.requestSubmit();
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    submitButton.disabled = true;
    try {
      const response = await fetch("/api/v1/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId: keyInput.value.trim(),
          secret: secretInput.value,
        }),
      });
      if (!response.ok) {
        error.textContent =
          response.status === 401 ? "認証情報が正しくありません" : "ログインに失敗しました";
        error.hidden = false;
        return;
      }
      const payload = await response.json();
      window.location.href = payload.redirect ?? "/dashboard";
    } catch {
      error.textContent = "通信エラーが発生しました";
      error.hidden = false;
    } finally {
      submitButton.disabled = false;
    }
  });
})();
