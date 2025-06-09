document.addEventListener("DOMContentLoaded", () => {
  const modelSelect = document.getElementById("modelSelect");
  const urlInput = document.getElementById("urlInput");
  const promptInput = document.getElementById("promptInput");
  const submitBtn = document.getElementById("submitBtn");
  const output = document.getElementById("output");
  const modelError = document.getElementById("modelError");
  const urlError = document.getElementById("urlError");

  // Load available Ollama models
  fetch("http://localhost:8080/tags")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch model tags");
      return res.json();
    })
    .then((data) => {
      modelSelect.innerHTML =
        "<option disabled selected>Select a model</option>";
      for (const model of data.models || []) {
        const option = document.createElement("option");
        option.value = model.name;
        option.textContent = model.name;
        modelSelect.appendChild(option);
      }
    })
    .catch((err) => {
      console.error("Error loading models:", err);
      modelSelect.innerHTML = "<option>Error loading models</option>";
    });

  submitBtn.addEventListener("click", () => {
    // Reset errors
    modelError.textContent = "";
    urlError.textContent = "";
    output.textContent = "";

    const url = urlInput.value.trim();
    const model = modelSelect.value;
    const prompt = promptInput.value.trim();

    // Validate YouTube URL
    const urlRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
    if (!url) {
      urlError.textContent = "YouTube URL is required.";
      return;
    } else if (!urlRegex.test(url)) {
      urlError.textContent = "Please enter a valid YouTube URL.";
      return;
    }

    // Validate model
    if (!model || model === "Select a model") {
      modelError.textContent = "Please select an Ollama model.";
      return;
    }

    // Start SSE connection
    submitBtn.disabled = true;
    output.textContent = "Starting transcription...\n";

    const sseURL = `http://localhost:8080/summary?url=${encodeURIComponent(
      url
    )}&model=${encodeURIComponent(model)}${
      prompt ? `&prompt=${encodeURIComponent(prompt)}` : ""
    }`;
    const evtSource = new EventSource(sseURL);

    evtSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        output.textContent += "\n✅ Done.";
        submitBtn.disabled = false;
        evtSource.close();
      } else if (event.data.startsWith("ERROR:")) {
        output.textContent += `\n ${event.data}`;
        submitBtn.disabled = false;
        evtSource.close();
      } else {
        output.textContent += event.data;
      }
      output.scrollTop = output.scrollHeight;
    };

    evtSource.onerror = () => {
      output.textContent += "\nConnection failed or server offline.";
      submitBtn.disabled = false;
      evtSource.close();
    };
  });
});
