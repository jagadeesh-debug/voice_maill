const express = require('express');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const client = new SpeechClient();

app.post('/stream', upload.single('file'), async (req, res) => {
    try {
        const audioBlob = req.file.buffer;

        const request = {
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
            interimResults: true,
        };

        const recognizeStream = client.streamingRecognize(request)
            .on('data', (data) => {
                const transcript = data.results[0]?.alternatives[0]?.transcript;
                if (transcript) {
                    res.write(`${transcript}\n`);
                }
            })
            .on('error', (error) => {
                console.error("Error processing audio: ", error);
                res.status(500).send("Internal Server Error");
            })
            .on('end', () => {
                res.end();
            });

        recognizeStream.write(audioBlob);
        recognizeStream.end();
    } catch (error) {
        console.error("Error processing audio: ", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(3001, () => console.log('Server running on port 3001'));
