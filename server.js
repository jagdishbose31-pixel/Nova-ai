const express = require("express");
const https = require("https");

const app = express();

app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY?.trim();

console.log("OPENROUTER KEY LOADED:", !!API_KEY);

app.get("/api/test", (req, res) => {
  res.json({ status: "NOVA_SERVER_OK" });
});

app.get("/api/auth-test", async (req, res) => {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + API_KEY
      }
    });

    const d = await r.json();

    console.log("AUTH TEST STATUS:", r.status);
    console.log("AUTH TEST RESPONSE:", JSON.stringify(d).slice(0, 500));

    res.json({
      status: r.status
    });
  } catch (e) {
    console.error("AUTH TEST ERROR:", e);
    res.status(500).json({
      error: e.message
    });
  }
});

app.get("/api/chat-test", (req, res) => {
  const body = JSON.stringify({
    model: "openrouter/free",
    messages: [
      {
        role: "user",
        content: "Say hello"
      }
    ]
  });

  const request = https.request(
    {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    },
    (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        console.log("HTTPS TEST STATUS:", response.statusCode);
        console.log(
          "HTTPS TEST RESPONSE:",
          data.slice(0, 1000)
        );

        res.status(response.statusCode).send(data);
      });
    }
  );

  request.on("error", (error) => {
    console.error("HTTPS TEST ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  });

  request.write(body);
  request.end();
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "Message nahi mila"
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY missing"
      });
    }

    const authHeader = "Bearer " + API_KEY;

    console.log(
      "SENDING REQUEST TO OPENROUTER, KEY EXISTS:",
      !!API_KEY
    );

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "HTTP-Referer": "https://nova-ai-2w2n.onrender.com",
          "X-Title": "NOVA AI"
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("OPENROUTER STATUS:", response.status);
    console.log(
      "OPENROUTER RESPONSE:",
      JSON.stringify(data).slice(0, 1000)
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter error"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "AI se response nahi mila.";

    res.json({
      reply: reply
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("NOVA AI server started on port " + PORT);
});
