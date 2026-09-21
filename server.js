const express = require("express");

const app = express();

app.use(express.json());
app.get("/api/test", (req, res) => res.json({status: "NOVA_SERVER_OK"}));
app.use(express.static(__dirname));

const API_KEY = process.env.OPENROUTER_API_KEY;
console.log("OPENROUTER KEY LOADED:", !!API_KEY);

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "Message nahi mila"
      });
    }

    console.log("SENDING REQUEST TO OPENROUTER, KEY EXISTS:", !!API_KEY);
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify({
          model: "openrouter/free",
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

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter error"
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    res.json({
      reply: reply || "AI ne koi reply nahi diya."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server me problem aa gayi."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("NOVA AI server started on port 3000");
});
