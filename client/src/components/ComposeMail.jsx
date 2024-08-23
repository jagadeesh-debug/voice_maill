import { useState, useRef } from 'react';
import { Dialog, styled, Typography, Box, InputBase, TextField, Button } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Close, DeleteOutline } from '@mui/icons-material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import MicIcon from '@mui/icons-material/Mic';
import useApi from '../hooks/useApi';
import { API_URLS } from '../services/api.urls';
import { AssemblyAI } from 'assemblyai';
import '../App.css'
const dialogStyle = {
    width: '80%',
    maxWidth: '100%',
    maxHeight: '100%',
    boxShadow: 'none',
    borderRadius: '10px 10px 0 0',
};

const Header = styled(Box)`
    display: flex;
    justify-content: space-between;
    padding: 10px 15px;
    background: #f2f6fc;
    & > p {
        font-size: 14px;
        font-weight: 500;
    }
`;

const RecipientWrapper = styled(Box)`
    display: flex;
    flex-direction: column;
    padding: 0 15px;
    & > div {
        font-size: 14px;
        border-bottom: 1px solid #F5F5F5;
        margin-top: 10px;
    }
`;

const Footer = styled(Box)`
    display: flex;
    justify-content: space-between;
    padding: 10px 15px;
    align-items: center;
`;

const SendButton = styled(Button)`
    background: #0B57D0;
    color: #fff;
    font-weight: 500;
    text-transform: none;
    border-radius: 18px;
    width: 100px;
`;

const actionbtnstyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
};

const ComposeMail = ({ open, setOpenDrawer }) => {
    const [data, setData] = useState({ to: '', subject: '', body: '' });
    const sentEmailService = useApi(API_URLS.saveSentEmails);
    const saveDraftService = useApi(API_URLS.saveDraftEmails);
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false); // New state for playing audio
    const client = new AssemblyAI({
        apiKey: 'bceb664d8ac14c1980be2beb4ed2eb5f'
    })
    const mediaStream = useRef(null);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);
    const synthRef = useRef(window.speechSynthesis);

    const config = {
        Username: process.env.REACT_APP_USERNAME,
        Password: process.env.REACT_APP_PASSWORD,
        Host: 'smtp.elasticemail.com',
        Port: 2525,
    };

    const onValueChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const sendEmail = async (e) => {
        e.preventDefault();

        if (window.Email) {
            try {
                const message = await window.Email.send({
                    ...config,
                    To: data.to,
                    From: "jaggurockz4892@gmail.com",
                    Subject: data.subject,
                    Body: data.body
                });
                alert(message);

                const payload = {
                    to: data.to,
                    from: "jaggurockz4892@gmail.com",
                    subject: data.subject,
                    body: data.body,
                    date: new Date(),
                    image: '',
                    name: 'Your Name',
                    starred: false,
                    type: 'sent'
                };

                await sentEmailService.call(payload);

                if (!sentEmailService.error) {
                    setOpenDrawer(false);
                    setData({ to: '', subject: '', body: '' });
                } else {
                    console.error("Error sending email: ", sentEmailService.error);
                }
            } catch (error) {
                console.error("Error sending email: ", error);
            }
        }
    };

    const closeComposeMail = async (e) => {
        e.preventDefault();

        const payload = {
            to: data.to,
            from: "jaggurockz4892@gmail.com",
            subject: data.subject,
            body: data.body,
            date: new Date(),
            image: '',
            name: 'Your Name',
            starred: false,
            type: 'drafts'
        };

        try {
            await saveDraftService.call(payload);

            if (!saveDraftService.error) {
                setOpenDrawer(false);
                setData({ to: '', subject: '', body: '' });
            } else {
                console.error("Error saving draft: ", saveDraftService.error);
            }
        } catch (error) {
            console.error("Error saving draft: ", error);
        }
    };

    // Function to handle audio capture from microphone
    const startRecording = async () => {
        if (!recording) {
            setRecording(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia(
                    { audio: true }
                );
                mediaStream.current = stream;
                mediaRecorder.current = new MediaRecorder(stream);
                mediaRecorder.current.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.current.push(e.data);
                    }
                };
                mediaRecorder.current.onstop = async () => {
                    const recordedBlob = new Blob(
                        chunks.current, { type: 'audio/webm' }
                    );
                    const url = URL.createObjectURL(recordedBlob);
                    const params = {
                        audio: recordedBlob,
                    }
                    const transcript = await client.transcripts.transcribe(params)
                    console.log(transcript);
                    console.log(transcript.text);
                    setData(prev => ({
                        ...prev,
                        body: prev.body + transcript.text,
                    }))
                    chunks.current = [];
                };
                mediaRecorder.current.start();
            } catch (error) {
                console.error('Error accessing microphone:', error);
            }
        } else {
            setRecording(false);
            if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
                mediaRecorder.current.stop();
            }
            if (mediaStream.current) {
                mediaStream.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        }
    };

    // Function to handle text-to-speech and stop it when clicked again
    const handleTextToSpeech = () => {
        if ('speechSynthesis' in window) {
            if (playing) {
                synthRef.current.cancel();
                setPlaying(false);
            } else {
                const utterance = new SpeechSynthesisUtterance(data.body);
                utterance.onend = () => setPlaying(false); // Reset playing state when audio ends
                synthRef.current.speak(utterance);
                setPlaying(true);
            }
        } else {
            console.error("Text-to-speech is not supported in this browser.");
        }
    };

    return (
        <Dialog
            open={open}
            PaperProps={{ sx: dialogStyle }}
        >
            <Header>
                <Typography>New Message</Typography>
                <Close fontSize="small" onClick={(e) => closeComposeMail(e)}  cursor="pointer"/>
            </Header>
            <RecipientWrapper>
                <InputBase placeholder='Recipients' name="to" onChange={onValueChange} value={data.to} />
                <InputBase placeholder='Subject' name="subject" onChange={onValueChange} value={data.subject} />
            </RecipientWrapper>
            <TextField
                multiline
                rows={20}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                name="body"
                onChange={onValueChange}
                value={data.body}
            />
            <Footer>
                <div style={actionbtnstyle}>
                    <SendButton onClick={sendEmail}>Send</SendButton>
                    <AttachmentIcon />
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <MicIcon onClick={startRecording} style={{ cursor: 'pointer', color: recording ? 'red' : 'inherit' }} />
                        {recording && <div className="pulse-animation"></div>}
                    </div>
                    <VolumeUpIcon 
                        onClick={handleTextToSpeech} 
                        className={playing ? "rotate-animation" : ""} 
                        style={{ cursor: 'pointer' }} 
                    />
                </div>
                <DeleteOutline onClick={() => setOpenDrawer(false)} />
            </Footer>
        </Dialog>
    );
};

export default ComposeMail;
