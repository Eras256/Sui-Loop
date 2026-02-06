/**
 * SuiLoop Voice Service (Multimodal Interface)
 * 
 * Provides Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities.
 * - Transcribe user audio commands (Whisper)
 * - Synthesize agent responses (TTS)
 * - Enable hands-free operation
 * 
 * Inspired by OpenClaw's voice interaction.
 */

import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';

export class VoiceService {
    private openai: OpenAI;
    private tempDir: string;

    constructor(apiKey?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY || 'dummy-key',
            dangerouslyAllowBrowser: true // Just in case, broadly compatible
        });

        this.tempDir = path.join(process.cwd(), '.suiloop', 'temp', 'audio');
        fs.ensureDirSync(this.tempDir);
    }

    /**
     * Transcribe Audio File (STT)
     * Uses OpenAI Whisper model
     */
    async transcribeAudio(audioBuffer: Buffer, filename: string = 'input.webm'): Promise<string> {
        try {
            const tempPath = path.join(this.tempDir, filename);
            await fs.writeFile(tempPath, audioBuffer);

            const fileStream = fs.createReadStream(tempPath);

            const transcription = await this.openai.audio.transcriptions.create({
                file: fileStream,
                model: "whisper-1",
            });

            // Cleanup
            await fs.remove(tempPath);

            return transcription.text;
        } catch (error) {
            console.error('Transcription failed:', error);
            throw new Error('Failed to transcribe audio command.');
        }
    }

    /**
     * Synthesize Text to Speech (TTS)
     * Uses OpenAI TTS model
     */
    async synthesizeSpeech(text: string): Promise<Buffer> {
        try {
            const mp3 = await this.openai.audio.speech.create({
                model: "tts-1",
                voice: "alloy",
                input: text,
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());
            return buffer;
        } catch (error) {
            console.error('Synthesis failed:', error);
            // In case of error (e.g. no API Key), return empty or throw
            throw new Error('Failed to synthesize speech.');
        }
    }
}

// Singleton Export
let voiceService: VoiceService | null = null;

export function initializeVoiceService(): VoiceService {
    if (!voiceService) {
        voiceService = new VoiceService();
        console.log('🗣️ Voice Service initialized');
    }
    return voiceService;
}

export function getVoiceService(): VoiceService | null {
    return voiceService;
}
