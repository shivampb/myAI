export const voiceState = { isVoice: false, isTwoWay: false };

export function initVoiceInput(micBtn, inputEl) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micBtn.style.display = 'none';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; // Stop naturally when the user stops talking
    recognition.interimResults = true; // Stream the text directly into the box in real-time

    let isListening = false;
    let finalTranscript = '';
    let manuallyStopped = false;

    micBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isListening) {
            manuallyStopped = true;
            recognition.stop();
            voiceState.isTwoWay = false;
            return;
        }

        manuallyStopped = false;
        // Native browser voice processing is great when set to a regional identifier
        recognition.lang = 'hi-IN';
        recognition.start();
    });

    recognition.onstart = () => {
        isListening = true;
        voiceState.isVoice = true;
        voiceState.isTwoWay = true;
        micBtn.classList.add('listening');
        inputEl.placeholder = 'Listening...';
        finalTranscript = '';
        inputEl.value = '';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Show the real-time transcript looping into the input box
        let separator = (finalTranscript && !finalTranscript.endsWith(' ')) ? ' ' : '';
        inputEl.value = finalTranscript + separator + interimTranscript;

        // Auto-resize the input area naturally
        inputEl.dispatchEvent(new Event('input'));
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        manuallyStopped = true;
        voiceState.isTwoWay = false;
        stopListening();
    };

    recognition.onend = () => {
        stopListening();

        // As soon as the browser detects the user is done talking, automatically submit what they said!
        if (inputEl.value.trim() && voiceState.isVoice && !manuallyStopped) {
            const form = inputEl.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        } else {
            // Nothing cleanly transcribed or we manually killed it
            voiceState.isTwoWay = false;
        }
    };

    function stopListening() {
        isListening = false;
        micBtn.classList.remove('listening');
        inputEl.placeholder = 'Kuch bhi poochho...';
    }

    inputEl.addEventListener('input', (e) => {
        if (e.isTrusted) {
            voiceState.isVoice = false;
            voiceState.isTwoWay = false;
        }
    });
}
