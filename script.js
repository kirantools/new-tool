
document.getElementById("checkBtn").addEventListener("click", async () => {
  const input = document.getElementById("usernames").value.trim();
  const usernames = input.split(/\n+/).filter(name => name.length > 0);
  const statusDiv = document.getElementById("status");
  const resultDiv = document.getElementById("result");

  if (usernames.length === 0) {
    statusDiv.innerText = "Please enter at least one username.";
    return;
  }

  statusDiv.innerText = "Checking usernames... Please wait.";
  resultDiv.innerHTML = "";

  try {
    const response = await fetch("/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames }),
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();
    let html = `<p><strong>✅ Active:</strong> ${data.active.length} | <strong>❌ Suspended:</strong> ${data.suspended.length}</p><ul>`;
    data.active.forEach(name => html += `<li class='status active'>✅ ${name}</li>`);
    data.suspended.forEach(name => html += `<li class='status suspended'>❌ ${name}</li>`);
    html += "</ul>";
    resultDiv.innerHTML = html;
    statusDiv.innerText = "Check complete.";
  } catch (err) {
    statusDiv.innerText = "Something went wrong. Try again.";
  }
});
