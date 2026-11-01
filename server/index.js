const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

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

        // Read PDF as binary data
        const dataBuffer = fs.readFileSync(req.file.path);

        // Create PDF parser
        parser = new PDFParse({ data: dataBuffer });

        // Extract text
        const pdfData = await parser.getText();

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

        console.log(chunks);

        return res.json({
            totalChunks: chunks.length,
            chunks
        });

        console.log(chunks);

        return res.json({
            totalChunks: chunks.length,
            chunks,
        });
    } catch (error) {

        console.error(error);
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