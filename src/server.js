import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as deepl from "deepl-node";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());

const authKey = process.env.DEEPL_API_KEY || "";

const translator = new deepl.Translator(authKey);

app.post("/api/translate", async (req, res) => {
  const { text, targetLang } = req.body;

  console.log(text);

  try {
    const result = await translator.translateText(text, null, targetLang);
    console.log("translated text:", result.text);

    res.json(result.text);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Ошибка на сервере" });
  }

  // try {
  //   const response = await fetch("https://api.deepl.com/v2/translate", {
  //     method: "POST",
  //     headers: {
  //       Authorization: `DeepL-Auth-Key ${authKey}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: new URLSearchParams({
  //       text: [text],
  //       target_lang: targetLang,
  //     }),
  //   });

  //   const data = await response.json();
  //   res.json(data); // Отправляем результат на клиент
  // } catch (error) {
  //   console.error("Error:", error);
  //   res.status(500).json({ error: "Ошибка на сервере" });
  // }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
