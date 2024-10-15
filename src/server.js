import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as deepl from "deepl-node";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());

const authKey = process.env.DEEPL_API_KEY || "";

const translator = new deepl.Translator(authKey);

app.post("/api/translate", async (req, res) => {
  const { text, sourceLang = null, targetLang } = req.body;

  console.log(text);

  try {
    const result = await translator.translateText(text, sourceLang, targetLang);
    console.log("translated text:", result.text);

    res.json(result.text);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Ошибка на сервере" });
  }
});

app.get("/proxy/mp3/:filename", async (req, res) => {
  const { filename } = req.params;
  const targetUrl = `https://dl01.dtmp3.pw/mp3/${filename}`;

  const rangeHeader = req.get("Range");
  const fetchOptions = {
    headers: {
      Range: rangeHeader || "",
      Referer: "https://musik-app-green.vercel.app",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    },
  };

  try {
    const fetchRes = await fetch(targetUrl, fetchOptions);

    if (!fetchRes.ok) {
      return res.status(500).send("Failed to fetch audio file");
    }

    const responseHeaders = {
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Type": "audio/mpeg",
    };

    let start = 0;
    let end = parseInt(fetchRes.headers.get("content-length"), 10) - 1;
    let contentLength = end - start + 1;

    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (rangeMatch) {
        start = parseInt(rangeMatch[1], 10);
        end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : end;
        contentLength = end - start + 1;

        responseHeaders[
          "Content-Range"
        ] = `bytes ${start}-${end}/${fetchRes.headers.get("content-length")}`;
        responseHeaders["Content-Length"] = contentLength;
        res.status(206);
      }
    }

    res.set(responseHeaders);

    if (rangeHeader) {
      const rangeFetchOptions = {
        headers: {
          Range: `bytes=${start}-${end}`,
          Referer: "https://musik-app-green.vercel.app",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        },
      };

      const rangeFetchRes = await fetch(targetUrl, rangeFetchOptions);

      if (!rangeFetchRes.ok) {
        return res.status(500).send("Failed to fetch audio file");
      }

      rangeFetchRes.body.pipe(res);
    } else {
      fetchRes.body.pipe(res);
    }
  } catch (error) {
    console.error("Error fetching audio file:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
