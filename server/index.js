const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});



const app = express();
const upload = multer({ dest: "uploads/" });

app.get('/', (req, res) => {
    res.send("Hey I m Shivanshi");
})


app.post('/upload', upload.single("pdf"), async (req, res) => {

    let parser;

    try {
        if (!req.file) {
            return res.status(400).send("Please upload a PDF");
        }

        console.log("1. PDF uploaded");
        // Read PDF as binary data
        const dataBuffer = fs.readFileSync(req.file.path);
        console.log("2. PDF read");
        // Create PDF parser
        parser = new PDFParse({ data: dataBuffer });

        // Extract text
        const pdfData = await parser.getText();
        console.log("3. Text extracted");

        // console.log(pdfData.text);

        // // Send extracted text to Postman
        // return res.status(200)
        //           .type("text/plain")
        //           .send(pdfData.text);

        // semantic chunking character wise
        function splitIntoChunks(text, chunkSize = 300, overlap = 50) {
            const chunks = [];

            for (let i = 0; i < text.length; i += chunkSize - overlap) {
                const chunk = text.slice(i, i + chunkSize);

                if (chunk.trim()) {
                    chunks.push(chunk);
                }
            }

            return chunks;
        }

        const text = pdfData.text;

        const chunks = splitIntoChunks(text, 300, 50);
        const fullText = chunks.join("\n");
        console.log("4. Chunks created:", chunks.length);
        console.log("5. Sending request to Gemini...");

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL,
            contents: `Explain this PDF content in simple words:
            ${fullText}`,
        });

        console.log("2. Gemini response received!");
        console.log(chunks);
        return res.send(response.text);
    } catch (error) {

        console.log("Status:", error.status);
        console.log("Message:", error.message);
        console.log("Details:", error.errorDetails);

        // return res.status(500).send("Gemini API failed");
        console.error(error);

        if (error.status === 503) {
            return res.status(503).send(
                "Gemini is temporarily unavailable. Please try again later."
            );
        }
        return res.status(500).send("Error reading PDF");

    } finally {

        // Release parser resources
        if (parser) {
            await parser.destroy();
        }

    }
});


app.listen(3000, () => {
    console.log("Server is running on port 3000");
})